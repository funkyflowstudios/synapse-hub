#!/usr/bin/env tsx
/**
 * API Contract Testing - Automated validation of API contracts
 * Part of Phase 3: Rapid Validation & Testing Systems
 * 
 * This script validates API contracts against OpenAPI specifications
 * and ensures all endpoints conform to their defined contracts.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface APIContractTestResult {
	endpoint: string;
	method: string;
	status: 'PASS' | 'FAIL' | 'SKIP';
	issues: string[];
	responseTime?: number;
}

interface OpenAPISpec {
	openapi: string;
	info: any;
	paths: Record<string, any>;
	components?: any;
}

class APIContractTester {
	private results: APIContractTestResult[] = [];
	private spec: OpenAPISpec | null = null;
	private baseUrl: string;

	constructor(baseUrl: string = 'http://localhost:5173') {
		this.baseUrl = baseUrl;
	}

	async runAllContractTests(): Promise<APIContractTestResult[]> {
		console.log('🔍 Starting API Contract Testing for Synapse-Hub\n');

		// Load OpenAPI specification
		await this.loadOpenAPISpec();

		if (!this.spec) {
			console.log('⚠️  No OpenAPI specification found. Creating basic contract tests.\n');
			await this.createBasicContractTests();
		} else {
			await this.validateOpenAPIContracts();
		}

		this.printContractSummary();
		return this.results;
	}

	private async loadOpenAPISpec(): Promise<void> {
		const possiblePaths = [
			'openapi.json',
			'openapi.yaml',
			'api-spec.json',
			'docs/api.json',
			'src/lib/api/openapi.json'
		];

		for (const specPath of possiblePaths) {
			if (fs.existsSync(specPath)) {
				try {
					const content = fs.readFileSync(specPath, 'utf8');
					this.spec = JSON.parse(content);
					console.log(`📄 Loaded OpenAPI spec from: ${specPath}`);
					return;
				} catch (error) {
					console.log(`⚠️  Failed to parse ${specPath}: ${error}`);
				}
			}
		}
	}

	private async createBasicContractTests(): Promise<void> {
		// Define expected API structure for Synapse-Hub
		const expectedEndpoints = [
			{ path: '/api/health', method: 'GET', description: 'Health check endpoint' },
			{ path: '/api/conversations', method: 'GET', description: 'List conversations' },
			{ path: '/api/conversations', method: 'POST', description: 'Create conversation' },
			{ path: '/api/conversations/:id', method: 'GET', description: 'Get conversation' },
			{ path: '/api/conversations/:id', method: 'PUT', description: 'Update conversation' },
			{ path: '/api/conversations/:id', method: 'DELETE', description: 'Delete conversation' },
			{ path: '/api/messages', method: 'GET', description: 'List messages' },
			{ path: '/api/messages', method: 'POST', description: 'Create message' },
			{ path: '/api/messages/:id', method: 'GET', description: 'Get message' },
			{ path: '/api/auth/login', method: 'POST', description: 'User login' },
			{ path: '/api/auth/logout', method: 'POST', description: 'User logout' },
			{ path: '/api/auth/me', method: 'GET', description: 'Get current user' },
			{ path: '/api/cursors', method: 'GET', description: 'List cursor instances' },
			{ path: '/api/cursors/:id/connect', method: 'POST', description: 'Connect to cursor' }
		];

		for (const endpoint of expectedEndpoints) {
			await this.testEndpointStructure(endpoint);
		}
	}

	private async validateOpenAPIContracts(): Promise<void> {
		if (!this.spec?.paths) return;

		for (const [path, methods] of Object.entries(this.spec.paths)) {
			for (const [method, spec] of Object.entries(methods as any)) {
				if (typeof spec === 'object' && spec !== null) {
					await this.validateEndpointContract(path, method.toUpperCase(), spec);
				}
			}
		}
	}

	private async testEndpointStructure(endpoint: { path: string; method: string; description: string }): Promise<void> {
		const result: APIContractTestResult = {
			endpoint: endpoint.path,
			method: endpoint.method,
			status: 'SKIP',
			issues: []
		};

		// Check if route exists in SvelteKit structure
		const routePath = this.convertToSvelteKitRoute(endpoint.path);
		const routeFiles = this.findRouteFiles(routePath, endpoint.method);

		if (routeFiles.length === 0) {
			result.status = 'FAIL';
			result.issues.push(`No route handler found for ${endpoint.method} ${endpoint.path}`);
		} else {
			// Basic validation that route exists
			result.status = 'PASS';
			console.log(`✅ Route structure exists: ${endpoint.method} ${endpoint.path}`);
		}

		this.results.push(result);
	}

	private async validateEndpointContract(path: string, method: string, spec: any): Promise<void> {
		const result: APIContractTestResult = {
			endpoint: path,
			method,
			status: 'PASS',
			issues: []
		};

		// Validate request schema
		if (spec.requestBody) {
			const requestIssues = this.validateRequestSchema(spec.requestBody);
			result.issues.push(...requestIssues);
		}

		// Validate response schemas
		if (spec.responses) {
			const responseIssues = this.validateResponseSchemas(spec.responses);
			result.issues.push(...responseIssues);
		}

		// Validate parameters
		if (spec.parameters) {
			const paramIssues = this.validateParameters(spec.parameters);
			result.issues.push(...paramIssues);
		}

		// Check if route implementation exists
		const routePath = this.convertToSvelteKitRoute(path);
		const routeFiles = this.findRouteFiles(routePath, method);

		if (routeFiles.length === 0) {
			result.issues.push(`No route implementation found for ${method} ${path}`);
		}

		result.status = result.issues.length > 0 ? 'FAIL' : 'PASS';

		const status = result.status === 'PASS' ? '✅' : '❌';
		console.log(`${status} Contract: ${method} ${path}`);
		
		if (result.issues.length > 0) {
			result.issues.forEach(issue => console.log(`   └─ ${issue}`));
		}

		this.results.push(result);
	}

	private validateRequestSchema(requestBody: any): string[] {
		const issues: string[] = [];

		if (!requestBody.content) {
			issues.push('Request body missing content specification');
			return issues;
		}

		const contentTypes = Object.keys(requestBody.content);
		if (!contentTypes.includes('application/json')) {
			issues.push('No application/json content type defined for request');
		}

		// Validate schema structure
		for (const [contentType, content] of Object.entries(requestBody.content)) {
			if (typeof content === 'object' && content !== null && 'schema' in content) {
				const schemaIssues = this.validateJSONSchema((content as any).schema);
				issues.push(...schemaIssues.map(issue => `Request schema: ${issue}`));
			}
		}

		return issues;
	}

	private validateResponseSchemas(responses: any): string[] {
		const issues: string[] = [];

		// Check for common response codes
		const expectedCodes = ['200', '400', '401', '404', '500'];
		
		for (const code of expectedCodes) {
			if (code in responses) {
				const response = responses[code];
				if (response.content) {
					for (const [contentType, content] of Object.entries(response.content)) {
						if (typeof content === 'object' && content !== null && 'schema' in content) {
							const schemaIssues = this.validateJSONSchema((content as any).schema);
							issues.push(...schemaIssues.map(issue => `Response ${code} schema: ${issue}`));
						}
					}
				}
			}
		}

		return issues;
	}

	private validateParameters(parameters: any[]): string[] {
		const issues: string[] = [];

		for (const param of parameters) {
			if (!param.name) {
				issues.push('Parameter missing name');
			}
			if (!param.in) {
				issues.push(`Parameter ${param.name} missing location (in)`);
			}
			if (param.required === undefined) {
				issues.push(`Parameter ${param.name} missing required specification`);
			}
			if (!param.schema) {
				issues.push(`Parameter ${param.name} missing schema`);
			}
		}

		return issues;
	}

	private validateJSONSchema(schema: any): string[] {
		const issues: string[] = [];

		if (!schema.type) {
			issues.push('Schema missing type');
		}

		if (schema.type === 'object') {
			if (!schema.properties) {
				issues.push('Object schema missing properties');
			}
		}

		if (schema.type === 'array') {
			if (!schema.items) {
				issues.push('Array schema missing items specification');
			}
		}

		return issues;
	}

	private convertToSvelteKitRoute(apiPath: string): string {
		// Convert API path to SvelteKit route structure
		// /api/conversations/:id -> src/routes/api/conversations/[id]
		
		let svelteRoute = apiPath.replace(/^\//, ''); // Remove leading slash
		svelteRoute = svelteRoute.replace(/:(\w+)/g, '[$1]'); // Convert :id to [id]
		
		return `src/routes/${svelteRoute}`;
	}

	private findRouteFiles(routePath: string, method: string): string[] {
		const files: string[] = [];
		
		// SvelteKit route files
		const possibleFiles = [
			`${routePath}/+server.ts`,
			`${routePath}/+server.js`,
			`${routePath}.ts`,
			`${routePath}.js`
		];

		for (const file of possibleFiles) {
			if (fs.existsSync(file)) {
				// Check if file contains the HTTP method
				try {
					const content = fs.readFileSync(file, 'utf8');
					const methodPattern = new RegExp(`export\\s+(async\\s+)?function\\s+${method}`, 'i');
					if (methodPattern.test(content)) {
						files.push(file);
					}
				} catch (error) {
					// File exists but can't read it
				}
			}
		}

		return files;
	}

	private printContractSummary(): void {
		const passed = this.results.filter(r => r.status === 'PASS').length;
		const failed = this.results.filter(r => r.status === 'FAIL').length;
		const skipped = this.results.filter(r => r.status === 'SKIP').length;

		console.log('\n' + '='.repeat(60));
		console.log('🔍 API CONTRACT TEST SUMMARY');
		console.log('='.repeat(60));
		console.log(`Total Endpoints: ${this.results.length}`);
		console.log(`✅ Passed: ${passed}`);
		console.log(`❌ Failed: ${failed}`);
		console.log(`⏭️  Skipped: ${skipped}`);
		console.log('='.repeat(60));

		if (failed > 0) {
			console.log('\n❌ CONTRACT VIOLATIONS:');
			this.results
				.filter(r => r.status === 'FAIL')
				.forEach(result => {
					console.log(`  • ${result.method} ${result.endpoint}:`);
					result.issues.forEach(issue => {
						console.log(`    - ${issue}`);
					});
				});
		}

		if (skipped > 0) {
			console.log('\n⏭️  SKIPPED ENDPOINTS:');
			this.results
				.filter(r => r.status === 'SKIP')
				.forEach(result => {
					console.log(`  • ${result.method} ${result.endpoint}: Implementation pending`);
				});
		}

		console.log(`\n${failed === 0 ? '🎉 All implemented contracts are valid!' : '⚠️  Contract violations found.'}`);
	}

	// Generate OpenAPI specification template
	generateOpenAPITemplate(): string {
		const template = {
			openapi: '3.0.3',
			info: {
				title: 'Synapse-Hub API',
				description: 'API for Synapse-Hub conversation and cursor management system',
				version: '1.0.0'
			},
			servers: [
				{
					url: 'http://localhost:5173',
					description: 'Development server'
				}
			],
			paths: {
				'/api/health': {
					get: {
						summary: 'Health check',
						description: 'Check API health status',
						responses: {
							'200': {
								description: 'API is healthy',
								content: {
									'application/json': {
										schema: {
											type: 'object',
											properties: {
												status: { type: 'string', example: 'healthy' },
												timestamp: { type: 'string', format: 'date-time' }
											}
										}
									}
								}
							}
						}
					}
				},
				'/api/conversations': {
					get: {
						summary: 'List conversations',
						description: 'Get paginated list of conversations',
						parameters: [
							{
								name: 'limit',
								in: 'query',
								schema: { type: 'integer', default: 20 },
								required: false
							},
							{
								name: 'offset',
								in: 'query',
								schema: { type: 'integer', default: 0 },
								required: false
							}
						],
						responses: {
							'200': {
								description: 'List of conversations',
								content: {
									'application/json': {
										schema: {
											type: 'object',
											properties: {
												conversations: {
													type: 'array',
													items: { $ref: '#/components/schemas/Conversation' }
												},
												total: { type: 'integer' },
												limit: { type: 'integer' },
												offset: { type: 'integer' }
											}
										}
									}
								}
							}
						}
					},
					post: {
						summary: 'Create conversation',
						description: 'Create a new conversation',
						requestBody: {
							required: true,
							content: {
								'application/json': {
									schema: {
										type: 'object',
										required: ['title'],
										properties: {
											title: { type: 'string' },
											description: { type: 'string' }
										}
									}
								}
							}
						},
						responses: {
							'201': {
								description: 'Conversation created',
								content: {
									'application/json': {
										schema: { $ref: '#/components/schemas/Conversation' }
									}
								}
							},
							'400': {
								description: 'Invalid request',
								content: {
									'application/json': {
										schema: { $ref: '#/components/schemas/Error' }
									}
								}
							}
						}
					}
				}
			},
			components: {
				schemas: {
					Conversation: {
						type: 'object',
						properties: {
							id: { type: 'string', format: 'uuid' },
							title: { type: 'string' },
							description: { type: 'string' },
							createdAt: { type: 'string', format: 'date-time' },
							updatedAt: { type: 'string', format: 'date-time' },
							messageCount: { type: 'integer' }
						}
					},
					Message: {
						type: 'object',
						properties: {
							id: { type: 'string', format: 'uuid' },
							conversationId: { type: 'string', format: 'uuid' },
							content: { type: 'string' },
							role: { type: 'string', enum: ['user', 'assistant', 'system'] },
							timestamp: { type: 'string', format: 'date-time' }
						}
					},
					Error: {
						type: 'object',
						properties: {
							error: { type: 'string' },
							message: { type: 'string' },
							code: { type: 'string' }
						}
					}
				}
			}
		};

		return JSON.stringify(template, null, 2);
	}

	// Export test results
	exportResults(): string {
		return JSON.stringify({
			timestamp: new Date().toISOString(),
			summary: {
				total: this.results.length,
				passed: this.results.filter(r => r.status === 'PASS').length,
				failed: this.results.filter(r => r.status === 'FAIL').length,
				skipped: this.results.filter(r => r.status === 'SKIP').length
			},
			results: this.results,
			hasOpenAPISpec: this.spec !== null
		}, null, 2);
	}
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
	const tester = new APIContractTester();
	
	// Generate OpenAPI template if it doesn't exist
	if (!fs.existsSync('openapi.json')) {
		console.log('📝 Generating OpenAPI specification template...');
		fs.writeFileSync('openapi.json', tester.generateOpenAPITemplate());
		console.log('✅ OpenAPI template created at: openapi.json\n');
	}

	tester.runAllContractTests().then(results => {
		// Save results
		const outputPath = 'api-contract-test-results.json';
		fs.writeFileSync(outputPath, tester.exportResults());
		console.log(`\n📊 Contract test results saved to: ${outputPath}`);
	}).catch(error => {
		console.error('API contract testing failed:', error);
		process.exit(1);
	});
}

export { APIContractTester, type APIContractTestResult }; 
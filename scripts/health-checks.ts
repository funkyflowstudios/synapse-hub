#!/usr/bin/env tsx
/**
 * Component Health Checks - Health check endpoints/functions for all components
 * Part of Phase 3: Rapid Validation & Testing Systems
 * 
 * This script provides health checks for all major components
 * and services to ensure they are running properly.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

interface HealthCheckResult {
	component: string;
	status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';
	responseTime: number;
	details?: string;
	timestamp: string;
}

interface HealthCheckConfig {
	timeout: number;
	retries: number;
	interval: number;
}

class ComponentHealthChecker {
	private config: HealthCheckConfig;
	private results: HealthCheckResult[] = [];

	constructor(config: Partial<HealthCheckConfig> = {}) {
		this.config = {
			timeout: 5000,
			retries: 3,
			interval: 1000,
			...config
		};
	}

	async runAllHealthChecks(): Promise<HealthCheckResult[]> {
		console.log('🏥 Starting Component Health Checks for Synapse-Hub\n');

		// Core infrastructure checks
		await this.checkDatabaseHealth();
		await this.checkFileSystemHealth();
		await this.checkDependencyHealth();
		
		// Development server checks
		await this.checkDevServerHealth();
		await this.checkWebSocketHealth();
		
		// Frontend component checks
		await this.checkUIComponentHealth();
		await this.checkRoutingHealth();
		await this.checkStateManagementHealth();
		
		// Testing infrastructure checks
		await this.checkTestingHealth();
		await this.checkLintingHealth();
		await this.checkBuildHealth();

		this.printHealthSummary();
		return this.results;
	}

	private async runHealthCheck(
		componentName: string,
		checkFunction: () => Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; details?: string }>
	): Promise<void> {
		const start = Date.now();
		
		try {
			const result = await Promise.race([
				checkFunction(),
				new Promise<{ status: 'DOWN'; details: string }>((_, reject) => 
					setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
				)
			]);

			this.results.push({
				component: componentName,
				status: result.status,
				responseTime: Date.now() - start,
				details: result.details,
				timestamp: new Date().toISOString()
			});

			const statusEmoji = result.status === 'HEALTHY' ? '🟢' : 
							   result.status === 'DEGRADED' ? '🟡' : '🔴';
			console.log(`${statusEmoji} ${componentName}: ${result.status} (${Date.now() - start}ms)`);
			if (result.details) {
				console.log(`   └─ ${result.details}`);
			}

		} catch (error) {
			this.results.push({
				component: componentName,
				status: 'DOWN',
				responseTime: Date.now() - start,
				details: error instanceof Error ? error.message : String(error),
				timestamp: new Date().toISOString()
			});

			console.log(`🔴 ${componentName}: DOWN (${Date.now() - start}ms)`);
			console.log(`   └─ ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async checkDatabaseHealth(): Promise<void> {
		await this.runHealthCheck('Database', async () => {
			const dbPath = path.join(process.cwd(), 'local.db');
			
			if (!fs.existsSync(dbPath)) {
				return { status: 'DOWN', details: 'Database file not found' };
			}

			try {
				const stats = fs.statSync(dbPath);
				const sizeKB = Math.round(stats.size / 1024);
				
				// Check if database is accessible
				const drizzleConfig = path.join(process.cwd(), 'drizzle.config.ts');
				if (!fs.existsSync(drizzleConfig)) {
					return { status: 'DEGRADED', details: 'Drizzle config missing' };
				}

				return { status: 'HEALTHY', details: `Database size: ${sizeKB}KB` };
			} catch (error) {
				return { status: 'DOWN', details: 'Database access error' };
			}
		});
	}

	private async checkFileSystemHealth(): Promise<void> {
		await this.runHealthCheck('File System', async () => {
			const criticalPaths = [
				'src/',
				'node_modules/',
				'package.json',
				'vite.config.ts'
			];

			for (const path of criticalPaths) {
				if (!fs.existsSync(path)) {
					return { status: 'DOWN', details: `Missing critical path: ${path}` };
				}
			}

			// Check write permissions
			try {
				const testFile = '.health-check-test';
				fs.writeFileSync(testFile, 'test');
				fs.unlinkSync(testFile);
			} catch (error) {
				return { status: 'DEGRADED', details: 'Write permissions issue' };
			}

			return { status: 'HEALTHY', details: 'All critical paths accessible' };
		});
	}

	private async checkDependencyHealth(): Promise<void> {
		await this.runHealthCheck('Dependencies', async () => {
			try {
				// Check if node_modules is properly installed
				const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
				const lockFileExists = fs.existsSync('package-lock.json');
				
				if (!lockFileExists) {
					return { status: 'DEGRADED', details: 'No lock file found' };
				}

				// Check for critical dependencies
				const criticalDeps = ['svelte', '@sveltejs/kit', 'vite', 'drizzle-orm'];
				const missingDeps = criticalDeps.filter(dep => 
					!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
				);

				if (missingDeps.length > 0) {
					return { status: 'DOWN', details: `Missing dependencies: ${missingDeps.join(', ')}` };
				}

				return { status: 'HEALTHY', details: 'All critical dependencies present' };
			} catch (error) {
				return { status: 'DOWN', details: 'Package.json read error' };
			}
		});
	}

	private async checkDevServerHealth(): Promise<void> {
		await this.runHealthCheck('Dev Server', async () => {
			// Check if dev server is running on typical ports
			const commonPorts = [5173, 3000, 4173];
			
			for (const port of commonPorts) {
				try {
					const isRunning = await this.checkPort('localhost', port);
					if (isRunning) {
						return { status: 'HEALTHY', details: `Running on port ${port}` };
					}
				} catch (error) {
					// Continue to next port
				}
			}

			// If no server running, check if it can be started
			try {
				// This is a health check, so we won't actually start the server
				// Instead, check if the start command exists
				const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
				if (!packageJson.scripts?.dev) {
					return { status: 'DOWN', details: 'No dev script configured' };
				}

				return { status: 'DEGRADED', details: 'Server not running but can be started' };
			} catch (error) {
				return { status: 'DOWN', details: 'Cannot determine server status' };
			}
		});
	}

	private async checkWebSocketHealth(): Promise<void> {
		await this.runHealthCheck('WebSocket', async () => {
			// WebSocket implementation pending
			// For now, check if WebSocket infrastructure exists
			const libPath = path.join(process.cwd(), 'src/lib');
			
			if (!fs.existsSync(libPath)) {
				return { status: 'DOWN', details: 'Lib directory missing' };
			}

			// Check for WebSocket-related files (will be implemented later)
			return { status: 'DEGRADED', details: 'WebSocket implementation pending' };
		});
	}

	private async checkUIComponentHealth(): Promise<void> {
		await this.runHealthCheck('UI Components', async () => {
			try {
				// Check Svelte compilation
				execSync('npx svelte-check --threshold error', { stdio: 'pipe' });
				
				const componentsPath = path.join(process.cwd(), 'src/components');
				if (!fs.existsSync(componentsPath)) {
					return { status: 'DOWN', details: 'Components directory missing' };
				}

				// Count components
				const componentCount = this.countSvelteFiles(componentsPath);
				
				return { status: 'HEALTHY', details: `${componentCount} components compiled successfully` };
			} catch (error) {
				return { status: 'DEGRADED', details: 'Svelte compilation issues' };
			}
		});
	}

	private async checkRoutingHealth(): Promise<void> {
		await this.runHealthCheck('Routing', async () => {
			const routesPath = path.join(process.cwd(), 'src/routes');
			
			if (!fs.existsSync(routesPath)) {
				return { status: 'DOWN', details: 'Routes directory missing' };
			}

			const essentialFiles = [
				'+layout.svelte',
				'+page.svelte'
			];

			for (const file of essentialFiles) {
				if (!fs.existsSync(path.join(routesPath, file))) {
					return { status: 'DEGRADED', details: `Missing essential route: ${file}` };
				}
			}

			const routeCount = this.countSvelteFiles(routesPath);
			return { status: 'HEALTHY', details: `${routeCount} route files found` };
		});
	}

	private async checkStateManagementHealth(): Promise<void> {
		await this.runHealthCheck('State Management', async () => {
			// Check for stores and state management
			const libPath = path.join(process.cwd(), 'src/lib');
			
			if (!fs.existsSync(libPath)) {
				return { status: 'DOWN', details: 'Lib directory missing' };
			}

			// Look for store files
			const storePatterns = ['store', 'stores', 'state'];
			let hasStores = false;
			
			for (const pattern of storePatterns) {
				const storePath = path.join(libPath, pattern);
				if (fs.existsSync(storePath)) {
					hasStores = true;
					break;
				}
			}

			if (!hasStores) {
				return { status: 'DEGRADED', details: 'No store files found' };
			}

			return { status: 'HEALTHY', details: 'State management structure present' };
		});
	}

	private async checkTestingHealth(): Promise<void> {
		await this.runHealthCheck('Testing Infrastructure', async () => {
			try {
				// Check if test runner is configured
				const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
				
				if (!packageJson.scripts?.test) {
					return { status: 'DOWN', details: 'No test script configured' };
				}

				// Check for test files
				const testCount = this.countTestFiles('src/');
				const e2eCount = this.countTestFiles('e2e/');

				if (testCount === 0 && e2eCount === 0) {
					return { status: 'DEGRADED', details: 'No test files found' };
				}

				return { 
					status: 'HEALTHY', 
					details: `${testCount} unit tests, ${e2eCount} e2e tests` 
				};
			} catch (error) {
				return { status: 'DOWN', details: 'Testing configuration error' };
			}
		});
	}

	private async checkLintingHealth(): Promise<void> {
		await this.runHealthCheck('Linting', async () => {
			try {
				// Check ESLint configuration
				if (!fs.existsSync('eslint.config.js')) {
					return { status: 'DEGRADED', details: 'No ESLint config found' };
				}

				// Try running linter
				execSync('npm run lint', { stdio: 'pipe' });
				
				return { status: 'HEALTHY', details: 'No linting errors' };
			} catch (error) {
				return { status: 'DEGRADED', details: 'Linting errors found' };
			}
		});
	}

	private async checkBuildHealth(): Promise<void> {
		await this.runHealthCheck('Build System', async () => {
			try {
				const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
				
				if (!packageJson.scripts?.build) {
					return { status: 'DOWN', details: 'No build script configured' };
				}

				// Check if TypeScript compiles
				execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
				
				return { status: 'HEALTHY', details: 'TypeScript compilation successful' };
			} catch (error) {
				return { status: 'DEGRADED', details: 'TypeScript compilation issues' };
			}
		});
	}

	private async checkPort(host: string, port: number): Promise<boolean> {
		return new Promise((resolve) => {
			const req = http.request({
				host,
				port,
				timeout: 1000
			}, () => {
				resolve(true);
			});
			
			req.on('error', () => resolve(false));
			req.on('timeout', () => {
				req.destroy();
				resolve(false);
			});
			
			req.end();
		});
	}

	private countSvelteFiles(directory: string): number {
		if (!fs.existsSync(directory)) return 0;
		
		let count = 0;
		const files = fs.readdirSync(directory, { withFileTypes: true });
		
		for (const file of files) {
			if (file.isDirectory()) {
				count += this.countSvelteFiles(path.join(directory, file.name));
			} else if (file.name.endsWith('.svelte')) {
				count++;
			}
		}
		
		return count;
	}

	private countTestFiles(directory: string): number {
		if (!fs.existsSync(directory)) return 0;
		
		let count = 0;
		const files = fs.readdirSync(directory, { withFileTypes: true });
		
		for (const file of files) {
			if (file.isDirectory()) {
				count += this.countTestFiles(path.join(directory, file.name));
			} else if (file.name.includes('.test.') || file.name.includes('.spec.')) {
				count++;
			}
		}
		
		return count;
	}

	private printHealthSummary(): void {
		const healthy = this.results.filter(r => r.status === 'HEALTHY').length;
		const degraded = this.results.filter(r => r.status === 'DEGRADED').length;
		const down = this.results.filter(r => r.status === 'DOWN').length;
		const unknown = this.results.filter(r => r.status === 'UNKNOWN').length;

		console.log('\n' + '='.repeat(60));
		console.log('🏥 COMPONENT HEALTH SUMMARY');
		console.log('='.repeat(60));
		console.log(`Total Components: ${this.results.length}`);
		console.log(`🟢 Healthy: ${healthy}`);
		console.log(`🟡 Degraded: ${degraded}`);
		console.log(`🔴 Down: ${down}`);
		console.log(`⚫ Unknown: ${unknown}`);
		console.log('='.repeat(60));

		// Overall system health
		const systemHealth = down > 0 ? 'CRITICAL' :
							 degraded > 0 ? 'DEGRADED' : 'HEALTHY';
		
		const healthEmoji = systemHealth === 'HEALTHY' ? '🟢' : 
						   systemHealth === 'DEGRADED' ? '🟡' : '🔴';
		
		console.log(`\n${healthEmoji} Overall System Health: ${systemHealth}`);

		if (down > 0 || degraded > 0) {
			console.log('\n⚠️  ISSUES FOUND:');
			this.results
				.filter(r => r.status === 'DOWN' || r.status === 'DEGRADED')
				.forEach(result => {
					const emoji = result.status === 'DOWN' ? '🔴' : '🟡';
					console.log(`  ${emoji} ${result.component}: ${result.details || result.status}`);
				});
		}
	}

	// Export results for monitoring systems
	exportResults(format: 'json' | 'prometheus' = 'json'): string {
		if (format === 'json') {
			return JSON.stringify({
				timestamp: new Date().toISOString(),
				summary: {
					total: this.results.length,
					healthy: this.results.filter(r => r.status === 'HEALTHY').length,
					degraded: this.results.filter(r => r.status === 'DEGRADED').length,
					down: this.results.filter(r => r.status === 'DOWN').length,
					unknown: this.results.filter(r => r.status === 'UNKNOWN').length
				},
				results: this.results
			}, null, 2);
		}

		// Prometheus format
		const metrics = this.results.map(result => {
			const statusValue = result.status === 'HEALTHY' ? 1 : 
							   result.status === 'DEGRADED' ? 0.5 : 0;
			return `synapse_hub_component_health{component="${result.component}"} ${statusValue}`;
		}).join('\n');

		return `# TYPE synapse_hub_component_health gauge\n${metrics}`;
	}
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
	const checker = new ComponentHealthChecker();
	checker.runAllHealthChecks().then(results => {
		// Save results to file
		const outputPath = 'health-check-results.json';
		fs.writeFileSync(outputPath, checker.exportResults());
		console.log(`\n📊 Health check results saved to: ${outputPath}`);
	}).catch(error => {
		console.error('Health check runner failed:', error);
		process.exit(1);
	});
}

export { ComponentHealthChecker, type HealthCheckResult, type HealthCheckConfig }; 
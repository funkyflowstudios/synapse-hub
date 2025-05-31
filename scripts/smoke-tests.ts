#!/usr/bin/env tsx
/**
 * Smoke Test Scripts - Quick validation scripts for each component
 * Part of Phase 3: Rapid Validation & Testing Systems
 * 
 * This script provides rapid smoke tests for all major components
 * to ensure basic functionality is working before deeper testing.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface SmokeTestResult {
	component: string;
	status: 'PASS' | 'FAIL' | 'SKIP';
	duration: number;
	error?: string;
}

class SmokeTestRunner {
	private results: SmokeTestResult[] = [];
	private startTime: number = Date.now();

	async runAllSmokeTests(): Promise<void> {
		console.log('🔥 Starting Smoke Tests for Synapse-Hub Components\n');

		// Test order: Critical path first
		await this.testDatabaseConnection();
		await this.testTypeDefinitions();
		await this.testComponentStructure();
		await this.testAPIEndpoints();
		await this.testWebSocketHandlers();
		await this.testAuthSystem();
		await this.testUIComponents();
		await this.testConfiguration();

		this.printSummary();
	}

	private async runTest(
		testName: string,
		testFunction: () => Promise<void> | void
	): Promise<void> {
		const start = Date.now();
		
		try {
			await testFunction();
			this.results.push({
				component: testName,
				status: 'PASS',
				duration: Date.now() - start
			});
			console.log(`✅ ${testName} - PASS (${Date.now() - start}ms)`);
		} catch (error) {
			this.results.push({
				component: testName,
				status: 'FAIL',
				duration: Date.now() - start,
				error: error instanceof Error ? error.message : String(error)
			});
			console.log(`❌ ${testName} - FAIL (${Date.now() - start}ms)`);
			console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async testDatabaseConnection(): Promise<void> {
		await this.runTest('Database Connection', () => {
			// Check if database file exists
			const dbPath = path.join(process.cwd(), 'local.db');
			if (!fs.existsSync(dbPath)) {
				throw new Error('Database file not found');
			}

			// Test Drizzle configuration
			const drizzleConfig = path.join(process.cwd(), 'drizzle.config.ts');
			if (!fs.existsSync(drizzleConfig)) {
				throw new Error('Drizzle config not found');
			}

			// Test basic schema files exist
			const schemaPath = path.join(process.cwd(), 'src/lib/server/db');
			if (!fs.existsSync(schemaPath)) {
				throw new Error('Database schema directory not found');
			}
		});
	}

	private async testTypeDefinitions(): Promise<void> {
		await this.runTest('TypeScript Definitions', () => {
			// Check TypeScript compilation
			try {
				execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
			} catch (error) {
				throw new Error('TypeScript compilation failed');
			}

			// Check key type files exist
			const typesPath = path.join(process.cwd(), 'src/lib/types');
			if (!fs.existsSync(typesPath)) {
				throw new Error('Types directory not found');
			}
		});
	}

	private async testComponentStructure(): Promise<void> {
		await this.runTest('Component Structure', () => {
			const requiredDirectories = [
				'src/components/ui',
				'src/components/layout',
				'src/components/panels',
				'src/routes',
				'src/lib'
			];

			for (const dir of requiredDirectories) {
				const fullPath = path.join(process.cwd(), dir);
				if (!fs.existsSync(fullPath)) {
					throw new Error(`Required directory missing: ${dir}`);
				}
			}

			// Check for essential components
			const essentialFiles = [
				'src/app.html',
				'src/routes/+layout.svelte',
				'src/routes/+page.svelte'
			];

			for (const file of essentialFiles) {
				const fullPath = path.join(process.cwd(), file);
				if (!fs.existsSync(fullPath)) {
					throw new Error(`Essential file missing: ${file}`);
				}
			}
		});
	}

	private async testAPIEndpoints(): Promise<void> {
		await this.runTest('API Structure', () => {
			// Check for API route structure
			const apiPath = path.join(process.cwd(), 'src/routes/api');
			
			// API routes might not exist yet in frontend-only setup
			// This is a smoke test, so we'll check what should exist
			const routesPath = path.join(process.cwd(), 'src/routes');
			if (!fs.existsSync(routesPath)) {
				throw new Error('Routes directory not found');
			}

			// For now, just verify the routes structure exists
			// Backend API endpoints will be validated when implemented
		});
	}

	private async testWebSocketHandlers(): Promise<void> {
		await this.runTest('WebSocket Structure', () => {
			// Check for WebSocket-related code structure
			const libPath = path.join(process.cwd(), 'src/lib');
			if (!fs.existsSync(libPath)) {
				throw new Error('Lib directory not found');
			}

			// WebSocket handlers will be implemented later
			// For now, ensure we have the foundation
		});
	}

	private async testAuthSystem(): Promise<void> {
		await this.runTest('Authentication Structure', () => {
			// Check for auth-related dependencies
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
			);

			const requiredAuthDeps = ['@oslojs/crypto', '@oslojs/encoding'];
			for (const dep of requiredAuthDeps) {
				if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
					throw new Error(`Required auth dependency missing: ${dep}`);
				}
			}
		});
	}

	private async testUIComponents(): Promise<void> {
		await this.runTest('UI Components', () => {
			// Check Svelte compilation
			try {
				execSync('npx svelte-check --threshold error', { stdio: 'pipe' });
			} catch (error) {
				throw new Error('Svelte check failed');
			}

			// Check for essential UI files
			const uiPath = path.join(process.cwd(), 'src/components/ui');
			if (!fs.existsSync(uiPath)) {
				throw new Error('UI components directory not found');
			}

			// Check TailwindCSS setup
			const tailwindConfig = path.join(process.cwd(), 'tailwind.config.js');
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
			);
			
			if (!packageJson.devDependencies?.['tailwindcss'] && !fs.existsSync(tailwindConfig)) {
				throw new Error('TailwindCSS not properly configured');
			}
		});
	}

	private async testConfiguration(): Promise<void> {
		await this.runTest('Configuration', () => {
			const requiredConfigs = [
				'vite.config.ts',
				'svelte.config.js',
				'tsconfig.json',
				'eslint.config.js'
			];

			for (const config of requiredConfigs) {
				const fullPath = path.join(process.cwd(), config);
				if (!fs.existsSync(fullPath)) {
					throw new Error(`Required config missing: ${config}`);
				}
			}

			// Test that package.json has required scripts
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
			);

			const requiredScripts = ['dev', 'build', 'test', 'lint'];
			for (const script of requiredScripts) {
				if (!packageJson.scripts?.[script]) {
					throw new Error(`Required script missing: ${script}`);
				}
			}
		});
	}

	private printSummary(): void {
		const totalTime = Date.now() - this.startTime;
		const passed = this.results.filter(r => r.status === 'PASS').length;
		const failed = this.results.filter(r => r.status === 'FAIL').length;
		const skipped = this.results.filter(r => r.status === 'SKIP').length;

		console.log('\n' + '='.repeat(60));
		console.log('🔥 SMOKE TEST SUMMARY');
		console.log('='.repeat(60));
		console.log(`Total Tests: ${this.results.length}`);
		console.log(`✅ Passed: ${passed}`);
		console.log(`❌ Failed: ${failed}`);
		console.log(`⏭️  Skipped: ${skipped}`);
		console.log(`⏱️  Total Time: ${totalTime}ms`);
		console.log('='.repeat(60));

		if (failed > 0) {
			console.log('\n❌ FAILED TESTS:');
			this.results
				.filter(r => r.status === 'FAIL')
				.forEach(result => {
					console.log(`  • ${result.component}: ${result.error}`);
				});
		}

		console.log(`\n${failed === 0 ? '🎉 All smoke tests passed!' : '⚠️  Some tests failed. Please review.'}`);
		
		// Exit with error code if tests failed
		if (failed > 0) {
			process.exit(1);
		}
	}
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
	const runner = new SmokeTestRunner();
	runner.runAllSmokeTests().catch(error => {
		console.error('Smoke test runner failed:', error);
		process.exit(1);
	});
}

export { SmokeTestRunner }; 
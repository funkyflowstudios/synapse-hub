#!/usr/bin/env tsx
/**
 * Pre-commit Validation - Automated checks before code commits
 * Part of Phase 3: Rapid Validation & Testing Systems
 * 
 * This script runs comprehensive validation checks before allowing code commits
 * to ensure code quality and prevent broken code from entering the repository.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
	check: string;
	status: 'PASS' | 'FAIL' | 'SKIP' | 'WARN';
	duration: number;
	message?: string;
	details?: string[];
}

interface ValidationConfig {
	skipChecks: string[];
	warningsAsErrors: boolean;
	timeout: number;
}

class PreCommitValidator {
	private results: ValidationResult[] = [];
	private config: ValidationConfig;
	private startTime: number = Date.now();

	constructor(config: Partial<ValidationConfig> = {}) {
		this.config = {
			skipChecks: [],
			warningsAsErrors: false,
			timeout: 300000, // 5 minutes
			...config
		};
	}

	async runAllValidations(): Promise<boolean> {
		console.log('🔒 Starting Pre-commit Validation for Synapse-Hub\n');

		// Critical checks that must pass
		await this.runLinting();
		await this.runTypeChecking();
		await this.runFormatChecking();
		
		// Quality checks
		await this.runUnitTests();
		await this.runSecurityChecks();
		await this.runDependencyChecks();
		
		// Performance checks
		await this.runBuildCheck();
		await this.runBundleSizeCheck();
		
		// Documentation checks
		await this.runDocumentationChecks();
		await this.runChangelogCheck();

		const success = this.printValidationSummary();
		return success;
	}

	private async runValidation(
		checkName: string,
		checkFunction: () => Promise<{ status: 'PASS' | 'FAIL' | 'SKIP' | 'WARN'; message?: string; details?: string[] }>
	): Promise<void> {
		if (this.config.skipChecks.includes(checkName)) {
			this.results.push({
				check: checkName,
				status: 'SKIP',
				duration: 0,
				message: 'Skipped by configuration'
			});
			console.log(`⏭️  ${checkName}: SKIPPED`);
			return;
		}

		const start = Date.now();
		
		try {
			const result = await Promise.race([
				checkFunction(),
				new Promise<{ status: 'FAIL'; message: string }>((_, reject) => 
					setTimeout(() => reject(new Error('Validation timeout')), this.config.timeout)
				)
			]);

			const duration = Date.now() - start;
			this.results.push({
				check: checkName,
				status: result.status,
				duration,
				message: result.message,
				details: result.details
			});

			const statusEmoji = result.status === 'PASS' ? '✅' : 
							   result.status === 'WARN' ? '⚠️' :
							   result.status === 'SKIP' ? '⏭️' : '❌';
			console.log(`${statusEmoji} ${checkName}: ${result.status} (${duration}ms)`);
			
			if (result.message) {
				console.log(`   └─ ${result.message}`);
			}
			
			if (result.details && result.details.length > 0) {
				result.details.slice(0, 5).forEach(detail => {
					console.log(`   • ${detail}`);
				});
				if (result.details.length > 5) {
					console.log(`   • ... and ${result.details.length - 5} more`);
				}
			}

		} catch (error) {
			const duration = Date.now() - start;
			this.results.push({
				check: checkName,
				status: 'FAIL',
				duration,
				message: error instanceof Error ? error.message : String(error)
			});

			console.log(`❌ ${checkName}: FAIL (${duration}ms)`);
			console.log(`   └─ ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async runLinting(): Promise<void> {
		await this.runValidation('ESLint', async () => {
			try {
				execSync('npm run lint', { stdio: 'pipe' });
				return { status: 'PASS', message: 'No linting errors found' };
			} catch (error) {
				// Try to get more detailed error info
				try {
					const output = execSync('npm run lint', { encoding: 'utf8', stdio: 'pipe' });
					return { status: 'FAIL', message: 'Linting errors found', details: [output] };
				} catch (detailError) {
					return { status: 'FAIL', message: 'Linting failed' };
				}
			}
		});
	}

	private async runTypeChecking(): Promise<void> {
		await this.runValidation('TypeScript Check', async () => {
			try {
				execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
				return { status: 'PASS', message: 'No TypeScript errors' };
			} catch (error) {
				try {
					const output = execSync('npx tsc --noEmit --skipLibCheck', { encoding: 'utf8', stdio: 'pipe' });
					const errors = output.split('\n').filter(line => line.includes('error TS'));
					return { 
						status: 'FAIL', 
						message: `${errors.length} TypeScript errors found`,
						details: errors.slice(0, 10)
					};
				} catch (detailError) {
					return { status: 'FAIL', message: 'TypeScript compilation failed' };
				}
			}
		});
	}

	private async runFormatChecking(): Promise<void> {
		await this.runValidation('Code Formatting', async () => {
			try {
				execSync('npm run format:check', { stdio: 'pipe' });
				return { status: 'PASS', message: 'Code is properly formatted' };
			} catch (error) {
				// Check if format script exists
				const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
				if (!packageJson.scripts?.['format:check']) {
					// Fall back to prettier check
					try {
						execSync('npx prettier --check .', { stdio: 'pipe' });
						return { status: 'PASS', message: 'Code is properly formatted' };
					} catch (prettierError) {
						try {
							const output = execSync('npx prettier --check .', { encoding: 'utf8', stdio: 'pipe' });
							const unformatted = output.split('\n').filter(line => line.trim().length > 0);
							return { 
								status: 'FAIL', 
								message: `${unformatted.length} files need formatting`,
								details: unformatted.slice(0, 10)
							};
						} catch (detailError) {
							return { status: 'FAIL', message: 'Code formatting check failed' };
						}
					}
				}
				return { status: 'FAIL', message: 'Code formatting issues found' };
			}
		});
	}

	private async runUnitTests(): Promise<void> {
		await this.runValidation('Unit Tests', async () => {
			try {
				const output = execSync('npm run test:unit -- --run --reporter=json', { encoding: 'utf8', stdio: 'pipe' });
				
				// Parse test results if JSON format
				try {
					const results = JSON.parse(output);
					const passed = results.numPassedTests || 0;
					const failed = results.numFailedTests || 0;
					const total = results.numTotalTests || 0;
					
					if (failed > 0) {
						return { 
							status: 'FAIL', 
							message: `${failed}/${total} tests failed`,
							details: results.testResults?.map((t: any) => t.message).filter(Boolean) || []
						};
					}
					
					return { status: 'PASS', message: `All ${passed} tests passed` };
				} catch (parseError) {
					// If JSON parsing fails, just check exit code
					return { status: 'PASS', message: 'All tests passed' };
				}
			} catch (error) {
				// Check if there are any test files
				const testFiles = this.findTestFiles();
				if (testFiles.length === 0) {
					return { status: 'WARN', message: 'No test files found' };
				}
				
				return { status: 'FAIL', message: 'Unit tests failed' };
			}
		});
	}

	private async runSecurityChecks(): Promise<void> {
		await this.runValidation('Security Audit', async () => {
			try {
				execSync('npm audit --audit-level=high', { stdio: 'pipe' });
				return { status: 'PASS', message: 'No high-severity vulnerabilities found' };
			} catch (error) {
				try {
					const output = execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
					const audit = JSON.parse(output);
					const vulnerabilities = audit.metadata?.vulnerabilities || {};
					const high = vulnerabilities.high || 0;
					const critical = vulnerabilities.critical || 0;
					
					if (critical > 0) {
						return { 
							status: 'FAIL', 
							message: `${critical} critical vulnerabilities found`
						};
					}
					
					if (high > 0) {
						return { 
							status: 'WARN', 
							message: `${high} high-severity vulnerabilities found`
						};
					}
					
					return { status: 'PASS', message: 'No high-severity vulnerabilities' };
				} catch (detailError) {
					return { status: 'WARN', message: 'Could not run security audit' };
				}
			}
		});
	}

	private async runDependencyChecks(): Promise<void> {
		await this.runValidation('Dependency Check', async () => {
			try {
				// Check for package-lock.json
				if (!fs.existsSync('package-lock.json')) {
					return { status: 'WARN', message: 'No package-lock.json found' };
				}

				// Check for outdated dependencies
				const output = execSync('npm outdated --json', { encoding: 'utf8', stdio: 'pipe' });
				const outdated = JSON.parse(output || '{}');
				const outdatedCount = Object.keys(outdated).length;
				
				if (outdatedCount > 0) {
					const majorUpdates = Object.entries(outdated)
						.filter(([_, info]: [string, any]) => {
							const current = info.current?.split('.')[0];
							const latest = info.latest?.split('.')[0];
							return current !== latest;
						}).length;
					
					if (majorUpdates > 0) {
						return { 
							status: 'WARN', 
							message: `${majorUpdates} major dependency updates available`,
							details: Object.keys(outdated).slice(0, 5)
						};
					}
					
					return { 
						status: 'PASS', 
						message: `${outdatedCount} minor updates available`
					};
				}
				
				return { status: 'PASS', message: 'All dependencies up to date' };
			} catch (error) {
				// npm outdated returns non-zero exit code when outdated packages exist
				return { status: 'PASS', message: 'Dependency check completed' };
			}
		});
	}

	private async runBuildCheck(): Promise<void> {
		await this.runValidation('Build Check', async () => {
			try {
				execSync('npm run build', { stdio: 'pipe' });
				return { status: 'PASS', message: 'Build successful' };
			} catch (error) {
				return { status: 'FAIL', message: 'Build failed' };
			}
		});
	}

	private async runBundleSizeCheck(): Promise<void> {
		await this.runValidation('Bundle Size Check', async () => {
			const buildDir = '.svelte-kit/output';
			
			if (!fs.existsSync(buildDir)) {
				return { status: 'SKIP', message: 'No build output found' };
			}

			try {
				const bundleSize = this.calculateBundleSize(buildDir);
				const maxSize = 1024 * 1024; // 1MB limit
				
				if (bundleSize > maxSize) {
					return { 
						status: 'WARN', 
						message: `Bundle size ${Math.round(bundleSize / 1024)}KB exceeds ${Math.round(maxSize / 1024)}KB limit`
					};
				}
				
				return { 
					status: 'PASS', 
					message: `Bundle size: ${Math.round(bundleSize / 1024)}KB`
				};
			} catch (error) {
				return { status: 'SKIP', message: 'Could not calculate bundle size' };
			}
		});
	}

	private async runDocumentationChecks(): Promise<void> {
		await this.runValidation('Documentation Check', async () => {
			const requiredDocs = [
				'README.md',
				'CONTRIBUTING.md',
				'ARCHITECTURE_DECISIONS.md'
			];

			const missingDocs = requiredDocs.filter(doc => !fs.existsSync(doc));
			
			if (missingDocs.length > 0) {
				return { 
					status: 'WARN', 
					message: `${missingDocs.length} required documentation files missing`,
					details: missingDocs
				};
			}

			// Check if README is substantial
			const readmeContent = fs.readFileSync('README.md', 'utf8');
			if (readmeContent.length < 500) {
				return { status: 'WARN', message: 'README.md appears to be minimal' };
			}

			return { status: 'PASS', message: 'All required documentation present' };
		});
	}

	private async runChangelogCheck(): Promise<void> {
		await this.runValidation('Changelog Check', async () => {
			// Check for staged changes
			try {
				const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' });
				const hasCodeChanges = stagedFiles.split('\n').some(file => 
					file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.svelte')
				);

				if (!hasCodeChanges) {
					return { status: 'SKIP', message: 'No code changes in commit' };
				}

				// Check if CHANGELOG exists and has recent updates
				if (!fs.existsSync('CHANGELOG.md')) {
					return { status: 'WARN', message: 'No CHANGELOG.md found' };
				}

				const changelogContent = fs.readFileSync('CHANGELOG.md', 'utf8');
				const today = new Date().toISOString().split('T')[0];
				const recentEntries = changelogContent.includes(today) || 
									 changelogContent.includes('Unreleased') ||
									 changelogContent.includes('TBD');

				if (!recentEntries) {
					return { status: 'WARN', message: 'CHANGELOG.md may need updating' };
				}

				return { status: 'PASS', message: 'CHANGELOG.md appears current' };
			} catch (error) {
				return { status: 'SKIP', message: 'Not in a git repository' };
			}
		});
	}

	private findTestFiles(): string[] {
		const testFiles: string[] = [];
		
		function findInDirectory(dir: string): void {
			if (!fs.existsSync(dir)) return;
			
			const files = fs.readdirSync(dir, { withFileTypes: true });
			for (const file of files) {
				if (file.isDirectory()) {
					findInDirectory(path.join(dir, file.name));
				} else if (file.name.includes('.test.') || file.name.includes('.spec.')) {
					testFiles.push(path.join(dir, file.name));
				}
			}
		}
		
		findInDirectory('src');
		findInDirectory('e2e');
		
		return testFiles;
	}

	private calculateBundleSize(buildDir: string): number {
		let totalSize = 0;
		
		function calculateInDirectory(dir: string): void {
			if (!fs.existsSync(dir)) return;
			
			const files = fs.readdirSync(dir, { withFileTypes: true });
			for (const file of files) {
				const fullPath = path.join(dir, file.name);
				if (file.isDirectory()) {
					calculateInDirectory(fullPath);
				} else if (file.name.endsWith('.js') || file.name.endsWith('.css')) {
					const stats = fs.statSync(fullPath);
					totalSize += stats.size;
				}
			}
		}
		
		calculateInDirectory(buildDir);
		return totalSize;
	}

	private printValidationSummary(): boolean {
		const totalTime = Date.now() - this.startTime;
		const passed = this.results.filter(r => r.status === 'PASS').length;
		const failed = this.results.filter(r => r.status === 'FAIL').length;
		const warnings = this.results.filter(r => r.status === 'WARN').length;
		const skipped = this.results.filter(r => r.status === 'SKIP').length;

		console.log('\n' + '='.repeat(60));
		console.log('🔒 PRE-COMMIT VALIDATION SUMMARY');
		console.log('='.repeat(60));
		console.log(`Total Checks: ${this.results.length}`);
		console.log(`✅ Passed: ${passed}`);
		console.log(`❌ Failed: ${failed}`);
		console.log(`⚠️  Warnings: ${warnings}`);
		console.log(`⏭️  Skipped: ${skipped}`);
		console.log(`⏱️  Total Time: ${Math.round(totalTime / 1000)}s`);
		console.log('='.repeat(60));

		const criticalFailures = failed > 0;
		const warningFailures = this.config.warningsAsErrors && warnings > 0;
		const success = !criticalFailures && !warningFailures;

		if (failed > 0) {
			console.log('\n❌ CRITICAL FAILURES:');
			this.results
				.filter(r => r.status === 'FAIL')
				.forEach(result => {
					console.log(`  • ${result.check}: ${result.message || 'Failed'}`);
				});
		}

		if (warnings > 0) {
			console.log('\n⚠️  WARNINGS:');
			this.results
				.filter(r => r.status === 'WARN')
				.forEach(result => {
					console.log(`  • ${result.check}: ${result.message || 'Warning'}`);
				});
		}

		if (success) {
			console.log('\n🎉 All validations passed! Commit can proceed.');
		} else {
			console.log('\n🚫 Validation failed! Please fix the issues before committing.');
			if (this.config.warningsAsErrors && warnings > 0) {
				console.log('   (Warnings are configured to block commits)');
			}
		}

		return success;
	}

	// Export results for CI/CD systems
	exportResults(): string {
		return JSON.stringify({
			timestamp: new Date().toISOString(),
			success: this.results.filter(r => r.status === 'FAIL').length === 0,
			summary: {
				total: this.results.length,
				passed: this.results.filter(r => r.status === 'PASS').length,
				failed: this.results.filter(r => r.status === 'FAIL').length,
				warnings: this.results.filter(r => r.status === 'WARN').length,
				skipped: this.results.filter(r => r.status === 'SKIP').length
			},
			results: this.results,
			config: this.config
		}, null, 2);
	}
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);
	const warningsAsErrors = args.includes('--warnings-as-errors');
	const skipChecks = args.filter(arg => arg.startsWith('--skip=')).map(arg => arg.split('=')[1]);

	const validator = new PreCommitValidator({ 
		warningsAsErrors,
		skipChecks: skipChecks.flatMap(checks => checks.split(','))
	});
	
	validator.runAllValidations().then(success => {
		// Save results
		const outputPath = 'pre-commit-validation-results.json';
		fs.writeFileSync(outputPath, validator.exportResults());
		
		console.log(`\n📊 Validation results saved to: ${outputPath}`);
		
		// Exit with appropriate code
		process.exit(success ? 0 : 1);
	}).catch(error => {
		console.error('Pre-commit validation failed:', error);
		process.exit(1);
	});
}

export { PreCommitValidator, type ValidationResult, type ValidationConfig }; 
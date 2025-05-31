#!/usr/bin/env node

/**
 * Automated Dependency Management System
 * 
 * Provides automated dependency updates with comprehensive testing validation.
 * Part of Phase 7: Advanced Automation & Future-Proofing
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface DependencyInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  type: 'dependencies' | 'devDependencies';
  updateType: 'major' | 'minor' | 'patch';
  hasVulnerabilities: boolean;
  testResults?: {
    unit: boolean;
    integration: boolean;
    e2e: boolean;
    build: boolean;
  };
}

interface UpdateStrategy {
  allowMajor: boolean;
  allowMinor: boolean;
  allowPatch: boolean;
  requireAllTestsPass: boolean;
  rollbackOnFailure: boolean;
  batchSize: number;
}

class DependencyManager {
  private packageJsonPath: string;
  private lockFilePath: string;
  private backupPath: string;
  private strategy: UpdateStrategy;

  constructor() {
    this.packageJsonPath = join(process.cwd(), 'package.json');
    this.lockFilePath = join(process.cwd(), 'package-lock.json');
    this.backupPath = join(process.cwd(), '.dependency-backup');
    this.strategy = {
      allowMajor: false,
      allowMinor: true,
      allowPatch: true,
      requireAllTestsPass: true,
      rollbackOnFailure: true,
      batchSize: 5
    };
  }

  /**
   * Main entry point for dependency management
   */
  async manageDependencies(): Promise<void> {
    console.log('🔄 Starting Automated Dependency Management...');
    
    try {
      // Create backup
      await this.createBackup();
      
      // Check for outdated dependencies
      const outdatedDeps = await this.checkOutdatedDependencies();
      
      if (outdatedDeps.length === 0) {
        console.log('✅ All dependencies are up to date!');
        return;
      }

      console.log(`📦 Found ${outdatedDeps.length} outdated dependencies`);
      
      // Filter dependencies based on strategy
      const eligibleUpdates = this.filterEligibleUpdates(outdatedDeps);
      
      if (eligibleUpdates.length === 0) {
        console.log('⏭️  No eligible updates based on current strategy');
        return;
      }

      // Process updates in batches
      const batches = this.createUpdateBatches(eligibleUpdates);
      
      for (let i = 0; i < batches.length; i++) {
        console.log(`\n🔄 Processing batch ${i + 1}/${batches.length}`);
        await this.processBatch(batches[i]);
      }

      console.log('\n✅ Dependency management completed successfully!');
      
    } catch (error) {
      console.error('❌ Dependency management failed:', error);
      await this.rollback();
      throw error;
    }
  }

  /**
   * Check for outdated dependencies using npm outdated
   */
  private async checkOutdatedDependencies(): Promise<DependencyInfo[]> {
    try {
      const output = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdated = JSON.parse(output || '{}');
      
      const dependencies: DependencyInfo[] = [];
      
      for (const [name, info] of Object.entries(outdated as any)) {
        const depInfo: DependencyInfo = {
          name,
          currentVersion: info.current || '0.0.0',
          latestVersion: info.latest || info.wanted,
          type: info.type || 'dependencies',
          updateType: this.determineUpdateType(info.current, info.latest),
          hasVulnerabilities: await this.checkVulnerabilities(name)
        };
        
        dependencies.push(depInfo);
      }
      
      return dependencies;
    } catch (error) {
      // npm outdated returns exit code 1 when there are outdated packages
      if (error.status === 1 && error.stdout) {
        const outdated = JSON.parse(error.stdout);
        // Process the same way as above
        const dependencies: DependencyInfo[] = [];
        
        for (const [name, info] of Object.entries(outdated as any)) {
          const depInfo: DependencyInfo = {
            name,
            currentVersion: info.current || '0.0.0',
            latestVersion: info.latest || info.wanted,
            type: info.type || 'dependencies',
            updateType: this.determineUpdateType(info.current, info.latest),
            hasVulnerabilities: await this.checkVulnerabilities(name)
          };
          
          dependencies.push(depInfo);
        }
        
        return dependencies;
      }
      
      console.warn('Could not check outdated dependencies:', error.message);
      return [];
    }
  }

  /**
   * Determine if update is major, minor, or patch
   */
  private determineUpdateType(current: string, latest: string): 'major' | 'minor' | 'patch' {
    const currentParts = current.replace(/[^\d.]/g, '').split('.').map(Number);
    const latestParts = latest.replace(/[^\d.]/g, '').split('.').map(Number);
    
    if (latestParts[0] > currentParts[0]) return 'major';
    if (latestParts[1] > currentParts[1]) return 'minor';
    return 'patch';
  }

  /**
   * Check for security vulnerabilities
   */
  private async checkVulnerabilities(packageName: string): Promise<boolean> {
    try {
      const output = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(output);
      
      return audit.vulnerabilities && 
             Object.keys(audit.vulnerabilities).some(vuln => 
               audit.vulnerabilities[vuln].name === packageName
             );
    } catch {
      return false;
    }
  }

  /**
   * Filter dependencies based on update strategy
   */
  private filterEligibleUpdates(dependencies: DependencyInfo[]): DependencyInfo[] {
    return dependencies.filter(dep => {
      // Always update if there are vulnerabilities
      if (dep.hasVulnerabilities) return true;
      
      // Filter based on update type preferences
      switch (dep.updateType) {
        case 'major':
          return this.strategy.allowMajor;
        case 'minor':
          return this.strategy.allowMinor;
        case 'patch':
          return this.strategy.allowPatch;
        default:
          return false;
      }
    });
  }

  /**
   * Create update batches based on strategy
   */
  private createUpdateBatches(dependencies: DependencyInfo[]): DependencyInfo[][] {
    const batches: DependencyInfo[][] = [];
    
    for (let i = 0; i < dependencies.length; i += this.strategy.batchSize) {
      batches.push(dependencies.slice(i, i + this.strategy.batchSize));
    }
    
    return batches;
  }

  /**
   * Process a batch of dependency updates
   */
  private async processBatch(batch: DependencyInfo[]): Promise<void> {
    console.log(`📦 Updating dependencies: ${batch.map(d => d.name).join(', ')}`);
    
    // Update dependencies
    for (const dep of batch) {
      await this.updateDependency(dep);
    }
    
    // Run comprehensive tests
    console.log('🧪 Running test suite...');
    const testResults = await this.runTestSuite();
    
    // Update test results for each dependency
    batch.forEach(dep => {
      dep.testResults = testResults;
    });
    
    // Check if all required tests passed
    if (this.strategy.requireAllTestsPass && !this.allTestsPassed(testResults)) {
      console.log('❌ Tests failed, rolling back batch...');
      await this.rollback();
      throw new Error('Test suite failed after dependency updates');
    }
    
    console.log('✅ Batch updated successfully');
  }

  /**
   * Update a single dependency
   */
  private async updateDependency(dep: DependencyInfo): Promise<void> {
    try {
      const command = dep.type === 'devDependencies' 
        ? `npm install --save-dev ${dep.name}@${dep.latestVersion}`
        : `npm install --save ${dep.name}@${dep.latestVersion}`;
      
      execSync(command, { stdio: 'pipe' });
      console.log(`  ✅ Updated ${dep.name}: ${dep.currentVersion} → ${dep.latestVersion}`);
    } catch (error) {
      console.error(`  ❌ Failed to update ${dep.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Run comprehensive test suite
   */
  private async runTestSuite(): Promise<{
    unit: boolean;
    integration: boolean;
    e2e: boolean;
    build: boolean;
  }> {
    const results = {
      unit: false,
      integration: false,
      e2e: false,
      build: false
    };

    try {
      // Build test
      console.log('  🔨 Testing build...');
      execSync('npm run build', { stdio: 'pipe' });
      results.build = true;
      console.log('    ✅ Build successful');
    } catch {
      console.log('    ❌ Build failed');
    }

    try {
      // Unit tests
      console.log('  🧪 Running unit tests...');
      execSync('npm run test:unit -- --run', { stdio: 'pipe' });
      results.unit = true;
      console.log('    ✅ Unit tests passed');
    } catch {
      console.log('    ❌ Unit tests failed');
    }

    try {
      // Integration tests
      console.log('  🔗 Running integration tests...');
      execSync('npm run validate:integration-specs', { stdio: 'pipe' });
      results.integration = true;
      console.log('    ✅ Integration tests passed');
    } catch {
      console.log('    ❌ Integration tests failed');
    }

    try {
      // E2E tests
      console.log('  🎭 Running E2E tests...');
      execSync('npm run test:e2e', { stdio: 'pipe' });
      results.e2e = true;
      console.log('    ✅ E2E tests passed');
    } catch {
      console.log('    ❌ E2E tests failed');
    }

    return results;
  }

  /**
   * Check if all tests passed
   */
  private allTestsPassed(results: any): boolean {
    return results.unit && results.integration && results.e2e && results.build;
  }

  /**
   * Create backup of current state
   */
  private async createBackup(): Promise<void> {
    try {
      execSync(`mkdir -p ${this.backupPath}`);
      execSync(`cp ${this.packageJsonPath} ${this.backupPath}/package.json.backup`);
      
      if (existsSync(this.lockFilePath)) {
        execSync(`cp ${this.lockFilePath} ${this.backupPath}/package-lock.json.backup`);
      }
      
      console.log('💾 Created dependency backup');
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Rollback to previous state
   */
  private async rollback(): Promise<void> {
    if (!this.strategy.rollbackOnFailure) {
      console.log('🚫 Rollback disabled in strategy');
      return;
    }

    try {
      console.log('🔄 Rolling back to previous state...');
      
      const backupPackageJson = join(this.backupPath, 'package.json.backup');
      const backupLockFile = join(this.backupPath, 'package-lock.json.backup');
      
      if (existsSync(backupPackageJson)) {
        execSync(`cp ${backupPackageJson} ${this.packageJsonPath}`);
      }
      
      if (existsSync(backupLockFile)) {
        execSync(`cp ${backupLockFile} ${this.lockFilePath}`);
      }
      
      // Reinstall dependencies
      execSync('npm ci', { stdio: 'pipe' });
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Generate dependency update report
   */
  generateReport(dependencies: DependencyInfo[]): void {
    const report = {
      timestamp: new Date().toISOString(),
      totalDependencies: dependencies.length,
      updatesSummary: {
        major: dependencies.filter(d => d.updateType === 'major').length,
        minor: dependencies.filter(d => d.updateType === 'minor').length,
        patch: dependencies.filter(d => d.updateType === 'patch').length
      },
      vulnerabilities: dependencies.filter(d => d.hasVulnerabilities).length,
      testResults: dependencies.map(d => ({
        name: d.name,
        version: `${d.currentVersion} → ${d.latestVersion}`,
        tests: d.testResults
      }))
    };

    writeFileSync(
      join(process.cwd(), '.dependency-backup', 'update-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('📊 Dependency update report generated');
  }
}

// CLI Interface
if (require.main === module) {
  const manager = new DependencyManager();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'check':
      manager.checkOutdatedDependencies().then(deps => {
        console.log('Outdated dependencies:', deps);
      });
      break;
    
    case 'update':
      manager.manageDependencies().catch(error => {
        console.error('Update failed:', error);
        process.exit(1);
      });
      break;
    
    default:
      console.log(`
🔧 Automated Dependency Management

Usage:
  tsx scripts/automated-dependency-management.ts <command>

Commands:
  check   - Check for outdated dependencies
  update  - Run automated dependency updates with testing

Examples:
  tsx scripts/automated-dependency-management.ts check
  tsx scripts/automated-dependency-management.ts update
      `);
  }
}

export { DependencyManager, DependencyInfo, UpdateStrategy }; 
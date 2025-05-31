#!/usr/bin/env node

/**
 * Security Scanning System
 * 
 * Provides automated security vulnerability scanning for codebase, dependencies, and configurations.
 * Part of Phase 7: Advanced Automation & Future-Proofing
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

interface SecurityVulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'dependency' | 'code' | 'configuration' | 'infrastructure';
  cwe?: string;
  cvss?: number;
  package?: string;
  version?: string;
  file?: string;
  line?: number;
  recommendation: string;
  references: string[];
  detectedAt: Date;
}

interface SecurityScanResult {
  scanId: string;
  timestamp: Date;
  scanType: 'full' | 'dependencies' | 'code' | 'configuration';
  vulnerabilities: SecurityVulnerability[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  duration: number;
  tools: string[];
}

interface SecurityPolicy {
  allowedSeverities: string[];
  excludePatterns: string[];
  requiredScans: string[];
  autoFix: boolean;
  notifications: {
    enabled: boolean;
    channels: string[];
    severityThreshold: string;
  };
  compliance: {
    standards: string[];
    requirements: string[];
  };
}

class SecurityScanner {
  private scansDir: string;
  private resultsDir: string;
  private configPath: string;
  private policyPath: string;

  constructor() {
    this.scansDir = join(process.cwd(), 'security-scans');
    this.resultsDir = join(this.scansDir, 'results');
    this.configPath = join(this.scansDir, 'security-config.json');
    this.policyPath = join(this.scansDir, 'security-policy.json');
    
    this.ensureDirectories();
  }

  /**
   * Initialize security scanning system
   */
  async initialize(): Promise<void> {
    console.log('🔒 Initializing Security Scanning System...');
    
    // Create default configuration
    await this.createDefaultConfiguration();
    
    // Create security policy
    await this.createSecurityPolicy();
    
    // Setup security tools
    await this.setupSecurityTools();
    
    console.log('✅ Security Scanning System initialized');
  }

  /**
   * Create default configuration
   */
  private async createDefaultConfiguration(): Promise<void> {
    if (existsSync(this.configPath)) {
      return;
    }

    const defaultConfig = {
      scanners: {
        npm: {
          enabled: true,
          command: 'npm audit',
          args: ['--json'],
          timeout: 30000
        },
        eslint: {
          enabled: true,
          command: 'npx eslint',
          args: ['--format', 'json', '.'],
          rules: ['@typescript-eslint/no-unsafe-*', 'security/*'],
          timeout: 60000
        },
        bandit: {
          enabled: false, // Python security scanner
          command: 'bandit',
          args: ['-r', '.', '-f', 'json'],
          timeout: 60000
        },
        semgrep: {
          enabled: true,
          command: 'npx semgrep',
          args: ['--config=auto', '--json', '.'],
          timeout: 120000
        },
        dockerfile: {
          enabled: true,
          patterns: ['Dockerfile*', 'docker-compose*.yml'],
          rules: ['security', 'best-practices']
        }
      },
      reporting: {
        formats: ['json', 'html', 'sarif'],
        includeFixSuggestions: true,
        groupBySeverity: true
      },
      integration: {
        cicd: true,
        preCommit: true,
        webhook: null
      }
    };

    writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('📋 Created default security scanning configuration');
  }

  /**
   * Create security policy
   */
  private async createSecurityPolicy(): Promise<void> {
    if (existsSync(this.policyPath)) {
      return;
    }

    const defaultPolicy: SecurityPolicy = {
      allowedSeverities: ['low', 'medium', 'high'], // critical blocks deployment
      excludePatterns: [
        'node_modules/',
        '.git/',
        'dist/',
        'build/',
        '*.test.ts',
        '*.spec.ts'
      ],
      requiredScans: ['dependencies', 'code', 'configuration'],
      autoFix: false,
      notifications: {
        enabled: true,
        channels: ['console', 'file'],
        severityThreshold: 'medium'
      },
      compliance: {
        standards: ['OWASP', 'CWE'],
        requirements: [
          'No critical vulnerabilities in production',
          'High vulnerabilities must be patched within 7 days',
          'Medium vulnerabilities must be reviewed within 30 days'
        ]
      }
    };

    writeFileSync(this.policyPath, JSON.stringify(defaultPolicy, null, 2));
    console.log('📋 Created default security policy');
  }

  /**
   * Setup security scanning tools
   */
  private async setupSecurityTools(): Promise<void> {
    console.log('🛠️  Setting up security tools...');
    
    // Check and install security tools
    const tools = [
      { name: 'npm audit', check: 'npm audit --version', install: null },
      { name: 'ESLint', check: 'npx eslint --version', install: 'npm install -D eslint-plugin-security' },
      { name: 'Semgrep', check: 'npx semgrep --version', install: 'npm install -D semgrep' }
    ];

    for (const tool of tools) {
      try {
        execSync(tool.check, { stdio: 'pipe' });
        console.log(`  ✅ ${tool.name} available`);
      } catch {
        if (tool.install) {
          console.log(`  🔧 Installing ${tool.name}...`);
          try {
            execSync(tool.install, { stdio: 'pipe' });
            console.log(`  ✅ ${tool.name} installed`);
          } catch (error) {
            console.warn(`  ⚠️  Failed to install ${tool.name}:`, error.message);
          }
        } else {
          console.log(`  ℹ️  ${tool.name} not available (built-in)`);
        }
      }
    }

    // Create ESLint security configuration
    await this.createESLintSecurityConfig();
  }

  /**
   * Create ESLint security configuration
   */
  private async createESLintSecurityConfig(): Promise<void> {
    const eslintSecurityConfig = {
      extends: ['plugin:security/recommended'],
      plugins: ['security'],
      rules: {
        'security/detect-buffer-noassert': 'error',
        'security/detect-child-process': 'warn',
        'security/detect-disable-mustache-escape': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-no-csrf-before-method-override': 'error',
        'security/detect-non-literal-fs-filename': 'warn',
        'security/detect-non-literal-regexp': 'warn',
        'security/detect-non-literal-require': 'warn',
        'security/detect-object-injection': 'warn',
        'security/detect-possible-timing-attacks': 'warn',
        'security/detect-pseudoRandomBytes': 'error',
        'security/detect-unsafe-regex': 'error'
      }
    };

    const configPath = join(this.scansDir, 'eslint-security.config.js');
    writeFileSync(
      configPath,
      `module.exports = ${JSON.stringify(eslintSecurityConfig, null, 2)};`
    );
    console.log('⚙️  Created ESLint security configuration');
  }

  /**
   * Run comprehensive security scan
   */
  async runSecurityScan(
    scanType: 'full' | 'dependencies' | 'code' | 'configuration' = 'full'
  ): Promise<SecurityScanResult> {
    const scanId = `scan-${Date.now()}`;
    const startTime = Date.now();
    
    console.log(`🔒 Starting ${scanType} security scan (${scanId})...`);
    
    const vulnerabilities: SecurityVulnerability[] = [];
    const toolsUsed: string[] = [];

    try {
      if (scanType === 'full' || scanType === 'dependencies') {
        const depVulns = await this.scanDependencies();
        vulnerabilities.push(...depVulns);
        toolsUsed.push('npm-audit');
      }

      if (scanType === 'full' || scanType === 'code') {
        const codeVulns = await this.scanCode();
        vulnerabilities.push(...codeVulns);
        toolsUsed.push('eslint-security', 'semgrep');
      }

      if (scanType === 'full' || scanType === 'configuration') {
        const configVulns = await this.scanConfiguration();
        vulnerabilities.push(...configVulns);
        toolsUsed.push('config-analyzer');
      }

    } catch (error) {
      console.error('Security scan failed:', error);
      throw error;
    }

    const duration = Date.now() - startTime;
    
    // Generate summary
    const summary = this.generateSummary(vulnerabilities);
    
    const result: SecurityScanResult = {
      scanId,
      timestamp: new Date(),
      scanType,
      vulnerabilities,
      summary,
      duration,
      tools: toolsUsed
    };

    // Save results
    await this.saveResults(result);
    
    // Generate reports
    await this.generateReports(result);
    
    // Check policy compliance
    await this.checkPolicyCompliance(result);
    
    console.log(`\n🔒 Security Scan Results (${scanId}):`);
    console.log(`  🎯 Vulnerabilities Found: ${summary.total}`);
    console.log(`  🔴 Critical: ${summary.critical}`);
    console.log(`  🟠 High: ${summary.high}`);
    console.log(`  🟡 Medium: ${summary.medium}`);
    console.log(`  🔵 Low: ${summary.low}`);
    console.log(`  ℹ️  Info: ${summary.info}`);
    console.log(`  ⏱️  Duration: ${Math.round(duration / 1000)}s`);

    return result;
  }

  /**
   * Scan dependencies for vulnerabilities
   */
  private async scanDependencies(): Promise<SecurityVulnerability[]> {
    console.log('  📦 Scanning dependencies...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Use npm audit
      const output = execSync('npm audit --json', { encoding: 'utf8' });
      const auditResult = JSON.parse(output);

      if (auditResult.vulnerabilities) {
        for (const [packageName, vuln] of Object.entries(auditResult.vulnerabilities as any)) {
          const vulnerability: SecurityVulnerability = {
            id: `npm-${packageName}-${Date.now()}`,
            title: vuln.title || `Vulnerability in ${packageName}`,
            description: vuln.overview || vuln.title || 'No description available',
            severity: this.mapSeverity(vuln.severity),
            category: 'dependency',
            cwe: vuln.cwe,
            cvss: vuln.cvss?.score,
            package: packageName,
            version: vuln.range || 'unknown',
            recommendation: vuln.recommendation || 'Update to a secure version',
            references: vuln.references?.map((ref: any) => ref.url) || [],
            detectedAt: new Date()
          };
          
          vulnerabilities.push(vulnerability);
        }
      }

    } catch (error) {
      console.warn('    ⚠️  npm audit failed:', error.message);
    }

    console.log(`    📦 Found ${vulnerabilities.length} dependency vulnerabilities`);
    return vulnerabilities;
  }

  /**
   * Scan code for security issues
   */
  private async scanCode(): Promise<SecurityVulnerability[]> {
    console.log('  🔍 Scanning code...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    // ESLint security scan
    try {
      const eslintOutput = execSync(
        `npx eslint --config ${join(this.scansDir, 'eslint-security.config.js')} --format json .`,
        { encoding: 'utf8' }
      );
      
      const eslintResults = JSON.parse(eslintOutput);
      
      for (const file of eslintResults) {
        for (const message of file.messages) {
          if (message.ruleId && message.ruleId.startsWith('security/')) {
            const vulnerability: SecurityVulnerability = {
              id: `eslint-${file.filePath}-${message.line}-${Date.now()}`,
              title: `Security Rule Violation: ${message.ruleId}`,
              description: message.message,
              severity: this.mapESLintSeverity(message.severity),
              category: 'code',
              file: file.filePath,
              line: message.line,
              recommendation: `Fix security issue: ${message.message}`,
              references: [`https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/${message.ruleId.replace('security/', '')}.md`],
              detectedAt: new Date()
            };
            
            vulnerabilities.push(vulnerability);
          }
        }
      }
    } catch (error) {
      console.warn('    ⚠️  ESLint security scan failed:', error.message);
    }

    // Semgrep scan
    try {
      const semgrepOutput = execSync('npx semgrep --config=auto --json .', { 
        encoding: 'utf8',
        timeout: 120000 
      });
      
      const semgrepResults = JSON.parse(semgrepOutput);
      
      if (semgrepResults.results) {
        for (const result of semgrepResults.results) {
          const vulnerability: SecurityVulnerability = {
            id: `semgrep-${result.path}-${result.start.line}-${Date.now()}`,
            title: result.extra?.message || result.check_id,
            description: result.extra?.message || 'Security issue detected by Semgrep',
            severity: this.mapSemgrepSeverity(result.extra?.severity),
            category: 'code',
            cwe: result.extra?.metadata?.cwe?.[0],
            file: result.path,
            line: result.start.line,
            recommendation: result.extra?.fix || 'Review and fix the security issue',
            references: result.extra?.references || [],
            detectedAt: new Date()
          };
          
          vulnerabilities.push(vulnerability);
        }
      }
    } catch (error) {
      console.warn('    ⚠️  Semgrep scan failed:', error.message);
    }

    console.log(`    🔍 Found ${vulnerabilities.length} code vulnerabilities`);
    return vulnerabilities;
  }

  /**
   * Scan configuration files for security issues
   */
  private async scanConfiguration(): Promise<SecurityVulnerability[]> {
    console.log('  ⚙️  Scanning configuration...');
    
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for common configuration issues
    const configChecks = [
      {
        file: '.env',
        pattern: /password|secret|key|token/i,
        issue: 'Hardcoded secrets in environment file'
      },
      {
        file: 'docker-compose.yml',
        pattern: /privileged:\s*true/i,
        issue: 'Privileged Docker container'
      },
      {
        file: 'Dockerfile',
        pattern: /USER root/i,
        issue: 'Running as root user in Docker'
      }
    ];

    for (const check of configChecks) {
      try {
        if (existsSync(check.file)) {
          const content = readFileSync(check.file, 'utf8');
          
          if (check.pattern.test(content)) {
            const vulnerability: SecurityVulnerability = {
              id: `config-${check.file}-${Date.now()}`,
              title: `Configuration Security Issue: ${check.issue}`,
              description: check.issue,
              severity: 'medium',
              category: 'configuration',
              file: check.file,
              recommendation: `Review and secure ${check.file}`,
              references: ['https://owasp.org/www-project-application-security-verification-standard/'],
              detectedAt: new Date()
            };
            
            vulnerabilities.push(vulnerability);
          }
        }
      } catch (error) {
        console.warn(`    ⚠️  Failed to scan ${check.file}:`, error.message);
      }
    }

    // Check package.json for security settings
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      
      if (!packageJson.scripts?.['audit']) {
        const vulnerability: SecurityVulnerability = {
          id: `config-package-audit-${Date.now()}`,
          title: 'Missing Security Audit Script',
          description: 'No npm audit script configured in package.json',
          severity: 'low',
          category: 'configuration',
          file: 'package.json',
          recommendation: 'Add "audit": "npm audit" to scripts section',
          references: [],
          detectedAt: new Date()
        };
        
        vulnerabilities.push(vulnerability);
      }
    } catch (error) {
      console.warn('    ⚠️  Failed to scan package.json:', error.message);
    }

    console.log(`    ⚙️  Found ${vulnerabilities.length} configuration vulnerabilities`);
    return vulnerabilities;
  }

  /**
   * Map severity levels from different tools
   */
  private mapSeverity(severity: string): SecurityVulnerability['severity'] {
    const severityMap: Record<string, SecurityVulnerability['severity']> = {
      'critical': 'critical',
      'high': 'high',
      'moderate': 'medium',
      'medium': 'medium',
      'low': 'low',
      'info': 'info',
      'warning': 'medium',
      'error': 'high'
    };
    
    return severityMap[severity?.toLowerCase()] || 'medium';
  }

  private mapESLintSeverity(severity: number): SecurityVulnerability['severity'] {
    return severity === 2 ? 'high' : 'medium';
  }

  private mapSemgrepSeverity(severity: string): SecurityVulnerability['severity'] {
    const severityMap: Record<string, SecurityVulnerability['severity']> = {
      'ERROR': 'high',
      'WARNING': 'medium',
      'INFO': 'low'
    };
    
    return severityMap[severity?.toUpperCase()] || 'medium';
  }

  /**
   * Generate vulnerability summary
   */
  private generateSummary(vulnerabilities: SecurityVulnerability[]): SecurityScanResult['summary'] {
    const summary = {
      total: vulnerabilities.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };

    vulnerabilities.forEach(vuln => {
      summary[vuln.severity]++;
    });

    return summary;
  }

  /**
   * Save scan results
   */
  private async saveResults(result: SecurityScanResult): Promise<void> {
    const resultPath = join(this.resultsDir, `${result.scanId}.json`);
    writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(`💾 Scan results saved: ${resultPath}`);
  }

  /**
   * Generate security reports
   */
  private async generateReports(result: SecurityScanResult): Promise<void> {
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(result);
    const htmlPath = join(this.resultsDir, `${result.scanId}.html`);
    writeFileSync(htmlPath, htmlReport);
    
    // Generate SARIF report (for CI/CD integration)
    const sarifReport = this.generateSARIFReport(result);
    const sarifPath = join(this.resultsDir, `${result.scanId}.sarif`);
    writeFileSync(sarifPath, JSON.stringify(sarifReport, null, 2));
    
    console.log(`📄 Reports generated: ${htmlPath}, ${sarifPath}`);
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(result: SecurityScanResult): string {
    const criticalVulns = result.vulnerabilities.filter(v => v.severity === 'critical');
    const highVulns = result.vulnerabilities.filter(v => v.severity === 'high');
    const mediumVulns = result.vulnerabilities.filter(v => v.severity === 'medium');
    const lowVulns = result.vulnerabilities.filter(v => v.severity === 'low');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Scan Report - ${result.scanId}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .summary-card { padding: 15px; border-radius: 6px; text-align: center; }
        .critical { background: #fee; border-left: 4px solid #dc3545; }
        .high { background: #fff3cd; border-left: 4px solid #fd7e14; }
        .medium { background: #d1ecf1; border-left: 4px solid #17a2b8; }
        .low { background: #d4edda; border-left: 4px solid #28a745; }
        .vulnerability { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
        .vuln-header { padding: 15px; border-bottom: 1px solid #ddd; }
        .vuln-content { padding: 15px; }
        .severity-badge { padding: 2px 8px; border-radius: 12px; color: white; font-size: 0.8em; font-weight: bold; }
        .severity-critical { background: #dc3545; }
        .severity-high { background: #fd7e14; }
        .severity-medium { background: #17a2b8; }
        .severity-low { background: #28a745; }
        .metadata { background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Security Scan Report</h1>
            <p><strong>Scan ID:</strong> ${result.scanId}</p>
            <p><strong>Type:</strong> ${result.scanType}</p>
            <p><strong>Generated:</strong> ${result.timestamp.toLocaleString()}</p>
            <p><strong>Duration:</strong> ${Math.round(result.duration / 1000)}s</p>
        </div>
        
        <div class="summary">
            <div class="summary-card critical">
                <h3>${result.summary.critical}</h3>
                <p>Critical</p>
            </div>
            <div class="summary-card high">
                <h3>${result.summary.high}</h3>
                <p>High</p>
            </div>
            <div class="summary-card medium">
                <h3>${result.summary.medium}</h3>
                <p>Medium</p>
            </div>
            <div class="summary-card low">
                <h3>${result.summary.low}</h3>
                <p>Low</p>
            </div>
        </div>
        
        ${[...criticalVulns, ...highVulns, ...mediumVulns, ...lowVulns].map(vuln => `
            <div class="vulnerability">
                <div class="vuln-header">
                    <h3>${vuln.title} <span class="severity-badge severity-${vuln.severity}">${vuln.severity.toUpperCase()}</span></h3>
                    <p>${vuln.description}</p>
                </div>
                <div class="vuln-content">
                    <div class="metadata">
                        <strong>Category:</strong> ${vuln.category}<br>
                        ${vuln.package ? `<strong>Package:</strong> ${vuln.package}<br>` : ''}
                        ${vuln.file ? `<strong>File:</strong> ${vuln.file}${vuln.line ? `:${vuln.line}` : ''}<br>` : ''}
                        ${vuln.cwe ? `<strong>CWE:</strong> ${vuln.cwe}<br>` : ''}
                        <strong>Recommendation:</strong> ${vuln.recommendation}
                    </div>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  /**
   * Generate SARIF report for CI/CD integration
   */
  private generateSARIFReport(result: SecurityScanResult): any {
    return {
      version: '2.1.0',
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      runs: [{
        tool: {
          driver: {
            name: 'Synapse Hub Security Scanner',
            version: '1.0.0',
            informationUri: 'https://github.com/synapse-hub/security-scanner'
          }
        },
        results: result.vulnerabilities.map(vuln => ({
          ruleId: vuln.id,
          message: {
            text: vuln.description
          },
          level: this.sarifSeverityMap(vuln.severity),
          locations: vuln.file ? [{
            physicalLocation: {
              artifactLocation: {
                uri: vuln.file
              },
              region: vuln.line ? {
                startLine: vuln.line
              } : undefined
            }
          }] : []
        }))
      }]
    };
  }

  private sarifSeverityMap(severity: string): string {
    const map: Record<string, string> = {
      'critical': 'error',
      'high': 'error', 
      'medium': 'warning',
      'low': 'note',
      'info': 'note'
    };
    return map[severity] || 'warning';
  }

  /**
   * Check policy compliance
   */
  private async checkPolicyCompliance(result: SecurityScanResult): Promise<void> {
    const policy = this.getSecurityPolicy();
    
    const criticalIssues = result.vulnerabilities.filter(v => v.severity === 'critical');
    
    if (criticalIssues.length > 0 && !policy.allowedSeverities.includes('critical')) {
      console.log('\n❌ POLICY VIOLATION: Critical vulnerabilities detected!');
      console.log('   Deployment should be blocked until these are resolved.');
    }
    
    console.log('\n📋 Policy Compliance Check:');
    console.log(`  ✅ Allowed Severities: ${policy.allowedSeverities.join(', ')}`);
    console.log(`  ✅ Required Scans: ${policy.requiredScans.join(', ')}`);
    console.log(`  ✅ Auto-fix Enabled: ${policy.autoFix}`);
  }

  /**
   * Get security policy
   */
  private getSecurityPolicy(): SecurityPolicy {
    if (!existsSync(this.policyPath)) {
      throw new Error('Security policy not found. Run init first.');
    }
    
    return JSON.parse(readFileSync(this.policyPath, 'utf8'));
  }

  /**
   * List recent scan results
   */
  listRecentScans(limit: number = 10): SecurityScanResult[] {
    if (!existsSync(this.resultsDir)) {
      return [];
    }

    const files = readdirSync(this.resultsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = join(this.resultsDir, file);
        const stats = statSync(filePath);
        return { file, path: filePath, time: stats.mtime };
      })
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, limit);

    return files.map(({ path }) => 
      JSON.parse(readFileSync(path, 'utf8'))
    );
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    [this.scansDir, this.resultsDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }
}

// CLI Interface
if (require.main === module) {
  const scanner = new SecurityScanner();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      scanner.initialize().catch(error => {
        console.error('Initialization failed:', error);
        process.exit(1);
      });
      break;
    
    case 'scan':
      const scanType = (args[1] as any) || 'full';
      scanner.runSecurityScan(scanType).catch(error => {
        console.error('Security scan failed:', error);
        process.exit(1);
      });
      break;
    
    case 'list':
      try {
        const scans = scanner.listRecentScans();
        console.log(`🔒 Recent Security Scans (${scans.length}):`);
        scans.forEach(scan => {
          console.log(`  📊 ${scan.scanId} (${scan.scanType})`);
          console.log(`    ${scan.timestamp.toLocaleString()}`);
          console.log(`    Vulnerabilities: ${scan.summary.total} (Critical: ${scan.summary.critical}, High: ${scan.summary.high})`);
        });
      } catch (error) {
        console.error('Failed to list scans:', error);
        process.exit(1);
      }
      break;
    
    default:
      console.log(`
🔒 Security Scanning System

Usage:
  tsx scripts/security-scanning.ts <command> [options]

Commands:
  init                     - Initialize security scanning
  scan [type]              - Run security scan
  list                     - List recent scans

Scan Types:
  full                     - Complete security scan (default)
  dependencies             - Scan dependencies only
  code                     - Scan code only  
  configuration            - Scan configuration only

Examples:
  tsx scripts/security-scanning.ts init
  tsx scripts/security-scanning.ts scan
  tsx scripts/security-scanning.ts scan dependencies
  tsx scripts/security-scanning.ts list
      `);
  }
}

export { SecurityScanner, SecurityVulnerability, SecurityScanResult, SecurityPolicy }; 
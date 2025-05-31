#!/usr/bin/env tsx
// Dependency Analysis Script
// Automated dependency security and update tracking

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface DependencyInfo {
  name: string;
  current: string;
  latest: string;
  wanted: string;
  type: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';
  updateAvailable: boolean;
  majorUpdate: boolean;
  minorUpdate: boolean;
  patchUpdate: boolean;
  vulnerabilities: Vulnerability[];
  licenseIssues: string[];
  size: PackageSize;
  lastUpdated: string;
  maintainers: number;
  weeklyDownloads: number;
  deprecated: boolean;
  alternatives?: string[];
}

interface Vulnerability {
  id: string;
  title: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  references: string[];
  patchedVersions: string;
  vulnerableVersions: string;
  cwe: string[];
  cvss: number;
}

interface PackageSize {
  unpacked: number;
  gzipped: number;
  files: number;
}

interface DependencyAnalysisReport {
  timestamp: string;
  totalDependencies: number;
  outdatedDependencies: number;
  vulnerableDependencies: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  moderateVulnerabilities: number;
  lowVulnerabilities: number;
  licenseIssues: number;
  deprecatedPackages: number;
  majorUpdatesAvailable: number;
  totalVulnerabilities: Vulnerability[];
  dependencies: DependencyInfo[];
  recommendations: Recommendation[];
  summary: AnalysisSummary;
}

interface Recommendation {
  type: 'security' | 'update' | 'license' | 'performance' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  package: string;
  action: string;
  description: string;
  impact: string;
}

interface AnalysisSummary {
  riskScore: number;
  maintenanceScore: number;
  securityScore: number;
  updateScore: number;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

class DependencyAnalyzer {
  private readonly problematicLicenses = [
    'GPL-2.0', 'GPL-3.0', 'AGPL-1.0', 'AGPL-3.0', 'CPOL-1.02', 'EPL-1.0'
  ];

  private readonly securityThresholds = {
    critical: 0,
    high: 2,
    moderate: 5,
    low: 10
  };

  async analyze(): Promise<DependencyAnalysisReport> {
    console.log('🔍 Analyzing project dependencies...');
    
    const timestamp = new Date().toISOString();
    const dependencies = await this.getDependencyInfo();
    const vulnerabilities = await this.getVulnerabilities();
    
    // Merge vulnerability data with dependency info
    this.mergeVulnerabilityData(dependencies, vulnerabilities);
    
    // Add package metadata
    await this.enrichWithMetadata(dependencies);
    
    const summary = this.calculateSummary(dependencies);
    const recommendations = this.generateRecommendations(dependencies);
    
    const report: DependencyAnalysisReport = {
      timestamp,
      totalDependencies: dependencies.length,
      outdatedDependencies: dependencies.filter(d => d.updateAvailable).length,
      vulnerableDependencies: dependencies.filter(d => d.vulnerabilities.length > 0).length,
      criticalVulnerabilities: vulnerabilities.filter(v => v.severity === 'critical').length,
      highVulnerabilities: vulnerabilities.filter(v => v.severity === 'high').length,
      moderateVulnerabilities: vulnerabilities.filter(v => v.severity === 'moderate').length,
      lowVulnerabilities: vulnerabilities.filter(v => v.severity === 'low').length,
      licenseIssues: dependencies.filter(d => d.licenseIssues.length > 0).length,
      deprecatedPackages: dependencies.filter(d => d.deprecated).length,
      majorUpdatesAvailable: dependencies.filter(d => d.majorUpdate).length,
      totalVulnerabilities: vulnerabilities,
      dependencies,
      recommendations,
      summary
    };
    
    return report;
  }

  private async getDependencyInfo(): Promise<DependencyInfo[]> {
    console.log('📦 Gathering dependency information...');
    
    try {
      // Get outdated packages
      const outdatedOutput = execSync('npm outdated --json', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      const outdatedData = JSON.parse(outdatedOutput || '{}');
      
      // Get all dependencies from package.json
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      const dependencies: DependencyInfo[] = [];
      
      // Process each dependency type
      for (const [depType, deps] of Object.entries({
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        peerDependencies: packageJson.peerDependencies || {},
        optionalDependencies: packageJson.optionalDependencies || {}
      })) {
        for (const [name, version] of Object.entries(deps as Record<string, string>)) {
          const outdatedInfo = outdatedData[name];
          const current = outdatedInfo?.current || version;
          const latest = outdatedInfo?.latest || version;
          const wanted = outdatedInfo?.wanted || version;
          
          const dependency: DependencyInfo = {
            name,
            current,
            latest,
            wanted,
            type: depType as any,
            updateAvailable: current !== latest,
            majorUpdate: this.isMajorUpdate(current, latest),
            minorUpdate: this.isMinorUpdate(current, latest),
            patchUpdate: this.isPatchUpdate(current, latest),
            vulnerabilities: [],
            licenseIssues: [],
            size: { unpacked: 0, gzipped: 0, files: 0 },
            lastUpdated: '',
            maintainers: 0,
            weeklyDownloads: 0,
            deprecated: false
          };
          
          dependencies.push(dependency);
        }
      }
      
      return dependencies;
    } catch (error) {
      console.warn('⚠️  Failed to get dependency info:', error);
      return [];
    }
  }

  private async getVulnerabilities(): Promise<Vulnerability[]> {
    console.log('🔒 Checking for security vulnerabilities...');
    
    try {
      const auditOutput = execSync('npm audit --json', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      const auditData = JSON.parse(auditOutput);
      const vulnerabilities: Vulnerability[] = [];
      
      if (auditData.vulnerabilities) {
        for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities as any)) {
          if (vulnData.via && Array.isArray(vulnData.via)) {
            for (const via of vulnData.via) {
              if (typeof via === 'object' && via.title) {
                vulnerabilities.push({
                  id: via.id || `vuln-${Date.now()}`,
                  title: via.title,
                  severity: via.severity || 'moderate',
                  description: via.description || '',
                  references: via.references || [],
                  patchedVersions: via.patched_versions || '',
                  vulnerableVersions: via.vulnerable_versions || '',
                  cwe: via.cwe || [],
                  cvss: via.cvss?.score || 0
                });
              }
            }
          }
        }
      }
      
      return vulnerabilities;
    } catch (error) {
      console.warn('⚠️  Failed to check vulnerabilities:', error);
      return [];
    }
  }

  private mergeVulnerabilityData(dependencies: DependencyInfo[], vulnerabilities: Vulnerability[]): void {
    // This is a simplified merge - in reality, you'd need to match vulnerabilities to specific packages
    // npm audit output structure varies, so this would need to be adapted based on actual format
    
    for (const dependency of dependencies) {
      // Find vulnerabilities that might affect this package
      const relevantVulns = vulnerabilities.filter(v => 
        v.title.toLowerCase().includes(dependency.name.toLowerCase())
      );
      
      dependency.vulnerabilities = relevantVulns;
    }
  }

  private async enrichWithMetadata(dependencies: DependencyInfo[]): Promise<void> {
    console.log('📊 Enriching with package metadata...');
    
    for (const dependency of dependencies) {
      try {
        // Get package information from npm registry
        const packageInfo = await this.getPackageInfo(dependency.name);
        
        dependency.lastUpdated = packageInfo.time?.[dependency.latest] || '';
        dependency.deprecated = packageInfo.deprecated || false;
        dependency.maintainers = packageInfo.maintainers?.length || 0;
        dependency.weeklyDownloads = await this.getWeeklyDownloads(dependency.name);
        dependency.licenseIssues = this.checkLicenseIssues(packageInfo.license);
        dependency.size = await this.getPackageSize(dependency.name, dependency.latest);
        
        if (dependency.deprecated) {
          dependency.alternatives = packageInfo.alternatives || [];
        }
        
        console.log(`📋 Enriched ${dependency.name}`);
      } catch (error) {
        console.warn(`⚠️  Failed to enrich ${dependency.name}:`, error);
      }
    }
  }

  private async getPackageInfo(packageName: string): Promise<any> {
    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}`);
      return await response.json();
    } catch (error) {
      return {};
    }
  }

  private async getWeeklyDownloads(packageName: string): Promise<number> {
    try {
      const response = await fetch(`https://api.npmjs.org/downloads/point/last-week/${packageName}`);
      const data = await response.json();
      return data.downloads || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getPackageSize(packageName: string, version: string): Promise<PackageSize> {
    try {
      const response = await fetch(`https://bundlephobia.com/api/size?package=${packageName}@${version}`);
      const data = await response.json();
      return {
        unpacked: data.size || 0,
        gzipped: data.gzip || 0,
        files: data.files || 0
      };
    } catch (error) {
      return { unpacked: 0, gzipped: 0, files: 0 };
    }
  }

  private checkLicenseIssues(license: string | object): string[] {
    const issues: string[] = [];
    
    if (!license) {
      issues.push('No license specified');
      return issues;
    }
    
    const licenseString = typeof license === 'string' ? license : license.type || '';
    
    if (this.problematicLicenses.includes(licenseString)) {
      issues.push(`Potentially problematic license: ${licenseString}`);
    }
    
    return issues;
  }

  private isMajorUpdate(current: string, latest: string): boolean {
    const currentMajor = this.getMajorVersion(current);
    const latestMajor = this.getMajorVersion(latest);
    return latestMajor > currentMajor;
  }

  private isMinorUpdate(current: string, latest: string): boolean {
    const [currentMajor, currentMinor] = this.parseVersion(current);
    const [latestMajor, latestMinor] = this.parseVersion(latest);
    return latestMajor === currentMajor && latestMinor > currentMinor;
  }

  private isPatchUpdate(current: string, latest: string): boolean {
    const [currentMajor, currentMinor, currentPatch] = this.parseVersion(current);
    const [latestMajor, latestMinor, latestPatch] = this.parseVersion(latest);
    return latestMajor === currentMajor && latestMinor === currentMinor && latestPatch > currentPatch;
  }

  private getMajorVersion(version: string): number {
    return parseInt(version.replace(/[^\d.].*$/, '').split('.')[0] || '0');
  }

  private parseVersion(version: string): [number, number, number] {
    const parts = version.replace(/[^\d.].*$/, '').split('.').map(n => parseInt(n) || 0);
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  }

  private calculateSummary(dependencies: DependencyInfo[]): AnalysisSummary {
    const totalDeps = dependencies.length;
    const vulnDeps = dependencies.filter(d => d.vulnerabilities.length > 0).length;
    const outdatedDeps = dependencies.filter(d => d.updateAvailable).length;
    const deprecatedDeps = dependencies.filter(d => d.deprecated).length;
    
    const criticalVulns = dependencies.reduce((sum, d) => 
      sum + d.vulnerabilities.filter(v => v.severity === 'critical').length, 0);
    const highVulns = dependencies.reduce((sum, d) => 
      sum + d.vulnerabilities.filter(v => v.severity === 'high').length, 0);
    
    // Calculate scores (0-100, higher is better)
    const securityScore = totalDeps > 0 ? 
      Math.max(0, 100 - (criticalVulns * 25 + highVulns * 10 + vulnDeps * 5)) : 100;
    
    const updateScore = totalDeps > 0 ? 
      Math.max(0, 100 - (outdatedDeps / totalDeps * 100)) : 100;
    
    const maintenanceScore = totalDeps > 0 ? 
      Math.max(0, 100 - (deprecatedDeps / totalDeps * 100)) : 100;
    
    const riskScore = (securityScore + updateScore + maintenanceScore) / 3;
    
    let overallHealth: AnalysisSummary['overallHealth'] = 'excellent';
    if (riskScore < 50) overallHealth = 'critical';
    else if (riskScore < 65) overallHealth = 'poor';
    else if (riskScore < 80) overallHealth = 'fair';
    else if (riskScore < 90) overallHealth = 'good';
    
    return {
      riskScore,
      maintenanceScore,
      securityScore,
      updateScore,
      overallHealth
    };
  }

  private generateRecommendations(dependencies: DependencyInfo[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Critical security vulnerabilities
    for (const dep of dependencies) {
      const criticalVulns = dep.vulnerabilities.filter(v => v.severity === 'critical');
      if (criticalVulns.length > 0) {
        recommendations.push({
          type: 'security',
          priority: 'critical',
          package: dep.name,
          action: `Update ${dep.name} immediately`,
          description: `Contains ${criticalVulns.length} critical security vulnerabilities`,
          impact: 'Security compromise possible'
        });
      }
      
      const highVulns = dep.vulnerabilities.filter(v => v.severity === 'high');
      if (highVulns.length > 0 && criticalVulns.length === 0) {
        recommendations.push({
          type: 'security',
          priority: 'high',
          package: dep.name,
          action: `Update ${dep.name} soon`,
          description: `Contains ${highVulns.length} high severity vulnerabilities`,
          impact: 'Potential security risk'
        });
      }
    }
    
    // Deprecated packages
    for (const dep of dependencies.filter(d => d.deprecated)) {
      recommendations.push({
        type: 'maintenance',
        priority: 'high',
        package: dep.name,
        action: `Replace deprecated package ${dep.name}`,
        description: 'Package is deprecated and no longer maintained',
        impact: 'Future compatibility issues'
      });
    }
    
    // Major updates available
    for (const dep of dependencies.filter(d => d.majorUpdate)) {
      recommendations.push({
        type: 'update',
        priority: 'medium',
        package: dep.name,
        action: `Consider major update for ${dep.name}`,
        description: `Major update available: ${dep.current} → ${dep.latest}`,
        impact: 'May contain breaking changes'
      });
    }
    
    // License issues
    for (const dep of dependencies.filter(d => d.licenseIssues.length > 0)) {
      recommendations.push({
        type: 'license',
        priority: 'medium',
        package: dep.name,
        action: `Review license for ${dep.name}`,
        description: dep.licenseIssues.join(', '),
        impact: 'Potential legal compliance issues'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async generateReport(report: DependencyAnalysisReport): Promise<void> {
    const reportDir = join(process.cwd(), 'reports');
    const reportPath = join(reportDir, 'dependency-analysis.json');
    const summaryPath = join(reportDir, 'dependency-summary.md');
    
    // Ensure reports directory exists
    try {
      await import('fs').then(fs => fs.promises.mkdir(reportDir, { recursive: true }));
    } catch (error) {
      console.warn('Failed to create reports directory:', error);
    }
    
    // Write detailed JSON report
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const summary = this.generateMarkdownSummary(report);
    writeFileSync(summaryPath, summary);
    
    console.log('📋 Reports generated:');
    console.log(`   📄 Detailed: ${reportPath}`);
    console.log(`   📝 Summary: ${summaryPath}`);
  }

  private generateMarkdownSummary(report: DependencyAnalysisReport): string {
    const { summary, recommendations } = report;
    
    const healthEmoji = {
      excellent: '🟢',
      good: '🟡',
      fair: '🟠',
      poor: '🔴',
      critical: '💀'
    };
    
    return `# Dependency Analysis Report

Generated: ${new Date(report.timestamp).toLocaleString()}

## Overall Health: ${healthEmoji[summary.overallHealth]} ${summary.overallHealth.toUpperCase()}

### Scores
- **Security Score**: ${summary.securityScore.toFixed(1)}/100
- **Update Score**: ${summary.updateScore.toFixed(1)}/100  
- **Maintenance Score**: ${summary.maintenanceScore.toFixed(1)}/100
- **Overall Risk Score**: ${summary.riskScore.toFixed(1)}/100

## Summary Statistics
- **Total Dependencies**: ${report.totalDependencies}
- **Outdated Dependencies**: ${report.outdatedDependencies}
- **Vulnerable Dependencies**: ${report.vulnerableDependencies}
- **Deprecated Packages**: ${report.deprecatedPackages}
- **License Issues**: ${report.licenseIssues}

## Security Vulnerabilities
- **Critical**: ${report.criticalVulnerabilities} 🚨
- **High**: ${report.highVulnerabilities} ⚠️
- **Moderate**: ${report.moderateVulnerabilities} ⚡
- **Low**: ${report.lowVulnerabilities} ℹ️

## Immediate Actions Required

${recommendations.filter(r => r.priority === 'critical').length > 0 ? `
### 🚨 Critical Priority
${recommendations.filter(r => r.priority === 'critical').map(r => 
  `- **${r.package}**: ${r.action}\n  *${r.description}*`
).join('\n')}
` : ''}

${recommendations.filter(r => r.priority === 'high').length > 0 ? `
### ⚠️ High Priority  
${recommendations.filter(r => r.priority === 'high').map(r => 
  `- **${r.package}**: ${r.action}\n  *${r.description}*`
).join('\n')}
` : ''}

${recommendations.filter(r => r.priority === 'medium').length > 0 ? `
### ⚡ Medium Priority
${recommendations.filter(r => r.priority === 'medium').map(r => 
  `- **${r.package}**: ${r.action}\n  *${r.description}*`
).join('\n')}
` : ''}

## Vulnerable Packages
${report.dependencies
  .filter(d => d.vulnerabilities.length > 0)
  .map(d => `- **${d.name}** (${d.current}): ${d.vulnerabilities.length} vulnerabilities`)
  .join('\n') || 'None found'}

## Outdated Packages (Major Updates)
${report.dependencies
  .filter(d => d.majorUpdate)
  .map(d => `- **${d.name}**: ${d.current} → ${d.latest}`)
  .join('\n') || 'None found'}

## Deprecated Packages
${report.dependencies
  .filter(d => d.deprecated)
  .map(d => `- **${d.name}** (${d.current})${d.alternatives ? ` - Consider: ${d.alternatives.join(', ')}` : ''}`)
  .join('\n') || 'None found'}

## Next Steps
1. Address all critical and high priority security vulnerabilities immediately
2. Plan updates for deprecated packages
3. Review major version updates for breaking changes
4. Monitor dependency health regularly

---
*Report generated by Synapse Hub Dependency Analyzer*
`;
  }
}

// Main execution
async function main() {
  try {
    const analyzer = new DependencyAnalyzer();
    const report = await analyzer.analyze();
    await analyzer.generateReport(report);
    
    console.log('\n📊 Dependency Analysis Complete');
    console.log(`🏥 Overall Health: ${report.summary.overallHealth.toUpperCase()}`);
    console.log(`🔒 Security Score: ${report.summary.securityScore.toFixed(1)}/100`);
    console.log(`📦 Total Dependencies: ${report.totalDependencies}`);
    console.log(`⚠️  Vulnerabilities: ${report.criticalVulnerabilities + report.highVulnerabilities + report.moderateVulnerabilities + report.lowVulnerabilities}`);
    console.log(`📋 Recommendations: ${report.recommendations.length}`);
    
    // Exit with error code if critical security issues found
    if (report.criticalVulnerabilities > 0 || report.highVulnerabilities > 5) {
      console.log('\n🚨 Critical security issues found');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Dependency analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 
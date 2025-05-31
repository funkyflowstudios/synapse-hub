#!/usr/bin/env tsx
// Code Quality Metrics Collection Script
// Analyzes codebase for quality metrics and technical debt

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface CodeQualityMetrics {
  timestamp: string;
  totalFiles: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  averageComplexity: number;
  maxComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  codeSmells: number;
  duplicateLines: number;
  testCoverage: TestCoverageMetrics;
  fileMetrics: FileMetric[];
  thresholdViolations: ThresholdViolation[];
}

interface TestCoverageMetrics {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  uncoveredFiles: string[];
}

interface FileMetric {
  path: string;
  lines: number;
  complexity: number;
  maintainabilityIndex: number;
  issues: string[];
}

interface ThresholdViolation {
  type: 'complexity' | 'maintainability' | 'coverage' | 'duplicates';
  file?: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class CodeQualityAnalyzer {
  private readonly thresholds = {
    complexity: {
      warning: 10,
      critical: 20
    },
    maintainability: {
      warning: 60,
      critical: 40
    },
    coverage: {
      warning: 80,
      critical: 60
    },
    duplicateLines: {
      warning: 100,
      critical: 200
    },
    fileLength: {
      warning: 500,
      critical: 1000
    }
  };

  async analyze(): Promise<CodeQualityMetrics> {
    console.log('🔍 Analyzing code quality metrics...');
    
    const timestamp = new Date().toISOString();
    const fileMetrics = await this.analyzeFiles();
    const testCoverage = await this.getTestCoverage();
    const duplicateLines = await this.findDuplicateLines();
    
    const metrics: CodeQualityMetrics = {
      timestamp,
      totalFiles: fileMetrics.length,
      totalLines: fileMetrics.reduce((sum, f) => sum + f.lines, 0),
      codeLines: await this.countCodeLines(),
      commentLines: await this.countCommentLines(),
      blankLines: await this.countBlankLines(),
      averageComplexity: fileMetrics.reduce((sum, f) => sum + f.complexity, 0) / fileMetrics.length,
      maxComplexity: Math.max(...fileMetrics.map(f => f.complexity)),
      maintainabilityIndex: fileMetrics.reduce((sum, f) => sum + f.maintainabilityIndex, 0) / fileMetrics.length,
      technicalDebt: await this.calculateTechnicalDebt(fileMetrics),
      codeSmells: fileMetrics.reduce((sum, f) => sum + f.issues.length, 0),
      duplicateLines,
      testCoverage,
      fileMetrics,
      thresholdViolations: []
    };

    metrics.thresholdViolations = this.checkThresholds(metrics);
    
    return metrics;
  }

  private async analyzeFiles(): Promise<FileMetric[]> {
    const files = await glob('src/**/*.{ts,js,svelte}', { 
      ignore: ['**/*.spec.ts', '**/*.test.ts', '**/*.d.ts'] 
    });
    
    const metrics: FileMetric[] = [];
    
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n').length;
        const complexity = this.calculateComplexity(content);
        const maintainabilityIndex = this.calculateMaintainabilityIndex(content, complexity);
        const issues = this.findCodeSmells(content, file);
        
        metrics.push({
          path: file,
          lines,
          complexity,
          maintainabilityIndex,
          issues
        });
        
        console.log(`📊 Analyzed ${file}: ${lines} lines, complexity ${complexity}`);
      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${file}:`, error);
      }
    }
    
    return metrics;
  }

  private calculateComplexity(content: string): number {
    // Cyclomatic complexity calculation
    const complexityPatterns = [
      /\bif\b/g,           // if statements
      /\belse\b/g,         // else statements
      /\bwhile\b/g,        // while loops
      /\bfor\b/g,          // for loops
      /\bdo\b/g,           // do-while loops
      /\bswitch\b/g,       // switch statements
      /\bcase\b/g,         // case statements
      /\bcatch\b/g,        // catch blocks
      /\b\?\s*.*?\s*:/g,   // ternary operators
      /&&/g,               // logical AND
      /\|\|/g              // logical OR
    ];
    
    let complexity = 1; // Base complexity
    
    for (const pattern of complexityPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }

  private calculateMaintainabilityIndex(content: string, complexity: number): number {
    const lines = content.split('\n').length;
    const commentLines = (content.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length;
    const commentRatio = commentLines / lines;
    
    // Simplified maintainability index calculation
    // Real MI = 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code)
    // Simplified version for demonstration
    let mi = 100 - (complexity * 2) - (lines * 0.05);
    mi += commentRatio * 10; // Bonus for comments
    
    return Math.max(0, Math.min(100, mi));
  }

  private findCodeSmells(content: string, filePath: string): string[] {
    const smells: string[] = [];
    
    // Long method detection
    const methods = content.match(/function\s+\w+[^{]*{[^}]*}/g) || [];
    for (const method of methods) {
      const methodLines = method.split('\n').length;
      if (methodLines > 50) {
        smells.push(`Long method (${methodLines} lines)`);
      }
    }
    
    // Large class detection (for TypeScript classes)
    const classes = content.match(/class\s+\w+[^{]*{[\s\S]*?(?=^class|\Z)/gm) || [];
    for (const cls of classes) {
      const classLines = cls.split('\n').length;
      if (classLines > 200) {
        smells.push(`Large class (${classLines} lines)`);
      }
    }
    
    // Magic numbers
    const magicNumbers = content.match(/\b\d{2,}\b/g) || [];
    if (magicNumbers.length > 5) {
      smells.push(`Magic numbers detected (${magicNumbers.length})`);
    }
    
    // Nested complexity
    const nestedBraces = content.match(/{[^{}]*{[^{}]*{/g) || [];
    if (nestedBraces.length > 0) {
      smells.push(`Deep nesting detected (${nestedBraces.length} instances)`);
    }
    
    // TODO/FIXME comments
    const todos = content.match(/\b(TODO|FIXME|HACK)\b/gi) || [];
    if (todos.length > 0) {
      smells.push(`Technical debt markers (${todos.length})`);
    }
    
    return smells;
  }

  private async getTestCoverage(): Promise<TestCoverageMetrics> {
    try {
      // Run test coverage
      console.log('📈 Collecting test coverage...');
      const coverage = execSync('npm run test:unit -- --coverage --reporter=json', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      // Parse coverage report (this is a simplified example)
      const coverageData = JSON.parse(coverage.split('\n').find(line => line.startsWith('{')) || '{}');
      
      return {
        statements: coverageData.total?.statements?.pct || 0,
        branches: coverageData.total?.branches?.pct || 0,
        functions: coverageData.total?.functions?.pct || 0,
        lines: coverageData.total?.lines?.pct || 0,
        uncoveredFiles: []
      };
    } catch (error) {
      console.warn('⚠️  Failed to collect test coverage:', error);
      return {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
        uncoveredFiles: []
      };
    }
  }

  private async findDuplicateLines(): Promise<number> {
    try {
      console.log('🔍 Detecting duplicate code...');
      
      const files = await glob('src/**/*.{ts,js,svelte}', { 
        ignore: ['**/*.spec.ts', '**/*.test.ts', '**/*.d.ts'] 
      });
      
      const allLines: Map<string, string[]> = new Map();
      let duplicateCount = 0;
      
      // Read all files and collect lines
      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 10);
        
        for (const line of lines) {
          if (!allLines.has(line)) {
            allLines.set(line, []);
          }
          allLines.get(line)!.push(file);
        }
      }
      
      // Count duplicates
      for (const [line, files] of allLines) {
        if (files.length > 1) {
          duplicateCount += files.length - 1;
        }
      }
      
      return duplicateCount;
    } catch (error) {
      console.warn('⚠️  Failed to detect duplicates:', error);
      return 0;
    }
  }

  private async countCodeLines(): Promise<number> {
    const files = await glob('src/**/*.{ts,js,svelte}');
    let codeLines = 0;
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
      });
      codeLines += lines.length;
    }
    
    return codeLines;
  }

  private async countCommentLines(): Promise<number> {
    const files = await glob('src/**/*.{ts,js,svelte}');
    let commentLines = 0;
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const comments = content.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || [];
      commentLines += comments.reduce((sum, comment) => {
        return sum + comment.split('\n').length;
      }, 0);
    }
    
    return commentLines;
  }

  private async countBlankLines(): Promise<number> {
    const files = await glob('src/**/*.{ts,js,svelte}');
    let blankLines = 0;
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() === '');
      blankLines += lines.length;
    }
    
    return blankLines;
  }

  private calculateTechnicalDebt(fileMetrics: FileMetric[]): number {
    // Estimate technical debt in hours based on complexity and code smells
    let debtHours = 0;
    
    for (const file of fileMetrics) {
      // High complexity penalty
      if (file.complexity > this.thresholds.complexity.critical) {
        debtHours += (file.complexity - this.thresholds.complexity.critical) * 0.5;
      }
      
      // Low maintainability penalty
      if (file.maintainabilityIndex < this.thresholds.maintainability.warning) {
        debtHours += (this.thresholds.maintainability.warning - file.maintainabilityIndex) * 0.1;
      }
      
      // Code smells penalty
      debtHours += file.issues.length * 0.25;
      
      // Large file penalty
      if (file.lines > this.thresholds.fileLength.warning) {
        debtHours += (file.lines - this.thresholds.fileLength.warning) * 0.01;
      }
    }
    
    return Math.round(debtHours * 100) / 100;
  }

  private checkThresholds(metrics: CodeQualityMetrics): ThresholdViolation[] {
    const violations: ThresholdViolation[] = [];
    
    // Check overall metrics
    if (metrics.testCoverage.statements < this.thresholds.coverage.critical) {
      violations.push({
        type: 'coverage',
        value: metrics.testCoverage.statements,
        threshold: this.thresholds.coverage.critical,
        severity: 'critical'
      });
    } else if (metrics.testCoverage.statements < this.thresholds.coverage.warning) {
      violations.push({
        type: 'coverage',
        value: metrics.testCoverage.statements,
        threshold: this.thresholds.coverage.warning,
        severity: 'medium'
      });
    }
    
    if (metrics.duplicateLines > this.thresholds.duplicateLines.critical) {
      violations.push({
        type: 'duplicates',
        value: metrics.duplicateLines,
        threshold: this.thresholds.duplicateLines.critical,
        severity: 'critical'
      });
    }
    
    // Check file-level metrics
    for (const file of metrics.fileMetrics) {
      if (file.complexity > this.thresholds.complexity.critical) {
        violations.push({
          type: 'complexity',
          file: file.path,
          value: file.complexity,
          threshold: this.thresholds.complexity.critical,
          severity: 'critical'
        });
      } else if (file.complexity > this.thresholds.complexity.warning) {
        violations.push({
          type: 'complexity',
          file: file.path,
          value: file.complexity,
          threshold: this.thresholds.complexity.warning,
          severity: 'medium'
        });
      }
      
      if (file.maintainabilityIndex < this.thresholds.maintainability.critical) {
        violations.push({
          type: 'maintainability',
          file: file.path,
          value: file.maintainabilityIndex,
          threshold: this.thresholds.maintainability.critical,
          severity: 'critical'
        });
      }
    }
    
    return violations;
  }

  async generateReport(metrics: CodeQualityMetrics): Promise<void> {
    const reportPath = join(process.cwd(), 'reports', 'code-quality.json');
    const reportDir = join(process.cwd(), 'reports');
    
    // Ensure reports directory exists
    try {
      await import('fs').then(fs => fs.mkdirSync(reportDir, { recursive: true }));
    } catch (error) {
      console.warn('Failed to create reports directory:', error);
    }
    
    // Write detailed JSON report
    writeFileSync(reportPath, JSON.stringify(metrics, null, 2));
    
    // Generate summary report
    const summary = this.generateSummaryReport(metrics);
    const summaryPath = join(process.cwd(), 'reports', 'code-quality-summary.md');
    writeFileSync(summaryPath, summary);
    
    console.log('📋 Reports generated:');
    console.log(`   📄 Detailed: ${reportPath}`);
    console.log(`   📝 Summary: ${summaryPath}`);
  }

  private generateSummaryReport(metrics: CodeQualityMetrics): string {
    const { thresholdViolations } = metrics;
    const criticalViolations = thresholdViolations.filter(v => v.severity === 'critical');
    const mediumViolations = thresholdViolations.filter(v => v.severity === 'medium');
    
    return `# Code Quality Report

Generated: ${new Date(metrics.timestamp).toLocaleString()}

## Summary
- **Total Files**: ${metrics.totalFiles}
- **Total Lines**: ${metrics.totalLines.toLocaleString()}
- **Average Complexity**: ${metrics.averageComplexity.toFixed(2)}
- **Maintainability Index**: ${metrics.maintainabilityIndex.toFixed(1)}
- **Technical Debt**: ${metrics.technicalDebt} hours
- **Code Smells**: ${metrics.codeSmells}

## Test Coverage
- **Statements**: ${metrics.testCoverage.statements}%
- **Branches**: ${metrics.testCoverage.branches}%
- **Functions**: ${metrics.testCoverage.functions}%
- **Lines**: ${metrics.testCoverage.lines}%

## Quality Issues
${criticalViolations.length > 0 ? `
### 🚨 Critical Issues (${criticalViolations.length})
${criticalViolations.map(v => `- **${v.type}**: ${v.file || 'Overall'} (${v.value} > ${v.threshold})`).join('\n')}
` : ''}

${mediumViolations.length > 0 ? `
### ⚠️ Medium Issues (${mediumViolations.length})
${mediumViolations.map(v => `- **${v.type}**: ${v.file || 'Overall'} (${v.value} > ${v.threshold})`).join('\n')}
` : ''}

## Recommendations
${this.generateRecommendations(metrics)}

## Top Complex Files
${metrics.fileMetrics
  .sort((a, b) => b.complexity - a.complexity)
  .slice(0, 10)
  .map(f => `- ${f.path}: Complexity ${f.complexity}, MI ${f.maintainabilityIndex.toFixed(1)}`)
  .join('\n')}
`;
  }

  private generateRecommendations(metrics: CodeQualityMetrics): string {
    const recommendations: string[] = [];
    
    if (metrics.testCoverage.statements < 80) {
      recommendations.push('📈 Increase test coverage to at least 80%');
    }
    
    if (metrics.averageComplexity > 10) {
      recommendations.push('🔧 Refactor complex methods to reduce cyclomatic complexity');
    }
    
    if (metrics.duplicateLines > 100) {
      recommendations.push('♻️ Extract common code to reduce duplication');
    }
    
    if (metrics.codeSmells > 50) {
      recommendations.push('🧹 Address code smells to improve maintainability');
    }
    
    if (metrics.technicalDebt > 10) {
      recommendations.push('⚡ Prioritize technical debt reduction');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Code quality looks good! Keep up the excellent work.');
    }
    
    return recommendations.join('\n');
  }
}

// Main execution
async function main() {
  try {
    const analyzer = new CodeQualityAnalyzer();
    const metrics = await analyzer.analyze();
    await analyzer.generateReport(metrics);
    
    console.log('\n📊 Code Quality Analysis Complete');
    console.log(`📈 Maintainability Index: ${metrics.maintainabilityIndex.toFixed(1)}`);
    console.log(`🔧 Average Complexity: ${metrics.averageComplexity.toFixed(2)}`);
    console.log(`📋 Test Coverage: ${metrics.testCoverage.statements}%`);
    console.log(`⚠️  Issues: ${metrics.thresholdViolations.length}`);
    
    // Exit with error code if critical issues found
    const criticalIssues = metrics.thresholdViolations.filter(v => v.severity === 'critical');
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 Found ${criticalIssues.length} critical quality issues`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Code quality analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 
#!/usr/bin/env node

/**
 * Performance Regression Detection System
 * 
 * Provides automated performance monitoring and regression detection across deployments.
 * Part of Phase 7: Advanced Automation & Future-Proofing
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  category: 'load-time' | 'bundle-size' | 'memory' | 'cpu' | 'network' | 'rendering';
  threshold: {
    warning: number;
    critical: number;
  };
  timestamp: Date;
}

interface PerformanceTest {
  id: string;
  name: string;
  description: string;
  type: 'lighthouse' | 'bundle-analyzer' | 'load-test' | 'memory-test' | 'cpu-benchmark';
  url?: string;
  script?: string;
  environment: string;
  configuration: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
}

interface PerformanceResult {
  testId: string;
  runId: string;
  timestamp: Date;
  environment: string;
  metrics: PerformanceMetric[];
  summary: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    warnings: number;
    criticals: number;
  };
  duration: number;
  baseline?: PerformanceResult;
  regression?: {
    detected: boolean;
    degradedMetrics: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface PerformanceBenchmark {
  environment: string;
  baselineResults: PerformanceResult[];
  thresholds: {
    [metricName: string]: {
      warning: number;
      critical: number;
      regressionThreshold: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

class PerformanceRegressionDetector {
  private perfDir: string;
  private resultsDir: string;
  private benchmarksDir: string;
  private configPath: string;

  constructor() {
    this.perfDir = join(process.cwd(), 'performance-tests');
    this.resultsDir = join(this.perfDir, 'results');
    this.benchmarksDir = join(this.perfDir, 'benchmarks');
    this.configPath = join(this.perfDir, 'performance-config.json');
    
    this.ensureDirectories();
  }

  /**
   * Initialize performance regression detection
   */
  async initialize(): Promise<void> {
    console.log('⚡ Initializing Performance Regression Detection...');
    
    // Create default configuration
    await this.createDefaultConfiguration();
    
    // Create example performance tests
    await this.createExampleTests();
    
    // Setup performance tools
    await this.setupPerformanceTools();
    
    console.log('✅ Performance Regression Detection initialized');
  }

  /**
   * Create default configuration
   */
  private async createDefaultConfiguration(): Promise<void> {
    if (existsSync(this.configPath)) {
      return;
    }

    const defaultConfig = {
      tests: [],
      environments: {
        development: {
          baseUrl: 'http://localhost:5173',
          description: 'Local development environment'
        },
        staging: {
          baseUrl: 'https://staging.synapse-hub.com',
          description: 'Staging environment'
        },
        production: {
          baseUrl: 'https://synapse-hub.com',
          description: 'Production environment'
        }
      },
      monitoring: {
        scheduleInterval: '0 */6 * * *', // Every 6 hours
        regressionThresholds: {
          warning: 10, // 10% degradation
          critical: 25 // 25% degradation
        },
        retentionDays: 30,
        notifications: {
          enabled: true,
          channels: ['console', 'file'],
          severityThreshold: 'warning'
        }
      },
      lighthouse: {
        settings: {
          onlyCategories: ['performance', 'accessibility', 'best-practices'],
          throttling: {
            cpuSlowdownMultiplier: 4,
            requestLatencyMs: 562.5,
            downloadThroughputKbps: 1638.4,
            uploadThroughputKbps: 675
          }
        }
      },
      bundleAnalysis: {
        enabled: true,
        sizeLimits: {
          maxBundleSize: 250 * 1024, // 250KB
          maxChunkSize: 100 * 1024,  // 100KB
          maxAssetSize: 50 * 1024    // 50KB
        }
      }
    };

    writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('📋 Created default performance configuration');
  }

  /**
   * Create example performance tests
   */
  private async createExampleTests(): Promise<void> {
    const config = this.getConfiguration();
    
    if (config.tests.length > 0) {
      return;
    }

    const exampleTests: PerformanceTest[] = [
      {
        id: 'lighthouse-homepage',
        name: 'Lighthouse Homepage Audit',
        description: 'Comprehensive performance audit of homepage',
        type: 'lighthouse',
        url: '/',
        environment: 'development',
        configuration: {
          categories: ['performance', 'accessibility', 'best-practices'],
          device: 'desktop'
        },
        enabled: true,
        createdAt: new Date()
      },
      {
        id: 'lighthouse-mobile',
        name: 'Lighthouse Mobile Audit',
        description: 'Mobile performance audit',
        type: 'lighthouse',
        url: '/',
        environment: 'development',
        configuration: {
          categories: ['performance'],
          device: 'mobile'
        },
        enabled: true,
        createdAt: new Date()
      },
      {
        id: 'bundle-analysis',
        name: 'Bundle Size Analysis',
        description: 'Analyze JavaScript bundle sizes',
        type: 'bundle-analyzer',
        environment: 'development',
        configuration: {
          buildCommand: 'npm run build',
          outputPath: 'dist'
        },
        enabled: true,
        createdAt: new Date()
      },
      {
        id: 'memory-usage',
        name: 'Memory Usage Test',
        description: 'Monitor application memory usage',
        type: 'memory-test',
        script: 'scripts/memory-test.js',
        environment: 'development',
        configuration: {
          iterations: 10,
          samplingInterval: 1000
        },
        enabled: true,
        createdAt: new Date()
      }
    ];

    config.tests = exampleTests;
    writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    console.log('📝 Created example performance tests');
  }

  /**
   * Setup performance testing tools
   */
  private async setupPerformanceTools(): Promise<void> {
    console.log('🛠️  Setting up performance tools...');
    
    // Check for required tools
    const tools = [
      { name: 'Lighthouse', check: 'npx lighthouse --version', install: 'npm install -D lighthouse' },
      { name: 'webpack-bundle-analyzer', check: 'npx webpack-bundle-analyzer --version', install: 'npm install -D webpack-bundle-analyzer' }
    ];

    for (const tool of tools) {
      try {
        execSync(tool.check, { stdio: 'pipe' });
        console.log(`  ✅ ${tool.name} available`);
      } catch {
        console.log(`  🔧 Installing ${tool.name}...`);
        try {
          execSync(tool.install, { stdio: 'pipe' });
          console.log(`  ✅ ${tool.name} installed`);
        } catch (error) {
          console.warn(`  ⚠️  Failed to install ${tool.name}:`, error.message);
        }
      }
    }

    // Create memory test script
    await this.createMemoryTestScript();
  }

  /**
   * Create memory test script
   */
  private async createMemoryTestScript(): Promise<void> {
    const memoryTestScript = `
// Memory Usage Test Script
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const url = process.argv[2] || 'http://localhost:5173';
  const iterations = parseInt(process.argv[3]) || 10;
  const interval = parseInt(process.argv[4]) || 1000;
  
  const measurements = [];
  
  await page.goto(url);
  
  for (let i = 0; i < iterations; i++) {
    const metrics = await page.metrics();
    measurements.push({
      iteration: i + 1,
      jsHeapUsedSize: metrics.JSHeapUsedSize,
      jsHeapTotalSize: metrics.JSHeapTotalSize,
      timestamp: new Date().toISOString()
    });
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  await browser.close();
  
  const averageUsed = measurements.reduce((sum, m) => sum + m.jsHeapUsedSize, 0) / measurements.length;
  const maxUsed = Math.max(...measurements.map(m => m.jsHeapUsedSize));
  
  console.log(JSON.stringify({
    averageMemoryUsage: averageUsed,
    maxMemoryUsage: maxUsed,
    measurements
  }));
})();
`;

    const scriptPath = join(this.perfDir, 'memory-test.js');
    if (!existsSync(scriptPath)) {
      writeFileSync(scriptPath, memoryTestScript.trim());
      console.log('📝 Created memory test script');
    }
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests(
    environment: string = 'development',
    testIds?: string[]
  ): Promise<PerformanceResult[]> {
    console.log(`⚡ Running performance tests for ${environment}...`);
    
    const config = this.getConfiguration();
    const envConfig = config.environments[environment];
    
    if (!envConfig) {
      throw new Error(`Environment configuration not found: ${environment}`);
    }

    // Filter tests
    let testsToRun = config.tests.filter(test => 
      test.enabled && test.environment === environment
    );

    if (testIds && testIds.length > 0) {
      testsToRun = testsToRun.filter(test => testIds.includes(test.id));
    }

    if (testsToRun.length === 0) {
      console.log('✅ No tests to run');
      return [];
    }

    console.log(`🎯 Running ${testsToRun.length} performance tests`);
    
    const results: PerformanceResult[] = [];
    
    for (const test of testsToRun) {
      try {
        console.log(`  ⚡ Running: ${test.name}`);
        const result = await this.runSingleTest(test, envConfig);
        results.push(result);
        
        // Check for regressions
        await this.detectRegressions(result);
        
      } catch (error) {
        console.error(`  ❌ Test ${test.id} failed:`, error.message);
      }
    }

    // Save results
    await this.saveResults(results, environment);
    
    // Generate performance report
    await this.generatePerformanceReport(results, environment);
    
    console.log(`\n⚡ Performance Test Results:`);
    results.forEach(result => {
      const regressionStatus = result.regression?.detected ? '📉 REGRESSION' : '✅ OK';
      console.log(`  ${regressionStatus} ${result.testId}: Score ${result.summary.score}/100 (${result.summary.grade})`);
    });

    return results;
  }

  /**
   * Run a single performance test
   */
  private async runSingleTest(test: PerformanceTest, envConfig: any): Promise<PerformanceResult> {
    const runId = `run-${Date.now()}`;
    const startTime = Date.now();
    
    let metrics: PerformanceMetric[] = [];
    
    switch (test.type) {
      case 'lighthouse':
        metrics = await this.runLighthouseTest(test, envConfig);
        break;
      case 'bundle-analyzer':
        metrics = await this.runBundleAnalysis(test);
        break;
      case 'memory-test':
        metrics = await this.runMemoryTest(test, envConfig);
        break;
      default:
        throw new Error(`Unsupported test type: ${test.type}`);
    }
    
    const duration = Date.now() - startTime;
    
    // Calculate summary
    const summary = this.calculateSummary(metrics);
    
    return {
      testId: test.id,
      runId,
      timestamp: new Date(),
      environment: test.environment,
      metrics,
      summary,
      duration
    };
  }

  /**
   * Run Lighthouse performance test
   */
  private async runLighthouseTest(test: PerformanceTest, envConfig: any): Promise<PerformanceMetric[]> {
    const url = `${envConfig.baseUrl}${test.url || ''}`;
    const device = test.configuration.device || 'desktop';
    
    const lighthouseCmd = [
      'npx lighthouse',
      `"${url}"`,
      '--output=json',
      '--quiet',
      '--chrome-flags="--headless"',
      device === 'mobile' ? '--preset=perf' : '--preset=desktop'
    ].join(' ');
    
    try {
      const output = execSync(lighthouseCmd, { encoding: 'utf8', timeout: 60000 });
      const lighthouseResult = JSON.parse(output);
      
      const metrics: PerformanceMetric[] = [];
      
      // Performance metrics
      const audits = lighthouseResult.audits;
      
      if (audits['first-contentful-paint']) {
        metrics.push({
          name: 'First Contentful Paint',
          value: audits['first-contentful-paint'].numericValue,
          unit: 'ms',
          category: 'load-time',
          threshold: { warning: 2000, critical: 4000 },
          timestamp: new Date()
        });
      }
      
      if (audits['largest-contentful-paint']) {
        metrics.push({
          name: 'Largest Contentful Paint',
          value: audits['largest-contentful-paint'].numericValue,
          unit: 'ms',
          category: 'load-time',
          threshold: { warning: 2500, critical: 4000 },
          timestamp: new Date()
        });
      }
      
      if (audits['cumulative-layout-shift']) {
        metrics.push({
          name: 'Cumulative Layout Shift',
          value: audits['cumulative-layout-shift'].numericValue,
          unit: 'score',
          category: 'rendering',
          threshold: { warning: 0.1, critical: 0.25 },
          timestamp: new Date()
        });
      }
      
      if (audits['total-blocking-time']) {
        metrics.push({
          name: 'Total Blocking Time',
          value: audits['total-blocking-time'].numericValue,
          unit: 'ms',
          category: 'cpu',
          threshold: { warning: 300, critical: 600 },
          timestamp: new Date()
        });
      }
      
      // Overall performance score
      if (lighthouseResult.categories?.performance) {
        metrics.push({
          name: 'Performance Score',
          value: lighthouseResult.categories.performance.score * 100,
          unit: 'score',
          category: 'load-time',
          threshold: { warning: 80, critical: 60 },
          timestamp: new Date()
        });
      }
      
      return metrics;
      
    } catch (error) {
      console.warn(`    ⚠️  Lighthouse test failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Run bundle analysis
   */
  private async runBundleAnalysis(test: PerformanceTest): Promise<PerformanceMetric[]> {
    const config = this.getConfiguration();
    
    try {
      // Build the project first
      if (test.configuration.buildCommand) {
        execSync(test.configuration.buildCommand, { stdio: 'pipe' });
      }
      
      // Analyze bundle sizes
      const outputPath = test.configuration.outputPath || 'dist';
      const statsPath = join(outputPath, 'stats.json');
      
      // Generate webpack stats
      execSync(`npx webpack-bundle-analyzer ${outputPath} --mode=json --report=${statsPath}`, { 
        stdio: 'pipe' 
      });
      
      const stats = JSON.parse(readFileSync(statsPath, 'utf8'));
      const metrics: PerformanceMetric[] = [];
      
      // Total bundle size
      const totalSize = stats.assets?.reduce((sum: number, asset: any) => sum + asset.size, 0) || 0;
      
      metrics.push({
        name: 'Total Bundle Size',
        value: totalSize,
        unit: 'bytes',
        category: 'bundle-size',
        threshold: { 
          warning: config.bundleAnalysis.sizeLimits.maxBundleSize, 
          critical: config.bundleAnalysis.sizeLimits.maxBundleSize * 1.5 
        },
        timestamp: new Date()
      });
      
      // Largest chunk size
      const largestChunk = Math.max(...(stats.assets?.map((asset: any) => asset.size) || [0]));
      
      metrics.push({
        name: 'Largest Chunk Size',
        value: largestChunk,
        unit: 'bytes',
        category: 'bundle-size',
        threshold: { 
          warning: config.bundleAnalysis.sizeLimits.maxChunkSize, 
          critical: config.bundleAnalysis.sizeLimits.maxChunkSize * 1.5 
        },
        timestamp: new Date()
      });
      
      return metrics;
      
    } catch (error) {
      console.warn(`    ⚠️  Bundle analysis failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Run memory usage test
   */
  private async runMemoryTest(test: PerformanceTest, envConfig: any): Promise<PerformanceMetric[]> {
    const url = `${envConfig.baseUrl}${test.url || ''}`;
    const iterations = test.configuration.iterations || 10;
    const interval = test.configuration.samplingInterval || 1000;
    
    try {
      const scriptPath = join(this.perfDir, 'memory-test.js');
      const output = execSync(
        `node ${scriptPath} "${url}" ${iterations} ${interval}`, 
        { encoding: 'utf8', timeout: 60000 }
      );
      
      const result = JSON.parse(output);
      
      const metrics: PerformanceMetric[] = [
        {
          name: 'Average Memory Usage',
          value: result.averageMemoryUsage,
          unit: 'bytes',
          category: 'memory',
          threshold: { warning: 50 * 1024 * 1024, critical: 100 * 1024 * 1024 }, // 50MB/100MB
          timestamp: new Date()
        },
        {
          name: 'Peak Memory Usage',
          value: result.maxMemoryUsage,
          unit: 'bytes',
          category: 'memory',
          threshold: { warning: 100 * 1024 * 1024, critical: 200 * 1024 * 1024 }, // 100MB/200MB
          timestamp: new Date()
        }
      ];
      
      return metrics;
      
    } catch (error) {
      console.warn(`    ⚠️  Memory test failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Calculate performance summary
   */
  private calculateSummary(metrics: PerformanceMetric[]): PerformanceResult['summary'] {
    let totalScore = 0;
    let warnings = 0;
    let criticals = 0;
    
    metrics.forEach(metric => {
      // Calculate score based on thresholds
      let score = 100;
      if (metric.value > metric.threshold.critical) {
        score = 0;
        criticals++;
      } else if (metric.value > metric.threshold.warning) {
        score = 50;
        warnings++;
      }
      
      totalScore += score;
    });
    
    const averageScore = metrics.length > 0 ? totalScore / metrics.length : 100;
    
    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (averageScore >= 90) grade = 'A';
    else if (averageScore >= 80) grade = 'B';
    else if (averageScore >= 70) grade = 'C';
    else if (averageScore >= 60) grade = 'D';
    else grade = 'F';
    
    return {
      score: Math.round(averageScore),
      grade,
      warnings,
      criticals
    };
  }

  /**
   * Detect performance regressions
   */
  private async detectRegressions(result: PerformanceResult): Promise<void> {
    const baselineResults = await this.getBaselineResults(result.testId, result.environment);
    
    if (baselineResults.length === 0) {
      console.log(`    ℹ️  No baseline found for ${result.testId}, creating baseline`);
      await this.updateBaseline(result);
      return;
    }
    
    const config = this.getConfiguration();
    const baseline = baselineResults[0]; // Most recent baseline
    result.baseline = baseline;
    
    const degradedMetrics: string[] = [];
    
    // Compare metrics with baseline
    for (const metric of result.metrics) {
      const baselineMetric = baseline.metrics.find(m => m.name === metric.name);
      
      if (baselineMetric) {
        const regressionThreshold = config.monitoring.regressionThresholds.warning / 100;
        const degradation = (metric.value - baselineMetric.value) / baselineMetric.value;
        
        if (degradation > regressionThreshold) {
          degradedMetrics.push(metric.name);
        }
      }
    }
    
    if (degradedMetrics.length > 0) {
      const criticalThreshold = config.monitoring.regressionThresholds.critical / 100;
      const hasCritical = result.metrics.some(metric => {
        const baselineMetric = baseline.metrics.find(m => m.name === metric.name);
        if (baselineMetric) {
          const degradation = (metric.value - baselineMetric.value) / baselineMetric.value;
          return degradation > criticalThreshold;
        }
        return false;
      });
      
      result.regression = {
        detected: true,
        degradedMetrics,
        severity: hasCritical ? 'critical' : 'high'
      };
      
      console.log(`    📉 REGRESSION DETECTED in ${result.testId}:`);
      console.log(`       Degraded metrics: ${degradedMetrics.join(', ')}`);
      console.log(`       Severity: ${result.regression.severity}`);
    } else {
      result.regression = {
        detected: false,
        degradedMetrics: [],
        severity: 'low'
      };
    }
  }

  /**
   * Get baseline results for comparison
   */
  private async getBaselineResults(testId: string, environment: string): Promise<PerformanceResult[]> {
    const benchmarkPath = join(this.benchmarksDir, `${environment}-${testId}.json`);
    
    if (!existsSync(benchmarkPath)) {
      return [];
    }
    
    const benchmark: PerformanceBenchmark = JSON.parse(readFileSync(benchmarkPath, 'utf8'));
    return benchmark.baselineResults || [];
  }

  /**
   * Update baseline results
   */
  private async updateBaseline(result: PerformanceResult): Promise<void> {
    const benchmarkPath = join(this.benchmarksDir, `${result.environment}-${result.testId}.json`);
    
    let benchmark: PerformanceBenchmark;
    
    if (existsSync(benchmarkPath)) {
      benchmark = JSON.parse(readFileSync(benchmarkPath, 'utf8'));
    } else {
      benchmark = {
        environment: result.environment,
        baselineResults: [],
        thresholds: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    // Keep only the last 5 baseline results
    benchmark.baselineResults.unshift(result);
    benchmark.baselineResults = benchmark.baselineResults.slice(0, 5);
    benchmark.updatedAt = new Date();
    
    writeFileSync(benchmarkPath, JSON.stringify(benchmark, null, 2));
    console.log(`    📊 Updated baseline for ${result.testId}`);
  }

  /**
   * Save performance results
   */
  private async saveResults(results: PerformanceResult[], environment: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultPath = join(this.resultsDir, `perf-${environment}-${timestamp}.json`);
    
    writeFileSync(resultPath, JSON.stringify(results, null, 2));
    console.log(`💾 Performance results saved: ${resultPath}`);
  }

  /**
   * Generate performance report
   */
  private async generatePerformanceReport(results: PerformanceResult[], environment: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = join(this.resultsDir, `perf-report-${environment}-${timestamp}.html`);
    
    const regressions = results.filter(r => r.regression?.detected);
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report - ${environment}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .grade-A { border-left: 4px solid #28a745; }
        .grade-B { border-left: 4px solid #17a2b8; }
        .grade-C { border-left: 4px solid #ffc107; }
        .grade-D { border-left: 4px solid #fd7e14; }
        .grade-F { border-left: 4px solid #dc3545; }
        .test-result { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
        .test-header { padding: 15px; background: #f8f9fa; border-bottom: 1px solid #ddd; }
        .test-content { padding: 15px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .metric { background: #f8f9fa; padding: 10px; border-radius: 4px; }
        .regression { background: #f8d7da; border: 1px solid #f5c6cb; }
        .regression-badge { background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ Performance Test Report</h1>
            <p>Environment: <strong>${environment}</strong></p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>${results.length}</h3>
                <p>Tests Run</p>
            </div>
            <div class="summary-card">
                <h3>${regressions.length}</h3>
                <p>Regressions Detected</p>
            </div>
            <div class="summary-card">
                <h3>${Math.round(results.reduce((sum, r) => sum + r.summary.score, 0) / results.length)}</h3>
                <p>Average Score</p>
            </div>
            <div class="summary-card">
                <h3>${results.reduce((sum, r) => sum + r.duration, 0)}ms</h3>
                <p>Total Duration</p>
            </div>
        </div>
        
        ${results.map(result => `
            <div class="test-result ${result.regression?.detected ? 'regression' : ''}">
                <div class="test-header grade-${result.summary.grade}">
                    <h3>${result.testId} ${result.regression?.detected ? '<span class="regression-badge">REGRESSION</span>' : ''}</h3>
                    <p>Score: ${result.summary.score}/100 (Grade ${result.summary.grade}) | Duration: ${result.duration}ms</p>
                </div>
                <div class="test-content">
                    <div class="metrics-grid">
                        ${result.metrics.map(metric => `
                            <div class="metric">
                                <strong>${metric.name}</strong><br>
                                ${metric.value}${metric.unit}<br>
                                <small>Threshold: ${metric.threshold.warning}${metric.unit}</small>
                            </div>
                        `).join('')}
                    </div>
                    ${result.regression?.detected ? `
                        <div style="margin-top: 15px; padding: 10px; background: #f8d7da; border-radius: 4px;">
                            <strong>Regression Details:</strong><br>
                            Degraded metrics: ${result.regression.degradedMetrics.join(', ')}<br>
                            Severity: ${result.regression.severity}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    writeFileSync(reportPath, html);
    console.log(`📄 Performance report generated: ${reportPath}`);
  }

  /**
   * Get configuration
   */
  private getConfiguration(): any {
    if (!existsSync(this.configPath)) {
      throw new Error('Performance configuration not found. Run init first.');
    }
    
    return JSON.parse(readFileSync(this.configPath, 'utf8'));
  }

  /**
   * List recent performance test results
   */
  listRecentResults(limit: number = 10): PerformanceResult[] {
    if (!existsSync(this.resultsDir)) {
      return [];
    }

    const files = readdirSync(this.resultsDir)
      .filter(file => file.startsWith('perf-') && file.endsWith('.json'))
      .map(file => {
        const filePath = join(this.resultsDir, file);
        const stats = statSync(filePath);
        return { file, path: filePath, time: stats.mtime };
      })
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, limit);

    return files.flatMap(({ path }) => 
      JSON.parse(readFileSync(path, 'utf8'))
    );
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    [this.perfDir, this.resultsDir, this.benchmarksDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }
}

// CLI Interface
if (require.main === module) {
  const detector = new PerformanceRegressionDetector();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      detector.initialize().catch(error => {
        console.error('Initialization failed:', error);
        process.exit(1);
      });
      break;
    
    case 'test':
      const environment = args[1] || 'development';
      const testIds = args.slice(2);
      
      detector.runPerformanceTests(environment, testIds.length > 0 ? testIds : undefined)
        .catch(error => {
          console.error('Performance tests failed:', error);
          process.exit(1);
        });
      break;
    
    case 'list':
      try {
        const results = detector.listRecentResults();
        console.log(`⚡ Recent Performance Results (${results.length}):`);
        results.forEach(result => {
          const regressionStatus = result.regression?.detected ? '📉' : '✅';
          console.log(`  ${regressionStatus} ${result.testId} (${result.environment})`);
          console.log(`    Score: ${result.summary.score}/100 | ${result.timestamp.toLocaleString()}`);
        });
      } catch (error) {
        console.error('Failed to list results:', error);
        process.exit(1);
      }
      break;
    
    default:
      console.log(`
⚡ Performance Regression Detection System

Usage:
  tsx scripts/performance-regression-detection.ts <command> [options]

Commands:
  init                              - Initialize performance testing
  test [env] [test-ids...]          - Run performance tests
  list                              - List recent test results

Environments:
  development                       - Local development (default)
  staging                           - Staging environment
  production                        - Production environment

Examples:
  tsx scripts/performance-regression-detection.ts init
  tsx scripts/performance-regression-detection.ts test development
  tsx scripts/performance-regression-detection.ts test staging lighthouse-homepage
  tsx scripts/performance-regression-detection.ts list
      `);
  }
}

export { 
  PerformanceRegressionDetector, 
  PerformanceTest, 
  PerformanceResult, 
  PerformanceMetric 
}; 
<!-- Development Metrics Dashboard -->
<!-- Real-time monitoring of build times, test results, deployment status -->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { errorTracker } from '$lib/monitoring/error-tracking.js';
  import { performanceMonitor } from '$lib/monitoring/performance.js';
  import type { TrackedError } from '$lib/monitoring/error-tracking.js';
  import type { PerformanceMetric, PerformanceAlert } from '$lib/monitoring/performance.js';

  interface BuildMetrics {
    timestamp: string;
    duration: number;
    status: 'success' | 'failed';
    size: number;
    errors: number;
    warnings: number;
  }

  interface TestResults {
    timestamp: string;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    coverage: number;
    duration: number;
  }

  interface DeploymentStatus {
    timestamp: string;
    environment: string;
    status: 'deploying' | 'success' | 'failed';
    version: string;
    duration?: number;
  }

  interface CodeQualityMetrics {
    timestamp: string;
    complexity: number;
    maintainabilityIndex: number;
    technicalDebt: number;
    codeSmells: number;
    duplicateLines: number;
  }

  interface DependencyInfo {
    name: string;
    current: string;
    latest: string;
    type: 'dependencies' | 'devDependencies';
    vulnerabilities: number;
    updateAvailable: boolean;
  }

  let errors: TrackedError[] = [];
  let performanceMetrics: PerformanceMetric[] = [];
  let performanceAlerts: PerformanceAlert[] = [];
  let buildMetrics: BuildMetrics[] = [];
  let testResults: TestResults[] = [];
  let deploymentStatus: DeploymentStatus[] = [];
  let codeQuality: CodeQualityMetrics | null = null;
  let dependencies: DependencyInfo[] = [];
  
  let updateInterval: number;
  let isLoading = true;

  const refreshDashboard = async () => {
    try {
      // Get error tracking data
      errors = errorTracker.getErrors().slice(-10); // Last 10 errors
      
      // Get performance data
      performanceMetrics = performanceMonitor.getMetrics().slice(-20); // Last 20 metrics
      performanceAlerts = performanceMonitor.getAlerts().slice(-5); // Last 5 alerts
      
      // Mock data for build metrics (in real implementation, this would come from CI/CD)
      buildMetrics = await fetchBuildMetrics();
      testResults = await fetchTestResults();
      deploymentStatus = await fetchDeploymentStatus();
      codeQuality = await fetchCodeQuality();
      dependencies = await fetchDependencyInfo();
      
      isLoading = false;
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      isLoading = false;
    }
  };

  // Mock data functions (replace with real API calls)
  const fetchBuildMetrics = async (): Promise<BuildMetrics[]> => {
    // Mock recent builds
    return [
      { timestamp: new Date(Date.now() - 300000).toISOString(), duration: 45000, status: 'success', size: 2.4, errors: 0, warnings: 2 },
      { timestamp: new Date(Date.now() - 600000).toISOString(), duration: 52000, status: 'success', size: 2.5, errors: 0, warnings: 1 },
      { timestamp: new Date(Date.now() - 900000).toISOString(), duration: 48000, status: 'failed', size: 0, errors: 3, warnings: 0 },
    ];
  };

  const fetchTestResults = async (): Promise<TestResults[]> => {
    return [
      { timestamp: new Date().toISOString(), total: 127, passed: 125, failed: 2, skipped: 0, coverage: 87.5, duration: 12000 },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), total: 125, passed: 125, failed: 0, skipped: 0, coverage: 86.2, duration: 11500 },
    ];
  };

  const fetchDeploymentStatus = async (): Promise<DeploymentStatus[]> => {
    return [
      { timestamp: new Date().toISOString(), environment: 'staging', status: 'success', version: 'v1.2.3', duration: 180000 },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), environment: 'production', status: 'success', version: 'v1.2.2', duration: 240000 },
    ];
  };

  const fetchCodeQuality = async (): Promise<CodeQualityMetrics> => {
    return {
      timestamp: new Date().toISOString(),
      complexity: 3.2,
      maintainabilityIndex: 78,
      technicalDebt: 2.5,
      codeSmells: 12,
      duplicateLines: 145
    };
  };

  const fetchDependencyInfo = async (): Promise<DependencyInfo[]> => {
    // In real implementation, this would scan package.json and check for updates
    return [
      { name: 'svelte', current: '5.0.0', latest: '5.1.0', type: 'dependencies', vulnerabilities: 0, updateAvailable: true },
      { name: '@types/node', current: '22.0.0', latest: '22.5.0', type: 'devDependencies', vulnerabilities: 0, updateAvailable: true },
      { name: 'vite', current: '6.2.6', latest: '6.2.6', type: 'devDependencies', vulnerabilities: 0, updateAvailable: false },
    ];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatSize = (mb: number): string => {
    return `${mb.toFixed(1)} MB`;
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'deploying': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  onMount(() => {
    if (browser) {
      refreshDashboard();
      // Refresh every 30 seconds
      updateInterval = setInterval(refreshDashboard, 30000);
    }
  });

  onDestroy(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });
</script>

<svelte:head>
  <title>Development Dashboard - Synapse Hub</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Development Dashboard</h1>
      <p class="text-gray-600 mt-2">Real-time monitoring of build, test, and deployment metrics</p>
    </div>

    {#if isLoading}
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    {:else}
      <!-- Key Metrics Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-sm font-medium text-gray-500">Build Status</h3>
          <div class="mt-2">
            {#if buildMetrics.length > 0}
              {@const latest = buildMetrics[0]}
              <div class="text-2xl font-bold {getStatusColor(latest.status)}">
                {latest.status.toUpperCase()}
              </div>
              <div class="text-sm text-gray-500">
                {formatDuration(latest.duration)} • {formatSize(latest.size)}
              </div>
            {:else}
              <div class="text-2xl font-bold text-gray-400">No Data</div>
            {/if}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-sm font-medium text-gray-500">Test Results</h3>
          <div class="mt-2">
            {#if testResults.length > 0}
              {@const latest = testResults[0]}
              <div class="text-2xl font-bold {latest.failed > 0 ? 'text-red-600' : 'text-green-600'}">
                {latest.passed}/{latest.total}
              </div>
              <div class="text-sm text-gray-500">
                {latest.coverage}% coverage
              </div>
            {:else}
              <div class="text-2xl font-bold text-gray-400">No Data</div>
            {/if}
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-sm font-medium text-gray-500">Active Errors</h3>
          <div class="mt-2">
            <div class="text-2xl font-bold {errors.length > 0 ? 'text-red-600' : 'text-green-600'}">
              {errors.length}
            </div>
            <div class="text-sm text-gray-500">
              {errors.filter(e => !e.resolved).length} unresolved
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-sm font-medium text-gray-500">Code Quality</h3>
          <div class="mt-2">
            {#if codeQuality}
              <div class="text-2xl font-bold text-blue-600">
                {codeQuality.maintainabilityIndex}
              </div>
              <div class="text-sm text-gray-500">
                Maintainability Index
              </div>
            {:else}
              <div class="text-2xl font-bold text-gray-400">No Data</div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Detailed Sections -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Recent Errors -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Recent Errors</h2>
          </div>
          <div class="p-6">
            {#if errors.length > 0}
              <div class="space-y-4">
                {#each errors.slice(0, 5) as error}
                  <div class="border-l-4 border-{getSeverityColor(error.severity).split('-')[1]}-500 pl-4">
                    <div class="flex items-center justify-between">
                      <span class="font-medium text-gray-900">{error.message}</span>
                      <span class="text-xs {getSeverityColor(error.severity)}">
                        {error.severity.toUpperCase()}
                      </span>
                    </div>
                    <div class="text-sm text-gray-500 mt-1">
                      {error.category} • {error.context.component || 'Unknown'} • Count: {error.count}
                    </div>
                    <div class="text-xs text-gray-400">
                      {formatTimestamp(error.timestamp)}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-gray-500">No recent errors</p>
            {/if}
          </div>
        </div>

        <!-- Performance Alerts -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Performance Alerts</h2>
          </div>
          <div class="p-6">
            {#if performanceAlerts.length > 0}
              <div class="space-y-4">
                {#each performanceAlerts as alert}
                  <div class="border-l-4 border-{alert.severity === 'critical' ? 'red' : 'yellow'}-500 pl-4">
                    <div class="flex items-center justify-between">
                      <span class="font-medium text-gray-900">{alert.metric.name}</span>
                      <span class="text-xs {alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}">
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <div class="text-sm text-gray-500 mt-1">
                      {alert.metric.value}{alert.metric.unit} (threshold: {alert.benchmark[alert.severity]}{alert.benchmark.unit})
                    </div>
                    <div class="text-xs text-gray-400">
                      {formatTimestamp(alert.timestamp)}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-gray-500">No performance alerts</p>
            {/if}
          </div>
        </div>

        <!-- Build History -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Build History</h2>
          </div>
          <div class="p-6">
            {#if buildMetrics.length > 0}
              <div class="space-y-3">
                {#each buildMetrics as build}
                  <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span class="font-medium {getStatusColor(build.status)}">
                        {build.status.toUpperCase()}
                      </span>
                      <div class="text-sm text-gray-500">
                        {formatTimestamp(build.timestamp)}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-medium">{formatDuration(build.duration)}</div>
                      <div class="text-xs text-gray-500">{formatSize(build.size)}</div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-gray-500">No build history</p>
            {/if}
          </div>
        </div>

        <!-- Dependencies -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Dependencies</h2>
          </div>
          <div class="p-6">
            {#if dependencies.length > 0}
              <div class="space-y-3">
                {#each dependencies as dep}
                  <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span class="font-medium text-gray-900">{dep.name}</span>
                      <div class="text-sm text-gray-500">
                        {dep.current}
                        {#if dep.updateAvailable}
                          → {dep.latest}
                        {/if}
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      {#if dep.vulnerabilities > 0}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {dep.vulnerabilities} vuln
                        </span>
                      {/if}
                      {#if dep.updateAvailable}
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          update
                        </span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-gray-500">No dependency data</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Code Quality Section -->
      {#if codeQuality}
        <div class="mt-8 bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Code Quality Metrics</h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{codeQuality.complexity}</div>
                <div class="text-sm text-gray-500">Complexity</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{codeQuality.maintainabilityIndex}</div>
                <div class="text-sm text-gray-500">Maintainability</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-yellow-600">{codeQuality.technicalDebt}h</div>
                <div class="text-sm text-gray-500">Technical Debt</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-orange-600">{codeQuality.codeSmells}</div>
                <div class="text-sm text-gray-500">Code Smells</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">{codeQuality.duplicateLines}</div>
                <div class="text-sm text-gray-500">Duplicate Lines</div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div> 
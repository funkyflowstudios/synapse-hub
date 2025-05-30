<script lang="ts">
	// Development Monitoring & Status Panel - Right panel with comprehensive development insights
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	export let isFloatingIsland: boolean = false;
	export let isMinimized: boolean = false;

	const dispatch = createEventDispatcher();

	// UI State for collapsible sections
	let expandedSections = {
		project: true,
		build: true,
		environment: false,
		logs: false,
		dependencies: false,
		performance: false
	};

	// Project Status
	let projectStatus = {
		application: {
			name: 'Synapse Hub',
			pid: 3847,
			status: 'Running',
			uptime: '2h 15m',
			memory: '245.7 MB',
			cpu: '1.2%'
		},
		vcs: {
			branch: 'feature/voice-input',
			status: 'Modified',
			uncommittedChanges: 3,
			lastCommit: '2h ago'
		}
	};

	// Build & Test Status
	let buildStatus = {
		ci: {
			status: 'success', // 'success' | 'failed' | 'running' | 'pending'
			branch: 'main',
			buildNumber: 123,
			duration: '3m 24s',
			timestamp: '15m ago'
		},
		tests: {
			passed: 142,
			failed: 2,
			total: 144,
			coverage: 87.3,
			duration: '45s',
			lastRun: '8m ago'
		},
		localBuild: {
			status: 'success',
			duration: '2m 15s',
			lastRun: '12m ago'
		}
	};

	// Development Environment
	let environment = {
		sdks: [
			{ name: 'Node.js', version: '20.10.0', status: 'active' },
			{ name: 'npm', version: '10.2.3', status: 'active' },
			{ name: 'TypeScript', version: '5.3.2', status: 'active' },
			{ name: 'Svelte', version: '4.2.8', status: 'active' }
		],
		resources: {
			freeDisk: '45.2 GB',
			availableRam: '8.3 GB',
			swapUsage: '124 MB'
		},
		envVars: [
			{ name: 'NODE_ENV', value: 'development' },
			{ name: 'VITE_API_URL', value: 'http://localhost:3000' },
			{ name: 'DEBUG', value: '*' }
		]
	};

	// Live Logs
	let logs = {
		entries: [
			{
				level: 'info',
				timestamp: '10:51:23',
				message: 'Server started on port 5173',
				source: 'vite'
			},
			{
				level: 'warn',
				timestamp: '10:51:45',
				message: 'Unused CSS selector detected',
				source: 'svelte'
			},
			{
				level: 'error',
				timestamp: '10:52:12',
				message: 'Failed to load module: ./missing-file.js',
				source: 'app'
			},
			{ level: 'info', timestamp: '10:52:34', message: 'Hot reload complete', source: 'vite' },
			{
				level: 'debug',
				timestamp: '10:52:56',
				message: 'Component re-rendered: InputControlNexus',
				source: 'svelte'
			}
		],
		filters: {
			level: 'all', // 'all' | 'error' | 'warn' | 'info' | 'debug'
			source: 'all' // 'all' | 'vite' | 'svelte' | 'app'
		},
		stats: {
			errors: 1,
			warnings: 3,
			info: 12
		}
	};

	// Dependencies Health
	let dependencies = {
		outdated: [
			{ name: '@types/node', current: '20.8.0', latest: '20.10.0', severity: 'minor' },
			{ name: 'eslint', current: '8.52.0', latest: '8.55.0', severity: 'patch' }
		],
		vulnerabilities: [
			{ name: 'lodash', severity: 'moderate', issue: 'Prototype Pollution', fixAvailable: true }
		],
		totalPackages: 247,
		needsUpdate: 12,
		hasVulnerabilities: 1
	};

	// Performance Metrics (compact)
	let performance = {
		system: {
			cpu: 23.4,
			memory: 67.8,
			disk: 45.2,
			network: 'Good'
		},
		app: {
			buildTime: '2m 15s',
			bundleSize: '1.2 MB',
			loadTime: '340ms'
		}
	};

	// Auto-refresh intervals
	let refreshIntervals: Record<string, NodeJS.Timeout> = {};

	onMount(() => {
		// Simulate real-time updates
		refreshIntervals.project = setInterval(updateProjectStatus, 5000);
		refreshIntervals.logs = setInterval(updateLogs, 3000);
		refreshIntervals.performance = setInterval(updatePerformance, 2000);

		return () => {
			Object.values(refreshIntervals).forEach((interval) => clearInterval(interval));
		};
	});

	function toggleSection(section: keyof typeof expandedSections) {
		expandedSections[section] = !expandedSections[section];
	}

	function updateProjectStatus() {
		// Simulate status updates
		projectStatus.application.memory = `${(245 + Math.random() * 10).toFixed(1)} MB`;
		projectStatus.application.cpu = `${(1 + Math.random() * 2).toFixed(1)}%`;
	}

	function updateLogs() {
		// Simulate new log entries
		if (Math.random() > 0.7) {
			const logLevels = ['info', 'warn', 'error', 'debug'] as const;
			const newLog = {
				level: logLevels[Math.floor(Math.random() * 4)],
				timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 8),
				message: 'New log entry generated',
				source: ['vite', 'svelte', 'app'][Math.floor(Math.random() * 3)]
			};
			logs.entries = [...logs.entries.slice(-9), newLog];
		}
	}

	function updatePerformance() {
		// Simulate performance metric updates
		performance.system.cpu = Math.max(
			0,
			Math.min(100, performance.system.cpu + (Math.random() - 0.5) * 5)
		);
		performance.system.memory = Math.max(
			0,
			Math.min(100, performance.system.memory + (Math.random() - 0.5) * 2)
		);
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'success':
			case 'Running':
			case 'active':
				return 'var(--color-success)';
			case 'failed':
			case 'error':
				return 'var(--color-error)';
			case 'running':
			case 'pending':
				return 'var(--color-warning)';
			case 'Modified':
				return 'var(--color-warning)';
			default:
				return 'var(--color-text-secondary)';
		}
	}

	function getLogLevelColor(level: string) {
		switch (level) {
			case 'error':
				return 'var(--color-error)';
			case 'warn':
				return 'var(--color-warning)';
			case 'info':
				return 'var(--color-info)';
			case 'debug':
				return 'var(--color-text-secondary)';
			default:
				return 'var(--color-text-primary)';
		}
	}

	function getSeverityColor(severity: string) {
		switch (severity) {
			case 'critical':
			case 'high':
				return 'var(--color-error)';
			case 'moderate':
			case 'medium':
				return 'var(--color-warning)';
			case 'minor':
			case 'low':
			case 'patch':
				return 'var(--color-info)';
			default:
				return 'var(--color-text-secondary)';
		}
	}

	function runTests() {
		dispatch('runTests');
	}

	function updateDependencies() {
		dispatch('updateDependencies');
	}

	function clearLogs() {
		logs.entries = [];
		logs.stats = { errors: 0, warnings: 0, info: 0 };
	}
</script>

<aside
	class="monitoring-panel glass-panel-primary"
	class:floating-island={isFloatingIsland}
	class:minimized={isMinimized}
	aria-label="Development Monitoring Panel"
>
	<div class="monitoring-content">
		<!-- Project Status (always visible) -->
		<section class="monitoring-section">
			<div class="section-header">
				<h2 class="section-title">Project Status</h2>
				<button
					class="expand-btn"
					class:expanded={expandedSections.project}
					on:click={() => toggleSection('project')}
					title={expandedSections.project ? 'Show less' : 'Show more'}
					aria-label={expandedSections.project ? 'Collapse project status section' : 'Expand project status section'}
				>
					{expandedSections.project ? '−' : '+'}
				</button>
			</div>

			<div class="status-summary">
				<div class="app-status">
					<div class="status-indicator">
						<span
							class="status-dot"
							style="background: {getStatusColor(projectStatus.application.status)}"
						></span>
						<span class="app-name">{projectStatus.application.name}</span>
					</div>
					<div class="resource-usage">
						<span class="usage-item">CPU: {projectStatus.application.cpu}</span>
						<span class="usage-item">RAM: {projectStatus.application.memory}</span>
					</div>
				</div>
				<div class="vcs-status">
					<span class="branch">{projectStatus.vcs.branch}</span>
					<span class="changes" style="color: {getStatusColor(projectStatus.vcs.status)}">
						{projectStatus.vcs.uncommittedChanges} changes
					</span>
				</div>
			</div>

			{#if expandedSections.project}
				<div class="status-details" transition:slide={{ duration: 300 }}>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">PID:</span>
							<span class="detail-value">{projectStatus.application.pid}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Uptime:</span>
							<span class="detail-value">{projectStatus.application.uptime}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Last Commit:</span>
							<span class="detail-value">{projectStatus.vcs.lastCommit}</span>
						</div>
					</div>
				</div>
			{/if}
		</section>

		<!-- Build & Tests -->
		<section class="monitoring-section">
			<div class="section-header">
				<h2 class="section-title">Build & Tests</h2>
				<button
					class="expand-btn"
					class:expanded={expandedSections.build}
					on:click={() => toggleSection('build')}
					title={expandedSections.build ? 'Show less' : 'Show more'}
					aria-label={expandedSections.build ? 'Collapse build and tests section' : 'Expand build and tests section'}
				>
					{expandedSections.build ? '−' : '+'}
				</button>
			</div>

			<div class="build-summary">
				<div class="build-status">
					<span class="status-indicator">
						<span class="status-dot" style="background: {getStatusColor(buildStatus.ci.status)}"
						></span>
						<span>CI: Build #{buildStatus.ci.buildNumber}</span>
					</span>
					<span class="build-time">{buildStatus.ci.duration}</span>
				</div>
				<div class="test-status">
					<span
						class="test-ratio"
						style="color: {buildStatus.tests.failed > 0
							? 'var(--color-error)'
							: 'var(--color-success)'}"
					>
						Tests: {buildStatus.tests.passed}/{buildStatus.tests.total}
					</span>
					<span class="coverage">Coverage: {buildStatus.tests.coverage}%</span>
				</div>
			</div>

			{#if expandedSections.build}
				<div class="build-details" transition:slide={{ duration: 300 }}>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">Local Build:</span>
							<span
								class="detail-value"
								style="color: {getStatusColor(buildStatus.localBuild.status)}"
							>
								{buildStatus.localBuild.status} ({buildStatus.localBuild.duration})
							</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Test Duration:</span>
							<span class="detail-value">{buildStatus.tests.duration}</span>
						</div>
					</div>
					<button class="action-btn" on:click={runTests} aria-label="Run tests"> Run Tests </button>
				</div>
			{/if}
		</section>

		<!-- Development Environment -->
		<section class="monitoring-section">
			<div class="section-header">
				<h2 class="section-title">Environment</h2>
				<button
					class="expand-btn"
					class:expanded={expandedSections.environment}
					on:click={() => toggleSection('environment')}
					title={expandedSections.environment ? 'Show less' : 'Show more'}
					aria-label={expandedSections.environment ? 'Collapse environment section' : 'Expand environment section'}
				>
					{expandedSections.environment ? '−' : '+'}
				</button>
			</div>

			{#if expandedSections.environment}
				<div class="environment-details" transition:slide={{ duration: 300 }}>
					<div class="sdk-list">
						<h4 class="subsection-title">Active SDKs</h4>
						{#each environment.sdks as sdk (sdk.name)}
							<div class="sdk-item">
								<span class="sdk-name">{sdk.name}</span>
								<span class="sdk-version">{sdk.version}</span>
							</div>
						{/each}
					</div>

					<div class="resources-info">
						<h4 class="subsection-title">System Resources</h4>
						<div class="resource-grid">
							<div class="resource-item">
								<span class="resource-label">Free Disk:</span>
								<span class="resource-value">{environment.resources.freeDisk}</span>
							</div>
							<div class="resource-item">
								<span class="resource-label">Available RAM:</span>
								<span class="resource-value">{environment.resources.availableRam}</span>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</section>

		<!-- Live Logs -->
		<section class="monitoring-section">
			<div class="section-header">
				<h2 class="section-title">Live Logs</h2>
				<div class="header-stats">
					<span class="stat-badge error">{logs.stats.errors}</span>
					<span class="stat-badge warn">{logs.stats.warnings}</span>
					<button
						class="expand-btn"
						class:expanded={expandedSections.logs}
						on:click={() => toggleSection('logs')}
						title={expandedSections.logs ? 'Show less' : 'Show more'}
						aria-label={expandedSections.logs ? 'Collapse logs section' : 'Expand logs section'}
					>
						{expandedSections.logs ? '−' : '+'}
					</button>
				</div>
			</div>

			{#if expandedSections.logs}
				<div class="logs-container" transition:slide={{ duration: 300 }}>
					<div class="log-controls">
						<button class="clear-btn" on:click={clearLogs} aria-label="Clear log entries">Clear</button>
					</div>
					<div class="log-entries">
						{#each logs.entries.slice(-5) as entry (entry.timestamp + entry.message)}
							<div class="log-entry">
								<span class="log-time">{entry.timestamp}</span>
								<span class="log-level" style="color: {getLogLevelColor(entry.level)}"
									>{entry.level}</span
								>
								<span class="log-message">{entry.message}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<!-- Dependencies Health -->
		<section class="monitoring-section">
			<div class="section-header">
				<h2 class="section-title">Dependencies</h2>
				<div class="header-stats">
					<span class="stat-badge warn">{dependencies.needsUpdate}</span>
					<span class="stat-badge error">{dependencies.hasVulnerabilities}</span>
					<button
						class="expand-btn"
						class:expanded={expandedSections.dependencies}
						on:click={() => toggleSection('dependencies')}
						title={expandedSections.dependencies ? 'Show less' : 'Show more'}
						aria-label={expandedSections.dependencies ? 'Collapse dependencies section' : 'Expand dependencies section'}
					>
						{expandedSections.dependencies ? '−' : '+'}
					</button>
				</div>
			</div>

			{#if expandedSections.dependencies}
				<div class="dependencies-details" transition:slide={{ duration: 300 }}>
					{#if dependencies.outdated.length > 0}
						<div class="outdated-list">
							<h4 class="subsection-title">Updates Available</h4>
							{#each dependencies.outdated.slice(0, 3) as dep (dep.name)}
								<div class="dep-item">
									<span class="dep-name">{dep.name}</span>
									<span class="dep-versions">{dep.current} → {dep.latest}</span>
								</div>
							{/each}
						</div>
					{/if}

					{#if dependencies.vulnerabilities.length > 0}
						<div class="vulnerabilities-list">
							<h4 class="subsection-title">Security Issues</h4>
							{#each dependencies.vulnerabilities as vuln (vuln.name)}
								<div class="vuln-item">
									<span class="vuln-name">{vuln.name}</span>
									<span class="vuln-severity" style="color: {getSeverityColor(vuln.severity)}">
										{vuln.severity}
									</span>
								</div>
							{/each}
						</div>
					{/if}

					<button class="action-btn" on:click={updateDependencies} aria-label="Update dependencies"> Update Dependencies </button>
				</div>
			{/if}
		</section>

		<!-- Performance Metrics -->
		<section class="monitoring-section">
			<div class="section-header">
				<h2 class="section-title">Performance</h2>
				<button
					class="expand-btn"
					class:expanded={expandedSections.performance}
					on:click={() => toggleSection('performance')}
					title={expandedSections.performance ? 'Show less' : 'Show more'}
					aria-label={expandedSections.performance ? 'Collapse performance section' : 'Expand performance section'}
				>
					{expandedSections.performance ? '−' : '+'}
				</button>
			</div>

			{#if expandedSections.performance}
				<div class="performance-details" transition:slide={{ duration: 300 }}>
					<div class="perf-grid">
						<div class="perf-item">
							<span class="perf-label">CPU:</span>
							<span class="perf-value">{performance.system.cpu.toFixed(1)}%</span>
						</div>
						<div class="perf-item">
							<span class="perf-label">Memory:</span>
							<span class="perf-value">{performance.system.memory.toFixed(1)}%</span>
						</div>
						<div class="perf-item">
							<span class="perf-label">Build Time:</span>
							<span class="perf-value">{performance.app.buildTime}</span>
						</div>
						<div class="perf-item">
							<span class="perf-label">Bundle Size:</span>
							<span class="perf-value">{performance.app.bundleSize}</span>
						</div>
					</div>
				</div>
			{/if}
		</section>
	</div>
</aside>

<style>
	.monitoring-panel {
		height: 100%;
		background: var(--glass-primary-bg);
		backdrop-filter: blur(20px) saturate(140%) brightness(110%);
		border: 1px solid var(--glass-border-primary);
		border-radius: var(--radius-xl);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: var(--glass-shadow-outer);
		position: relative;
	}

	.monitoring-panel::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--glass-reflection);
		pointer-events: none;
		z-index: 1;
		border-radius: inherit;
	}

	.monitoring-panel::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 40%;
		background: var(--glass-gloss);
		pointer-events: none;
		z-index: 2;
		border-radius: inherit;
		opacity: 0.6;
	}

	.monitoring-panel.floating-island {
		position: fixed;
		top: var(--spacing-xl);
		right: var(--spacing-xl);
		width: 320px;
		height: auto;
		max-height: 80vh;
		z-index: 100;
		box-shadow: var(--shadow-elevation-highest);
	}

	.monitoring-panel.minimized {
		height: 60px;
		overflow: hidden;
	}

	.monitoring-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		background: rgba(26, 26, 26, 0.4);
		border: 1px solid var(--glass-border-secondary);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
		backdrop-filter: blur(8px);
		position: relative;
		z-index: 3;
	}

	.monitoring-section:last-child {
		border-bottom: none;
		padding-bottom: var(--spacing-md);
	}

	/* Section Headers - Enhanced */
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-xs);
	}

	.header-stats {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.section-title {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.expand-btn {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--glass-secondary-bg);
		backdrop-filter: blur(8px);
		border: 1px solid var(--glass-border-primary);
		color: var(--color-text-secondary);
		transition: all var(--transition-smooth);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: var(--font-size-sm);
		flex-shrink: 0;
		box-shadow: var(--shadow-elevation-low);
		cursor: pointer;
	}

	.expand-btn:hover {
		background: var(--glass-elevated-bg);
		color: var(--color-text-primary);
		transform: scale(1.1);
		box-shadow: var(--shadow-elevation-medium);
	}

	.expand-btn.expanded {
		background: var(--color-interactive-primary);
		color: var(--color-text-inverse);
		border-color: var(--color-interactive-primary);
		box-shadow: 0 0 12px rgba(22, 163, 74, 0.4);
	}

	/* Status Summary - Enhanced */
	.status-summary {
		background: var(--glass-secondary-bg);
		backdrop-filter: blur(12px);
		border: 1px solid var(--glass-border-secondary);
		border-radius: var(--radius-lg);
		padding: var(--spacing-sm);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		box-shadow: var(--shadow-elevation-low);
	}

	.app-status {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
		box-shadow: 0 0 8px currentColor;
		animation: subtle-pulse 2s ease-in-out infinite;
	}

	@keyframes subtle-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.app-name {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.resource-usage {
		display: flex;
		gap: var(--spacing-sm);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		font-family: var(--font-mono);
	}

	.vcs-status {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--spacing-xs);
		border-top: 1px solid var(--glass-border-secondary);
		font-size: var(--font-size-xs);
	}

	.branch {
		color: var(--color-text-secondary);
	}

	.changes {
		font-weight: var(--font-weight-medium);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		background: rgba(34, 197, 94, 0.1);
	}

	/* Details - Enhanced */
	.status-details,
	.build-details,
	.environment-details,
	.logs-container,
	.dependencies-details,
	.performance-details {
		background: var(--glass-elevated-bg);
		backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border-primary);
		border-radius: var(--radius-lg);
		padding: var(--spacing-sm);
		box-shadow: var(--shadow-elevation-medium);
		position: relative;
		overflow: hidden;
	}

	.status-details::before,
	.build-details::before,
	.environment-details::before,
	.logs-container::before,
	.dependencies-details::before,
	.performance-details::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
		pointer-events: none;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-sm);
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.detail-label {
		font-size: 10px;
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.detail-value {
		font-size: var(--font-size-xs);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-medium);
		font-family: var(--font-mono);
	}

	/* Build Status */
	.build-summary {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		background: var(--color-surface-secondary);
		border-radius: var(--radius-sm);
		padding: var(--spacing-sm);
	}

	.build-status,
	.test-status {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: var(--font-size-xs);
	}

	.build-time,
	.coverage {
		color: var(--color-text-secondary);
	}

	/* Logs */
	.log-controls {
		display: flex;
		justify-content: flex-end;
		margin-bottom: var(--spacing-xs);
	}

	.clear-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		background: var(--glass-secondary-bg);
		backdrop-filter: blur(12px);
		border: 1px solid var(--glass-border-primary);
		border-radius: var(--radius-lg);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-smooth);
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-elevation-low);
		min-height: 32px;
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
	}

	.clear-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
		opacity: 0;
		transition: opacity var(--transition-smooth);
	}

	.clear-btn:hover {
		background: var(--glass-elevated-bg);
		color: var(--color-text-primary);
		transform: translateY(-2px);
		box-shadow:
			var(--shadow-elevation-medium),
			0 0 16px rgba(22, 163, 74, 0.15);
		border-color: rgba(22, 163, 74, 0.4);
	}

	.clear-btn:hover::before {
		opacity: 1;
	}

	.log-entries {
		max-height: 120px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.log-entry {
		display: grid;
		grid-template-columns: auto auto 1fr;
		gap: var(--spacing-xs);
		font-size: 10px;
		font-family: var(--font-mono);
		padding: 2px 0;
		border-bottom: 1px solid var(--color-border-tertiary);
	}

	.log-time {
		color: var(--color-text-secondary);
		font-weight: var(--font-weight-medium);
	}

	.log-level {
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		min-width: 40px;
	}

	.log-message {
		color: var(--color-text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Environment */
	.sdk-list,
	.resources-info,
	.outdated-list,
	.vulnerabilities-list {
		margin-bottom: var(--spacing-sm);
	}

	.subsection-title {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0 0 var(--spacing-xs) 0;
	}

	.sdk-item,
	.dep-item,
	.vuln-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2px 0;
		font-size: var(--font-size-xs);
	}

	.sdk-name,
	.dep-name,
	.vuln-name {
		color: var(--color-text-primary);
		font-weight: var(--font-weight-medium);
	}

	.sdk-version,
	.dep-versions {
		color: var(--color-text-secondary);
		font-family: var(--font-mono);
	}

	.resource-grid,
	.perf-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-xs);
	}

	.resource-item,
	.perf-item {
		display: flex;
		justify-content: space-between;
		font-size: var(--font-size-xs);
	}

	.resource-label,
	.perf-label {
		color: var(--color-text-secondary);
	}

	.resource-value,
	.perf-value {
		color: var(--color-text-primary);
		font-weight: var(--font-weight-medium);
		font-family: var(--font-mono);
	}

	/* Action Buttons */
	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
		background: var(--glass-secondary-bg);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(22, 163, 74, 0.3);
		border-radius: var(--radius-lg);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-smooth);
		position: relative;
		overflow: hidden;
		box-shadow:
			var(--shadow-elevation-low),
			0 0 8px rgba(22, 163, 74, 0.1);
		min-height: 44px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
	}

	.action-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
		opacity: 0;
		transition: opacity var(--transition-smooth);
	}

	.action-btn:hover {
		background: var(--glass-elevated-bg);
		color: var(--color-text-primary);
		transform: translateY(-2px);
		box-shadow:
			var(--shadow-elevation-medium),
			0 0 16px rgba(22, 163, 74, 0.2);
		border-color: rgba(22, 163, 74, 0.5);
	}

	.action-btn:hover::before {
		opacity: 1;
	}

	/* Add scrollable content area similar to other panels */
	.monitoring-panel > * {
		position: relative;
		z-index: 3;
	}

	/* Make the main content scrollable */
	.monitoring-panel {
		height: 100%;
		background: var(--glass-primary-bg);
		backdrop-filter: blur(20px) saturate(140%) brightness(110%);
		border: 1px solid var(--glass-border-primary);
		border-radius: var(--radius-xl);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: var(--glass-shadow-outer);
		position: relative;
	}

	/* Create a scrollable content wrapper */
	.monitoring-panel .monitoring-section:first-child {
		margin-top: var(--spacing-lg);
	}

	.monitoring-panel .monitoring-section:last-child {
		margin-bottom: var(--spacing-lg);
		border-bottom: none;
		padding-bottom: var(--spacing-md);
	}

	/* Add internal scrolling container */
	.monitoring-panel::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 40%;
		background: var(--glass-gloss);
		pointer-events: none;
		z-index: 2;
		border-radius: inherit;
		opacity: 0.6;
	}

	/* Ensure sections container is scrollable */
	.monitoring-panel {
		padding: 0; /* Remove padding from main container */
		gap: 0; /* Remove gap from main container */
	}

	/* Add scrollable wrapper */
	.monitoring-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		position: relative;
		z-index: 3;
	}

	/* Logs */
	.stat-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 18px;
		padding: 0 var(--spacing-xs);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		background: var(--color-surface-secondary);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border-secondary);
	}

	.stat-badge.error {
		background: var(--color-error-muted);
		color: var(--color-error);
		border-color: var(--color-error);
	}

	.stat-badge.warn {
		background: var(--color-warning-muted);
		color: var(--color-warning);
		border-color: var(--color-warning);
	}

	.log-controls {
		display: flex;
		justify-content: flex-end;
		margin-bottom: var(--spacing-xs);
	}
</style>

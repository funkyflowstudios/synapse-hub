<script lang="ts">
	// Contextual Orchestration Panel - Right panel for system status and orchestration
	export let width: string = '25%';
	export let isFloatingIsland: boolean = false;
	export let isMinimized: boolean = false;
	
	// Mock system vitals data
	const systemVitals = {
		cpu: 65,
		memory: 42,
		network: 88,
		agents: {
			cursor: 'connected',
			gemini: 'connected'
		}
	};
	
	function toggleMinimized() {
		isMinimized = !isMinimized;
	}
</script>

<aside 
	class={`contextual-orchestration-panel bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 
		${isFloatingIsland ? 'floating-island' : 'docked-panel'} 
		${isMinimized ? 'minimized' : ''}`}
	style={isFloatingIsland ? '' : `width: ${width}`}
	aria-label="Contextual Orchestration Panel"
>
	<header class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
		<h2 class={`font-semibold text-slate-900 dark:text-slate-100 ${isMinimized ? 'text-sm' : 'text-lg'}`}>
			{isMinimized ? 'Status' : 'Orchestration'}
		</h2>
		
		{#if isFloatingIsland}
			<div class="flex gap-1">
				<button 
					on:click={toggleMinimized}
					class="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
					title={isMinimized ? 'Expand' : 'Minimize'}
					aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if isMinimized}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
						{/if}
					</svg>
				</button>
				<button 
					class="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" 
					title="Dock panel"
					aria-label="Dock panel to sidebar"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
					</svg>
				</button>
			</div>
		{/if}
	</header>

	{#if !isMinimized}
		<div class="panel-content p-4 space-y-6 overflow-y-auto">
			<!-- Connection Status Section -->
			<section class="connection-status">
				<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Agent Status</h3>
				<div class="space-y-2">
					<div class="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-md">
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
							<span class="text-sm text-slate-900 dark:text-slate-100">Cursor</span>
						</div>
						<span class="text-xs text-green-600 dark:text-green-400">Connected</span>
					</div>
					<div class="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-md">
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
							<span class="text-sm text-slate-900 dark:text-slate-100">Gemini</span>
						</div>
						<span class="text-xs text-green-600 dark:text-green-400">Connected</span>
					</div>
				</div>
			</section>

			<!-- System Vitals Section -->
			<section class="system-vitals">
				<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">System Vitals</h3>
				<div class="space-y-3">
					<!-- CPU Usage -->
					<div class="vital-item">
						<div class="flex justify-between text-xs mb-1">
							<span class="text-slate-600 dark:text-slate-400">CPU</span>
							<span class="text-slate-900 dark:text-slate-100">{systemVitals.cpu}%</span>
						</div>
						<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
							<div 
								class="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
								style="width: {systemVitals.cpu}%"
							></div>
						</div>
					</div>
					
					<!-- Memory Usage -->
					<div class="vital-item">
						<div class="flex justify-between text-xs mb-1">
							<span class="text-slate-600 dark:text-slate-400">Memory</span>
							<span class="text-slate-900 dark:text-slate-100">{systemVitals.memory}%</span>
						</div>
						<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
							<div 
								class="bg-green-600 h-1.5 rounded-full transition-all duration-300" 
								style="width: {systemVitals.memory}%"
							></div>
						</div>
					</div>
					
					<!-- Network -->
					<div class="vital-item">
						<div class="flex justify-between text-xs mb-1">
							<span class="text-slate-600 dark:text-slate-400">Network</span>
							<span class="text-slate-900 dark:text-slate-100">{systemVitals.network}%</span>
						</div>
						<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
							<div 
								class="bg-purple-600 h-1.5 rounded-full transition-all duration-300" 
								style="width: {systemVitals.network}%"
							></div>
						</div>
					</div>
				</div>
			</section>

			<!-- A2A Orchestration Controls -->
			<section class="orchestration-controls">
				<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">A2A Controls</h3>
				<div class="space-y-2">
					<button class="w-full p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700 rounded-md text-sm text-slate-900 dark:text-slate-100 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-800/30 dark:hover:to-purple-800/30 transition-colors">
						Enable Collaboration
					</button>
					<button class="w-full p-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-md text-sm text-slate-900 dark:text-slate-100 hover:bg-orange-100 dark:hover:bg-orange-800/30 transition-colors">
						Throttle Mode
					</button>
					<button class="w-full p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md text-sm text-slate-900 dark:text-slate-100 hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors">
						Emergency Stop
					</button>
				</div>
			</section>

			<!-- Quick Workflow Suggestions -->
			<section class="workflow-suggestions">
				<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Suggested Workflows</h3>
				<div class="space-y-2">
					<div class="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md">
						<p class="text-xs text-slate-700 dark:text-slate-300">Debug → Analyze → Fix</p>
						<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Cursor + Gemini collaboration</p>
					</div>
					<div class="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md">
						<p class="text-xs text-slate-700 dark:text-slate-300">Research → Summarize</p>
						<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Gemini deep analysis</p>
					</div>
				</div>
			</section>
		</div>
	{:else}
		<!-- Minimized view showing only key indicators -->
		<div class="minimized-content p-2">
			<div class="flex gap-1">
				<div class="w-2 h-2 bg-blue-500 rounded-full" title="Cursor connected"></div>
				<div class="w-2 h-2 bg-purple-500 rounded-full" title="Gemini connected"></div>
				<div class="w-2 h-2 bg-green-500 rounded-full" title="System healthy"></div>
			</div>
		</div>
	{/if}
</aside>

<style>
	.contextual-orchestration-panel {
		/* CSS custom properties for future dynamic panel width manipulation */
		--panel-width: var(--orchestration-panel-width, 25%);
		transition: all 200ms ease-in-out;
	}
	
	.docked-panel {
		flex-shrink: 0;
		height: 100vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	
	.floating-island {
		position: fixed;
		top: 20px;
		right: 20px;
		width: 280px;
		max-height: 600px;
		border-radius: 12px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		backdrop-filter: blur(16px);
		z-index: 50;
	}
	
	.floating-island.minimized {
		width: 120px;
		height: 60px;
	}
	
	.panel-content {
		flex: 1;
		overflow-y: auto;
	}
	
	.minimized-content {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 40px;
	}
	
	/* Liquid crystal control effects */
	.contextual-orchestration-panel button {
		backdrop-filter: blur(8px);
		transition: all 200ms ease-in-out;
	}
	
	.contextual-orchestration-panel button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.contextual-orchestration-panel button:active {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	/* Sparkline-style progress bars with subtle glow */
	.vital-item .bg-blue-600 {
		box-shadow: 0 0 8px rgba(37, 99, 235, 0.3);
	}
	
	.vital-item .bg-green-600 {
		box-shadow: 0 0 8px rgba(22, 163, 74, 0.3);
	}
	
	.vital-item .bg-purple-600 {
		box-shadow: 0 0 8px rgba(147, 51, 234, 0.3);
	}
</style> 
<script lang="ts">
	// Master Control Panel - Left panel for controls and universal input
	export let width: string = '20%';
</script>

<aside 
	class="master-control-panel flex-shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 p-4"
	style="width: {width}"
	aria-label="Master Control Panel"
>
	<header class="mb-4">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Master Control</h2>
	</header>
	
	<div class="space-y-4">
		<!-- Target Selector Placeholder -->
		<section class="target-selector">
			<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">AI Targets</h3>
			<div class="flex gap-2">
				<button class="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-md text-sm">
					Cursor
				</button>
				<button class="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm">
					Gemini
				</button>
			</div>
		</section>

		<!-- Universal Input Field Placeholder -->
		<section class="universal-input">
			<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Universal Input</h3>
			<div class="space-y-2">
				<textarea 
					class="w-full h-24 p-3 border border-slate-300 dark:border-slate-600 rounded-md resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
					placeholder="Enter your command or query..."
				></textarea>
				<div class="flex gap-2">
					<button class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors">
						Send
					</button>
					<button class="px-3 py-1 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded text-sm hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors">
						Voice
					</button>
				</div>
			</div>
		</section>

		<!-- Quick Actions Placeholder -->
		<section class="quick-actions">
			<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quick Actions</h3>
			<div class="grid grid-cols-2 gap-2">
				<button class="p-2 bg-violet-100 dark:bg-violet-900 text-violet-900 dark:text-violet-100 rounded text-xs hover:bg-violet-200 dark:hover:bg-violet-800 transition-colors">
					Clarify
				</button>
				<button class="p-2 bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100 rounded text-xs hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors">
					Debug
				</button>
				<button class="p-2 bg-teal-100 dark:bg-teal-900 text-teal-900 dark:text-teal-100 rounded text-xs hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors">
					Summarize
				</button>
				<button class="p-2 bg-pink-100 dark:bg-pink-900 text-pink-900 dark:text-pink-100 rounded text-xs hover:bg-pink-200 dark:hover:bg-pink-800 transition-colors">
					Convert
				</button>
			</div>
		</section>
	</div>
</aside>

<style>
	.master-control-panel {
		/* CSS custom properties for future dynamic panel width manipulation */
		--panel-width: var(--master-control-width, 20%);
		transition: width 200ms ease-in-out;
	}
	
	/* Liquid crystal controls styling preparation */
	.master-control-panel button {
		backdrop-filter: blur(8px);
		transition: all 200ms ease-in-out;
	}
	
	.master-control-panel button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.master-control-panel button:active {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style> 
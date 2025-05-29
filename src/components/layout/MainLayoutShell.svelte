<script lang="ts">
	// Main Layout Shell - Implements responsive three-column layout
	import MasterControlPanel from '../panels/MasterControlPanel.svelte';
	import UnifiedConversationStream from '../panels/UnifiedConversationStream.svelte';
	import ContextualOrchestrationPanel from '../panels/ContextualOrchestrationPanel.svelte';
	
	// Reactive state for layout management
	let innerWidth = 0;
	let innerHeight = 0;
	
	// Panel width management with CSS custom properties
	let masterControlWidth = '20%';
	let conversationStreamWidth = '55%';
	let orchestrationPanelWidth = '25%';
	
	// Responsive breakpoints
	$: isDesktop = innerWidth >= 1200;
	$: isTablet = innerWidth >= 768 && innerWidth < 1200;
	$: isMobile = innerWidth < 768;
	
	// Floating island state for tablet layout
	$: isFloatingIsland = isTablet;
	$: isOrchestrationMinimized = false;
	
	// Dynamic panel width adjustment based on screen size
	$: {
		if (isDesktop) {
			// Desktop: Full three-column layout with adaptive widths
			masterControlWidth = '20%';
			conversationStreamWidth = '55%';
			orchestrationPanelWidth = '25%';
		} else if (isTablet) {
			// Tablet: Two-column with floating island
			masterControlWidth = '30%';
			conversationStreamWidth = '70%';
			orchestrationPanelWidth = '25%'; // Used for floating island sizing
		} else {
			// Mobile: Single column (handled by different layout)
			masterControlWidth = '100%';
			conversationStreamWidth = '100%';
			orchestrationPanelWidth = '100%';
		}
	}
	
	// Function to adjust panel widths dynamically (for future "fluidly adaptive" behavior)
	function adjustPanelWidths(focusPanel: 'master' | 'conversation' | 'orchestration') {
		// Placeholder for future implementation of panel width shifting based on focus
		// This will be enhanced in later phases with smooth animations
		console.log(`Focus shifted to ${focusPanel} panel`);
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<!-- Desktop and Tablet Layout -->
{#if !isMobile}
	<div 
		class="main-layout-shell desktop-tablet-layout" 
		style="
			--master-control-width: {masterControlWidth};
			--conversation-stream-width: {conversationStreamWidth};
			--orchestration-panel-width: {orchestrationPanelWidth};
		"
		role="application"
		aria-label="Synapse Hub Interface"
	>
		<!-- Master Control Panel -->
		<MasterControlPanel 
			width={masterControlWidth}
			on:focus={() => adjustPanelWidths('master')}
		/>
		
		<!-- Unified Conversation Stream -->
		<UnifiedConversationStream 
			width={conversationStreamWidth}
			on:focus={() => adjustPanelWidths('conversation')}
		/>
		
		<!-- Contextual Orchestration Panel -->
		{#if isDesktop}
			<ContextualOrchestrationPanel 
				width={orchestrationPanelWidth}
				isFloatingIsland={false}
				on:focus={() => adjustPanelWidths('orchestration')}
			/>
		{:else if isTablet}
			<!-- Floating Island for Tablet -->
			<ContextualOrchestrationPanel 
				isFloatingIsland={true}
				isMinimized={isOrchestrationMinimized}
				on:focus={() => adjustPanelWidths('orchestration')}
			/>
		{/if}
	</div>

<!-- Mobile Layout -->
{:else}
	<div 
		class="main-layout-shell mobile-layout"
		role="application"
		aria-label="Synapse Hub Mobile Interface"
	>
		<!-- Mobile Header with Quick Access -->
		<header class="mobile-header">
			<div class="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
				<h1 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Synapse Hub</h1>
				<div class="flex gap-2">
					<!-- Status Indicators -->
					<button 
						class="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" 
						title="Agent Status"
						aria-label="View agent connection status"
					>
						<div class="flex gap-1">
							<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
							<div class="w-2 h-2 bg-purple-500 rounded-full"></div>
						</div>
					</button>
					<!-- Menu Toggle -->
					<button 
						class="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" 
						title="Menu"
						aria-label="Open main menu"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
						</svg>
					</button>
				</div>
			</div>
		</header>
		
		<!-- Mobile Main Content - Primarily Conversation Stream -->
		<main class="mobile-main-content">
			<UnifiedConversationStream width="100%" />
		</main>
		
		<!-- Mobile Footer - Universal Input Field -->
		<footer class="mobile-footer persistent-input-footer">
			<div class="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
				<div class="flex gap-2 items-end">
					<div class="flex-1">
						<textarea 
							class="w-full h-12 p-3 border border-slate-300 dark:border-slate-600 rounded-lg resize-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
							placeholder="Ask anything..."
							rows="1"
						></textarea>
					</div>
					<button 
						class="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
						aria-label="Send message"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
						</svg>
					</button>
				</div>
				
				<!-- Quick Action Pills -->
				<div class="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
					<button class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-full text-xs whitespace-nowrap">
						Ask Cursor
					</button>
					<button class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 rounded-full text-xs whitespace-nowrap">
						Ask Gemini
					</button>
					<button class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 rounded-full text-xs whitespace-nowrap">
						Debug Code
					</button>
					<button class="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100 rounded-full text-xs whitespace-nowrap">
						Summarize
					</button>
				</div>
			</div>
		</footer>
	</div>
{/if}

<style>
	.main-layout-shell {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
	
	.desktop-tablet-layout {
		display: flex;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	}
	
	@media (prefers-color-scheme: dark) {
		.desktop-tablet-layout {
			background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
		}
	}
	
	.mobile-layout {
		display: flex;
		flex-direction: column;
		background: #ffffff;
	}
	
	@media (prefers-color-scheme: dark) {
		.mobile-layout {
			background: #0f172a;
		}
	}
	
	.mobile-header {
		flex-shrink: 0;
		z-index: 10;
	}
	
	.mobile-main-content {
		flex: 1;
		overflow: hidden;
	}
	
	.mobile-footer {
		flex-shrink: 0;
		z-index: 10;
	}
	
	.persistent-input-footer {
		/* Prepare for gesture-based shortcuts and intelligent expansion */
		transition: all 200ms ease-in-out;
	}
	
	/* Hide scrollbar for quick action pills */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	
	/* Fluidly adaptive panel width transitions */
	/* Note: This selector is prepared for future use when panel components are direct children */
	/* .desktop-tablet-layout > * {
		transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
	} */
	
	/* Container queries preparation for stateful adaptation */
	@container (min-width: 1200px) {
		.main-layout-shell {
			/* Future: Stateful container queries for focus mode, A2A active, etc. */
		}
	}
	
	/* Reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		/* .desktop-tablet-layout > *, */
		.persistent-input-footer {
			transition: none;
		}
	}
	
	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.desktop-tablet-layout {
			background: #ffffff;
			border: 2px solid #000000;
		}
		
		@media (prefers-color-scheme: dark) {
			.desktop-tablet-layout {
				background: #000000;
				border: 2px solid #ffffff;
			}
		}
	}
</style> 
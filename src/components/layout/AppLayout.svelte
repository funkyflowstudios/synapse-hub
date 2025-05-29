<script lang="ts">
	import MasterControlPanel from './MasterControlPanel.svelte';
	import UnifiedConversationStream from './UnifiedConversationStream.svelte';
	import ContextualOrchestrationPanel from './ContextualOrchestrationPanel.svelte';

	let { class: className = '' } = $props();

	// Responsive state management
	let innerWidth = $state(1024);
	let isTablet = $derived(innerWidth >= 768 && innerWidth < 1200);
	let isMobile = $derived(innerWidth < 768);
	let isDesktop = $derived(innerWidth >= 1200);

	// Panel state for responsive behavior
	let orchestrationFloating = $state(false);
	let orchestrationMinimized = $state(false);

	// CSS custom properties for fluid adaptation
	let masterPanelWidth = $state('22%');
	let mainPanelWidth = $state('56%');
	let orchestrationPanelWidth = $state('22%');

	// Update layout based on screen size
	$effect(() => {
		if (isDesktop) {
			orchestrationFloating = false;
			masterPanelWidth = '22%';
			mainPanelWidth = '56%';
			orchestrationPanelWidth = '22%';
		} else if (isTablet) {
			orchestrationFloating = true;
			masterPanelWidth = '30%';
			mainPanelWidth = '70%';
			orchestrationPanelWidth = '20rem'; // Fixed width for floating
		} else if (isMobile) {
			orchestrationFloating = true;
			orchestrationMinimized = true;
			masterPanelWidth = '100%';
			mainPanelWidth = '100%';
			orchestrationPanelWidth = '18rem'; // Smaller fixed width for mobile
		}
	});
</script>

<svelte:window bind:innerWidth />

<div 
	class="app-layout {className}"
	class:desktop={isDesktop}
	class:tablet={isTablet}
	class:mobile={isMobile}
	style:--master-panel-width={masterPanelWidth}
	style:--main-panel-width={mainPanelWidth}
	style:--orchestration-panel-width={orchestrationPanelWidth}
>
	<!-- Master Control Panel - Hidden on mobile except when explicitly shown -->
	{#if !isMobile}
		<div class="layout-panel master-panel">
			<MasterControlPanel />
		</div>
	{/if}

	<!-- Main Conversation Stream -->
	<div class="layout-panel main-panel">
		<UnifiedConversationStream />
		
		<!-- Mobile Footer - Persistent intelligent footer as per design spec -->
		{#if isMobile}
			<div class="mobile-footer" role="contentinfo">
				<div class="universal-input-placeholder">
					<button type="button" class="input-trigger" aria-label="Open universal input">
						<span class="input-hint">Tap to start conversation...</span>
						<span class="input-icon" aria-hidden="true">💬</span>
					</button>
				</div>
				
				<!-- Mobile navigation for accessing hidden panels -->
				<nav class="mobile-nav" aria-label="Mobile navigation">
					<button type="button" class="nav-button" aria-label="Show master control">
						<span aria-hidden="true">⚙️</span>
					</button>
					<button 
						type="button" 
						class="nav-button" 
						aria-label="Show context panel"
						onclick={() => {
							orchestrationFloating = true;
							orchestrationMinimized = false;
						}}
					>
						<span aria-hidden="true">📋</span>
					</button>
				</nav>
			</div>
		{/if}
	</div>

	<!-- Contextual Orchestration Panel -->
	{#if !isMobile || orchestrationFloating}
		<div class="layout-panel orchestration-panel" class:floating={orchestrationFloating}>
			<ContextualOrchestrationPanel 
				{isFloating: orchestrationFloating}
				{isMinimized: orchestrationMinimized}
			/>
		</div>
	{/if}
</div>

<style>
	.app-layout {
		display: grid;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		transition: all 0.3s ease;
		
		/* CSS Custom Properties for fluid adaptation */
		--panel-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		--panel-bg: #f8f9fa;
		--panel-border: #e9ecef;
		--panel-header-bg: #ffffff;
		--text-primary: #212529;
		--text-secondary: #6c757d;
		--button-bg: #ffffff;
		--button-border: #dee2e6;
		--button-hover-bg: #f8f9fa;
		--button-hover-border: #adb5bd;
		--focus-color: #0066cc;
		--primary-color: #007bff;
		--primary-hover: #0056b3;
	}

	/* Desktop Layout: Three-column grid */
	.app-layout.desktop {
		grid-template-columns: var(--master-panel-width) var(--main-panel-width) var(--orchestration-panel-width);
		grid-template-areas: "master main orchestration";
	}

	/* Tablet Layout: Two-column grid with floating orchestration */
	.app-layout.tablet {
		grid-template-columns: var(--master-panel-width) var(--main-panel-width);
		grid-template-areas: "master main";
	}

	/* Mobile Layout: Single column */
	.app-layout.mobile {
		grid-template-columns: 1fr;
		grid-template-areas: "main";
	}

	.layout-panel {
		overflow: hidden;
		transition: var(--panel-transition);
	}

	.master-panel {
		grid-area: master;
		border-right: 1px solid var(--panel-border);
	}

	.main-panel {
		grid-area: main;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.orchestration-panel {
		grid-area: orchestration;
	}

	.orchestration-panel.floating {
		/* Floating panel is positioned absolutely by the component itself */
		grid-area: none;
	}

	/* Mobile-specific styles */
	.mobile-footer {
		position: sticky;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--panel-header-bg);
		border-top: 1px solid var(--panel-border);
		padding: 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		z-index: 100;
	}

	.universal-input-placeholder {
		flex: 1;
	}

	.input-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: var(--button-bg);
		border: 1px solid var(--button-border);
		border-radius: 2rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.input-trigger:hover {
		background: var(--button-hover-bg);
		border-color: var(--button-hover-border);
	}

	.input-trigger:focus {
		outline: 2px solid var(--focus-color);
		outline-offset: 2px;
	}

	.input-hint {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.input-icon {
		font-size: 1.25rem;
	}

	.mobile-nav {
		display: flex;
		gap: 0.5rem;
	}

	.nav-button {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--button-bg);
		border: 1px solid var(--button-border);
		border-radius: 50%;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.15s ease;
	}

	.nav-button:hover {
		background: var(--button-hover-bg);
		border-color: var(--button-hover-border);
	}

	.nav-button:focus {
		outline: 2px solid var(--focus-color);
		outline-offset: 2px;
	}

	/* Responsive breakpoint adjustments */
	@media (max-width: 767px) {
		.app-layout {
			grid-template-rows: 1fr auto;
		}

		.main-panel {
			overflow: hidden;
		}
	}

	@media (min-width: 768px) and (max-width: 1199px) {
		.app-layout.tablet {
			grid-template-columns: 30% 70%;
		}
	}

	@media (min-width: 1200px) {
		.app-layout.desktop {
			/* Enable more subtle fluid adaptation on desktop */
			grid-template-columns: minmax(18%, 25%) minmax(50%, 60%) minmax(18%, 25%);
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.app-layout {
			--panel-border: #000000;
			--button-border: #000000;
			--text-secondary: #000000;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.app-layout,
		.layout-panel,
		.input-trigger,
		.nav-button {
			transition: none;
		}
	}

	/* Dark mode support (placeholder for future implementation) */
	@media (prefers-color-scheme: dark) {
		.app-layout {
			--panel-bg: #1a1a1a;
			--panel-border: #333333;
			--panel-header-bg: #2d2d2d;
			--text-primary: #ffffff;
			--text-secondary: #cccccc;
			--button-bg: #2d2d2d;
			--button-border: #444444;
			--button-hover-bg: #3a3a3a;
			--button-hover-border: #555555;
		}
	}
</style> 
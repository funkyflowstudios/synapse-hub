<script lang="ts">
	// Synapse Hub - Main Layout Shell
	// Implementing "Sophisticated Minimalism & Tactile Realism" design paradigm
	import InputControlNexus from '../panels/InputControlNexus.svelte';
	import CoCreationCanvas from '../panels/CoCreationCanvas.svelte';
	import OrchestrationForesightDeck from '../panels/OrchestrationForesightDeck.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// Responsive state management
	let innerWidth = 0;
	let innerHeight = 0;

	// Panel width management with CSS custom properties for fluidly adaptive behavior
	let inputControlWidth = '20%';
	let coCreationWidth = '60%';
	let orchestrationWidth = '20%';

	// Responsive breakpoints
	$: isDesktop = innerWidth >= 1200;
	$: isTablet = innerWidth >= 768 && innerWidth < 1200;
	$: isMobile = innerWidth < 768;

	// Focus and collaboration states
	let focusMode = false;
	let a2aActive = false;
	let activeWorkflow: string | null = null;

	// Orchestration panel state management
	let isOrchestrationMinimized = false;

	// Dynamic panel width adjustment based on screen size and states
	$: if (isDesktop) {
		// Desktop: Full three-column layout with adaptive widths
		if (focusMode) {
			inputControlWidth = '15%';
			coCreationWidth = '70%';
			orchestrationWidth = '15%';
		} else if (a2aActive) {
			inputControlWidth = '20%';
			coCreationWidth = '50%';
			orchestrationWidth = '30%';
		} else {
			inputControlWidth = '25%';
			coCreationWidth = '50%';
			orchestrationWidth = '25%';
		}
	} else if (isTablet) {
		// Tablet: Two-column with floating island
		inputControlWidth = '35%';
		coCreationWidth = '65%';
		orchestrationWidth = '300px'; // Fixed width as floating island
	} else {
		// Mobile: Single column
		inputControlWidth = '100%';
		coCreationWidth = '100%';
		orchestrationWidth = '100%';
	}

	// Floating island state for tablet layout
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	$: isFloatingIsland = isTablet;

	// Event handlers for component interactions
	function handleAgentSelected(event: CustomEvent) {
		dispatch('agentSelected', event.detail);
	}

	function handleOracleSubmit(event: CustomEvent) {
		dispatch('oracleSubmit', event.detail);
	}

	function handleQuickAction(event: CustomEvent) {
		dispatch('quickAction', event.detail);
	}

	function handleMessageAction(event: CustomEvent) {
		dispatch('messageAction', event.detail);
	}

	function handleCreateFocusZone(event: CustomEvent) {
		focusMode = true;
		dispatch('createFocusZone', event.detail);
	}

	function handleStartThread(event: CustomEvent) {
		dispatch('startThread', event.detail);
	}

	function handleA2AToggle(event: CustomEvent) {
		a2aActive = event.detail.enabled;
		dispatch('a2aToggle', event.detail);
	}

	function handleThrottleMode(event: CustomEvent) {
		dispatch('throttleMode', event.detail);
	}

	function handleEmergencyStop(event: CustomEvent) {
		a2aActive = false;
		focusMode = false;
		activeWorkflow = null;
		dispatch('emergencyStop', event.detail);
	}

	function handleExecuteWorkflow(event: CustomEvent) {
		activeWorkflow = event.detail.workflow.id;
		dispatch('executeWorkflow', event.detail);
	}

	function adjustPanelWidths(focusPanel: 'input' | 'canvas' | 'orchestration') {
		// Subtle panel width shifting based on focus or interaction
		// This creates the "fluidly adaptive" behavior described in the design

		switch (focusPanel) {
			case 'input':
				if (isDesktop) {
					inputControlWidth = '22%';
					coCreationWidth = '58%';
					orchestrationWidth = '20%';
				}
				break;
			case 'canvas':
				if (isDesktop) {
					inputControlWidth = '18%';
					coCreationWidth = '62%';
					orchestrationWidth = '20%';
				}
				break;
			case 'orchestration':
				if (isDesktop) {
					inputControlWidth = '20%';
					coCreationWidth = '55%';
					orchestrationWidth = '25%';
				}
				break;
			default:
				// Reset to default widths
				if (isDesktop) {
					inputControlWidth = '25%';
					coCreationWidth = '50%';
					orchestrationWidth = '25%';
				}
		}
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<!-- Desktop and Tablet Layout -->
{#if !isMobile}
	<div
		class="synapse-hub-layout desktop-tablet-layout"
		class:focus-mode={focusMode}
		class:a2a-active={a2aActive}
		class:workflow-active={activeWorkflow}
		style="
			--input-control-width: {inputControlWidth};
			--co-creation-width: {coCreationWidth};
			--orchestration-width: {orchestrationWidth};
		"
		role="application"
		aria-label="Synapse Hub Interface"
	>
		<!-- Input & Control Nexus (Left Panel) -->
		<InputControlNexus
			on:agentSelected={handleAgentSelected}
			on:oracleSubmit={handleOracleSubmit}
			on:quickAction={handleQuickAction}
			on:focus={() => adjustPanelWidths('input')}
		/>

		<!-- Co-Creation Canvas (Center Panel) -->
		<CoCreationCanvas
			on:messageAction={handleMessageAction}
			on:createFocusZone={handleCreateFocusZone}
			on:startThread={handleStartThread}
			on:focus={() => adjustPanelWidths('canvas')}
		/>

		<!-- Orchestration & Foresight Deck (Right Panel) -->
		{#if isDesktop}
			<OrchestrationForesightDeck
				isFloatingIsland={false}
				on:a2aToggle={handleA2AToggle}
				on:throttleMode={handleThrottleMode}
				on:emergencyStop={handleEmergencyStop}
				on:executeWorkflow={handleExecuteWorkflow}
				on:focus={() => adjustPanelWidths('orchestration')}
			/>
		{:else if isTablet}
			<!-- Floating Island for Tablet -->
			<OrchestrationForesightDeck
				isFloatingIsland={true}
				isMinimized={isOrchestrationMinimized}
				on:a2aToggle={handleA2AToggle}
				on:throttleMode={handleThrottleMode}
				on:emergencyStop={handleEmergencyStop}
				on:executeWorkflow={handleExecuteWorkflow}
			/>
		{/if}
	</div>

	<!-- Mobile Layout -->
{:else}
	<div
		class="synapse-hub-layout mobile-layout"
		role="application"
		aria-label="Synapse Hub Mobile Interface"
	>
		<!-- Mobile Header with Sophisticated Branding -->
		<header class="mobile-header glass-morphism">
			<div class="header-content">
				<div class="brand-section">
					<div class="synapse-logo">
						<div class="logo-core"></div>
						<div class="logo-rings">
							<div class="ring ring-1"></div>
							<div class="ring ring-2"></div>
						</div>
					</div>
					<h1 class="brand-title">Synapse Hub</h1>
				</div>

				<div class="header-controls">
					<!-- Agent Status Indicators -->
					<div class="mobile-agent-indicators">
						<div class="agent-indicator cursor-indicator" title="Cursor AI"></div>
						<div class="agent-indicator gemini-indicator" title="Gemini AI"></div>
					</div>

					<!-- System Status -->
					<button class="system-status-btn" title="System Status" aria-label="View system status">
						<div class="status-icon">⚡</div>
					</button>

					<!-- Menu Toggle -->
					<button class="menu-toggle-btn" title="Menu" aria-label="Open main menu">
						<div class="hamburger">
							<span></span>
							<span></span>
							<span></span>
						</div>
					</button>
				</div>
			</div>
		</header>

		<!-- Mobile Main Content - Co-Creation Canvas -->
		<main class="mobile-main-content">
			<CoCreationCanvas
				on:messageAction={handleMessageAction}
				on:createFocusZone={handleCreateFocusZone}
				on:startThread={handleStartThread}
			/>
		</main>

		<!-- Mobile Footer - Oracle Bar Integration -->
		<footer class="mobile-footer glass-morphism">
			<div class="footer-content">
				<div class="oracle-section-mobile">
					<div class="oracle-input-wrapper">
						<textarea class="mobile-oracle-input" placeholder="Ask anything..." rows="1"></textarea>
						<button class="oracle-send-btn floating-action" aria-label="Send message"> ↗ </button>
					</div>

					<!-- Quick Action Pills -->
					<div class="quick-actions-mobile">
						<button class="action-pill cursor-pill">
							<span class="pill-icon">⚡</span>
							<span class="pill-label">Cursor</span>
						</button>
						<button class="action-pill gemini-pill">
							<span class="pill-icon">✦</span>
							<span class="pill-label">Gemini</span>
						</button>
						<button class="action-pill debug-pill">
							<span class="pill-icon">🔧</span>
							<span class="pill-label">Debug</span>
						</button>
						<button class="action-pill optimize-pill">
							<span class="pill-icon">🚀</span>
							<span class="pill-label">Optimize</span>
						</button>
					</div>
				</div>
			</div>
		</footer>
	</div>
{/if}

<style>
	.synapse-hub-layout {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		position: relative;
	}

	/* Desktop and Tablet Layout - Enhanced Visual Design */
	.desktop-tablet-layout {
		display: grid;
		grid-template-columns: 1fr 2fr 1fr;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		background: var(--color-background-primary);
		height: 100vh;
		overflow: hidden;
		position: relative;
	}

	/* Add glass morphism background to the entire layout */
	.desktop-tablet-layout::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background:
			radial-gradient(circle at 15% 25%, rgba(34, 197, 94, 0.03) 0%, transparent 40%),
			radial-gradient(circle at 85% 75%, rgba(20, 184, 166, 0.02) 0%, transparent 40%),
			radial-gradient(circle at 50% 50%, rgba(6, 214, 160, 0.01) 0%, transparent 50%);
		pointer-events: none;
		z-index: 0;
	}

	.desktop-tablet-layout.focus-mode {
		background: var(--color-background-secondary);
	}

	.desktop-tablet-layout.focus-mode::before {
		opacity: 0.7;
	}

	.desktop-tablet-layout.a2a-active::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background:
			radial-gradient(circle at 30% 70%, rgba(34, 197, 94, 0.04) 0%, transparent 50%),
			radial-gradient(circle at 70% 30%, rgba(20, 184, 166, 0.03) 0%, transparent 50%);
		pointer-events: none;
		z-index: 0;
		animation: subtle-glow 4s ease-in-out infinite alternate;
	}

	.desktop-tablet-layout.workflow-active::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.02) 0%, transparent 60%);
		pointer-events: none;
		z-index: 0;
		animation: workflow-pulse 3s ease-in-out infinite;
	}

	/* Enhanced panel transitions with modern easing */
	.desktop-tablet-layout > :global(*) {
		transition: all var(--transition-smooth);
		z-index: 1;
		position: relative;
	}

	/* Add subtle animations for visual interest */
	@keyframes subtle-glow {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0.6;
		}
	}

	@keyframes workflow-pulse {
		0%,
		100% {
			opacity: 0.8;
		}
		50% {
			opacity: 1.2;
		}
	}

	/* Mobile Layout */
	.mobile-layout {
		display: flex;
		flex-direction: column;
		background: var(--color-background-primary);
	}

	/* Mobile Header */
	.mobile-header {
		flex-shrink: 0;
		z-index: 10;
		border-bottom: 1px solid var(--color-border-primary);
		backdrop-filter: var(--backdrop-blur-moderate);
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md);
	}

	.brand-section {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.synapse-logo {
		position: relative;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.logo-core {
		width: 12px;
		height: 12px;
		background: var(--color-interactive-primary);
		border-radius: 50%;
		z-index: 3;
	}

	.logo-rings {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.ring {
		position: absolute;
		border: 1px solid var(--color-interactive-primary);
		border-radius: 50%;
		opacity: 0.3;
		animation: logo-pulse 3s ease-in-out infinite;
	}

	.ring-1 {
		width: 20px;
		height: 20px;
		top: -10px;
		left: -10px;
		animation-delay: 0s;
	}

	.ring-2 {
		width: 28px;
		height: 28px;
		top: -14px;
		left: -14px;
		animation-delay: 1.5s;
	}

	@keyframes logo-pulse {
		0%,
		100% {
			opacity: 0.3;
			transform: scale(1);
		}
		50% {
			opacity: 0.6;
			transform: scale(1.1);
		}
	}

	.brand-title {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0;
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.mobile-agent-indicators {
		display: flex;
		gap: var(--spacing-xs);
	}

	.agent-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		transition: all var(--transition-smooth);
	}

	.cursor-indicator {
		background: var(--color-agent-cursor);
		animation: subtle-pulse 2s ease-in-out infinite;
	}

	.gemini-indicator {
		background: var(--color-agent-gemini);
		opacity: 0.5;
	}

	.system-status-btn {
		padding: var(--spacing-xs);
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-sm);
		transition: all var(--transition-smooth);
	}

	.system-status-btn:hover {
		background: var(--color-surface-hover);
		transform: translateY(-1px);
	}

	.status-icon {
		font-size: var(--font-size-sm);
		color: var(--color-interactive-primary);
	}

	.menu-toggle-btn {
		padding: var(--spacing-xs);
		background: transparent;
		transition: all var(--transition-smooth);
	}

	.hamburger {
		display: flex;
		flex-direction: column;
		gap: 3px;
		width: 18px;
	}

	.hamburger span {
		width: 100%;
		height: 2px;
		background: var(--color-text-secondary);
		border-radius: 1px;
		transition: all var(--transition-smooth);
	}

	.menu-toggle-btn:hover .hamburger span {
		background: var(--color-text-primary);
	}

	/* Mobile Main Content */
	.mobile-main-content {
		flex: 1;
		overflow: hidden;
	}

	/* Mobile Footer */
	.mobile-footer {
		flex-shrink: 0;
		z-index: 10;
		border-top: 1px solid var(--color-border-primary);
		backdrop-filter: var(--backdrop-blur-moderate);
	}

	.footer-content {
		padding: var(--spacing-md);
	}

	.oracle-section-mobile {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.oracle-input-wrapper {
		display: flex;
		align-items: end;
		gap: var(--spacing-sm);
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.mobile-oracle-input {
		flex: 1;
		padding: var(--spacing-md);
		background: transparent;
		border: none;
		color: var(--color-text-primary);
		font-size: var(--font-size-base);
		line-height: var(--line-height-normal);
		resize: none;
		outline: none;
		min-height: 44px;
		max-height: 120px;
	}

	.mobile-oracle-input::placeholder {
		color: var(--color-text-quaternary);
	}

	.oracle-send-btn {
		background: var(--color-interactive-primary);
		color: var(--color-text-inverse);
		border-radius: 50%;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--font-size-lg);
		margin: var(--spacing-xs);
		transition: all var(--transition-smooth);
	}

	.oracle-send-btn:hover {
		background: var(--color-interactive-primary-hover);
		transform: translateY(-2px) scale(1.05);
	}

	/* Quick Action Pills */
	.quick-actions-mobile {
		display: flex;
		gap: var(--spacing-xs);
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.quick-actions-mobile::-webkit-scrollbar {
		display: none;
	}

	.action-pill {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-xl);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		white-space: nowrap;
		transition: all var(--transition-smooth);
	}

	.action-pill:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
		transform: translateY(-1px);
	}

	.cursor-pill:hover {
		border-color: var(--color-agent-cursor);
		color: var(--color-agent-cursor);
	}

	.gemini-pill:hover {
		border-color: var(--color-agent-gemini);
		color: var(--color-agent-gemini);
	}

	.debug-pill:hover {
		border-color: var(--color-warning);
		color: var(--color-warning);
	}

	.optimize-pill:hover {
		border-color: var(--color-success);
		color: var(--color-success);
	}

	.pill-icon {
		font-size: var(--font-size-sm);
	}

	.pill-label {
		font-size: var(--font-size-xs);
	}

	/* Container queries preparation for stateful adaptation */
	@container (min-width: 1200px) {
		.synapse-hub-layout {
			/* Future: Stateful container queries for focus mode, A2A active, etc. */
		}
	}

	/* Reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		.desktop-tablet-layout > :global(*),
		.oracle-send-btn,
		.action-pill,
		.system-status-btn {
			transition: none;
		}

		.ring,
		.cursor-indicator {
			animation: none;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.desktop-tablet-layout,
		.mobile-layout {
			background-color: var(--color-background-primary);
			border: 2px solid var(--color-border-primary);
		}

		.mobile-footer {
			border-color: var(--color-border-primary);
		}

		.agent-indicator {
			border: 1px solid var(--color-border-primary);
		}
	}
</style>

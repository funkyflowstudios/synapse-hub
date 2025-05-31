<script lang="ts">
	// Svelte Component Template for Synapse-Hub
	//
	// 🤖 AI IMPLEMENTATION BREADCRUMBS:
	// Phase 2: Frontend component template with comprehensive UI patterns (Current)
	// Future: WebSocket integration for real-time updates
	// Future: Advanced state management with Svelte stores
	// Future: AI-driven component customization
	//
	// TEMPLATE USAGE:
	// 1. Copy this file and rename to match your component (e.g., TaskCard.svelte)
	// 2. Replace all PLACEHOLDER comments with actual values
	// 3. Customize styling and behavior as needed

	import { createEventDispatcher, onMount } from 'svelte';
	import { slide, fade } from 'svelte/transition';
	
	// PLACEHOLDER: Import your types and stores
	// import type { Task } from '$lib/types/task';
	// import { taskStore } from '$lib/stores/taskStore';

	const dispatch = createEventDispatcher();

	// PLACEHOLDER: Define your props with proper types
	// Example: export let task: Task;
	export let title: string = 'Component Title';
	export let description: string = '';
	export let disabled: boolean = false;
	export let loading: boolean = false;
	export let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	
	// PLACEHOLDER: Add your custom props here
	// export let customProp: string = '';

	// Internal state
	let isExpanded = false;
	let isHovered = false;
	let componentRef: HTMLElement;

	// PLACEHOLDER: Add your reactive statements
	// $: computedValue = someCalculation(prop1, prop2);

	// Component lifecycle
	onMount(() => {
		// PLACEHOLDER: Add initialization logic
		console.log('Component mounted:', title);
		
		// PLACEHOLDER: Add event listeners if needed
		// window.addEventListener('resize', handleResize);
		
		return () => {
			// PLACEHOLDER: Cleanup logic
			// window.removeEventListener('resize', handleResize);
		};
	});

	// Event handlers
	function handleClick() {
		if (disabled || loading) return;
		
		// PLACEHOLDER: Add your click logic
		dispatch('click', { 
			title,
			timestamp: new Date().toISOString()
		});
	}

	function handleExpand() {
		isExpanded = !isExpanded;
		dispatch('expand', { expanded: isExpanded });
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				handleClick();
				break;
			case 'Escape':
				if (isExpanded) {
					isExpanded = false;
					dispatch('collapse');
				}
				break;
		}
	}

	// PLACEHOLDER: Add your custom functions
	// function customFunction() {
	//     // Custom logic here
	// }

	// Utility functions
	function getVariantColor(variant: string) {
		switch (variant) {
			case 'primary':
				return 'var(--color-interactive-primary)';
			case 'secondary':
				return 'var(--color-interactive-secondary)';
			case 'success':
				return 'var(--color-success)';
			case 'warning':
				return 'var(--color-warning)';
			case 'error':
				return 'var(--color-error)';
			default:
				return 'var(--color-interactive-primary)';
		}
	}
</script>

<!-- 
PLACEHOLDER: Main component structure
Replace this example with your actual component layout
-->
<div
	class="component-container glass-panel-primary"
	class:disabled
	class:loading
	class:expanded={isExpanded}
	class:size-sm={size === 'sm'}
	class:size-md={size === 'md'}
	class:size-lg={size === 'lg'}
	bind:this={componentRef}
	role="button"
	tabindex={disabled ? -1 : 0}
	on:click={handleClick}
	on:keydown={handleKeydown}
	on:mouseenter={() => (isHovered = true)}
	on:mouseleave={() => (isHovered = false)}
	aria-label={title}
	aria-expanded={isExpanded}
	aria-disabled={disabled}
>
	<!-- Header Section -->
	<header class="component-header">
		<div class="header-content">
			<h3 class="component-title">{title}</h3>
			{#if description}
				<p class="component-description">{description}</p>
			{/if}
		</div>
		
		<!-- PLACEHOLDER: Add header actions -->
		<div class="header-actions">
			<button
				class="expand-btn button-3d"
				class:expanded={isExpanded}
				on:click|stopPropagation={handleExpand}
				title={isExpanded ? 'Collapse' : 'Expand'}
				aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
			>
				{isExpanded ? '−' : '+'}
			</button>
		</div>
	</header>

	<!-- Main Content -->
	<main class="component-content">
		<!-- PLACEHOLDER: Add your main content here -->
		<div class="content-section">
			<slot name="main">
				<!-- Default content if no slot provided -->
				<p class="placeholder-text">
					Add your main content here by replacing this placeholder or using the 'main' slot.
				</p>
			</slot>
		</div>

		<!-- Loading State -->
		{#if loading}
			<div class="loading-overlay" transition:fade={{ duration: 200 }}>
				<div class="loading-spinner" aria-label="Loading">
					<div class="spinner-circle"></div>
				</div>
				<p class="loading-text">Loading...</p>
			</div>
		{/if}
	</main>

	<!-- Expandable Section -->
	{#if isExpanded}
		<section class="expanded-content" transition:slide={{ duration: 300 }}>
			<slot name="expanded">
				<!-- PLACEHOLDER: Expanded content -->
				<div class="expanded-details">
					<h4 class="expanded-title">Additional Details</h4>
					<p class="expanded-text">
						This is the expanded section. Replace with your actual expanded content.
					</p>
					
					<!-- PLACEHOLDER: Add expanded content elements -->
					<div class="expanded-actions">
						<button class="action-btn button-3d" on:click={() => dispatch('action1')}>
							Action 1
						</button>
						<button class="action-btn button-3d" on:click={() => dispatch('action2')}>
							Action 2
						</button>
					</div>
				</div>
			</slot>
		</section>
	{/if}

	<!-- Footer -->
	<footer class="component-footer">
		<slot name="footer">
			<!-- PLACEHOLDER: Footer content -->
			<div class="footer-info">
				<span class="footer-text">Component Footer</span>
			</div>
		</slot>
	</footer>
</div>

<style>
	/* Main Container - Glass Morphism Design */
	.component-container {
		background: var(--glass-primary-bg);
		backdrop-filter: blur(20px) saturate(140%) brightness(110%);
		border: 1px solid var(--glass-border-primary);
		border-radius: var(--radius-xl);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: var(--glass-shadow-outer);
		position: relative;
		transition: all var(--transition-smooth);
		cursor: pointer;
	}

	/* Glass morphism effects */
	.component-container::before {
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

	.component-container::after {
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

	/* Hover effects */
	.component-container:hover:not(.disabled) {
		background: var(--glass-elevated-bg);
		transform: translateY(-2px);
		box-shadow: var(--glass-shadow-elevated);
		border-color: var(--glass-border-highlight);
	}

	/* Focus styles for accessibility */
	.component-container:focus-visible {
		outline: 2px solid var(--color-border-focus);
		outline-offset: 2px;
		box-shadow: 
			var(--glass-shadow-outer),
			0 0 0 4px rgba(var(--color-focus-ring-rgb), 0.3);
	}

	/* State variations */
	.component-container.disabled {
		background: var(--glass-disabled-bg);
		color: var(--color-text-quaternary);
		cursor: not-allowed;
		transform: none !important;
		box-shadow: var(--shadow-elevation-low);
	}

	.component-container.loading {
		cursor: wait;
	}

	.component-container.expanded {
		background: var(--glass-elevated-bg);
		border-color: var(--color-interactive-primary);
		box-shadow: 
			var(--glass-shadow-elevated),
			0 0 16px rgba(var(--color-interactive-primary-rgb), 0.2);
	}

	/* Size variations */
	.size-sm {
		padding: var(--spacing-sm);
		border-radius: var(--radius-md);
	}

	.size-md {
		padding: var(--spacing-md);
		border-radius: var(--radius-lg);
	}

	.size-lg {
		padding: var(--spacing-lg);
		border-radius: var(--radius-xl);
	}

	/* Header Section */
	.component-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-md);
		position: relative;
		z-index: 3;
		margin-bottom: var(--spacing-md);
	}

	.header-content {
		flex: 1;
		min-width: 0; /* Prevent flex overflow */
	}

	.component-title {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0 0 var(--spacing-xs) 0;
		line-height: var(--line-height-tight);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.component-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin: 0;
		line-height: var(--line-height-relaxed);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-shrink: 0;
	}

	/* Expand Button - Unified Button System */
	.expand-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--glass-secondary-bg);
		backdrop-filter: blur(8px);
		border: 1px solid var(--glass-border-primary);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-smooth);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: var(--font-size-sm);
		box-shadow: var(--shadow-elevation-low);
		position: relative;
		overflow: hidden;
	}

	.expand-btn::before {
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

	.expand-btn:hover {
		background: var(--glass-elevated-bg);
		color: var(--color-text-primary);
		transform: scale(1.1);
		box-shadow: var(--shadow-elevation-medium);
	}

	.expand-btn:hover::before {
		opacity: 1;
	}

	.expand-btn.expanded {
		background: var(--color-interactive-primary);
		color: var(--color-text-inverse);
		border-color: var(--color-interactive-primary);
		box-shadow: 0 0 12px rgba(var(--color-interactive-primary-rgb), 0.4);
	}

	/* Main Content */
	.component-content {
		flex: 1;
		position: relative;
		z-index: 3;
		margin-bottom: var(--spacing-md);
	}

	.content-section {
		position: relative;
	}

	.placeholder-text {
		color: var(--color-text-tertiary);
		font-style: italic;
		font-size: var(--font-size-sm);
		text-align: center;
		padding: var(--spacing-lg);
		margin: 0;
	}

	/* Loading State */
	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(var(--color-background-primary-rgb), 0.8);
		backdrop-filter: blur(4px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		z-index: 10;
		border-radius: inherit;
	}

	.loading-spinner {
		position: relative;
		width: 32px;
		height: 32px;
	}

	.spinner-circle {
		width: 100%;
		height: 100%;
		border: 3px solid var(--color-border-secondary);
		border-top: 3px solid var(--color-interactive-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		font-weight: var(--font-weight-medium);
		margin: 0;
	}

	/* Expanded Content */
	.expanded-content {
		background: var(--glass-elevated-bg);
		backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border-secondary);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
		margin-top: var(--spacing-sm);
		position: relative;
		z-index: 3;
		box-shadow: var(--shadow-elevation-medium);
	}

	.expanded-content::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
		pointer-events: none;
		border-radius: inherit;
	}

	.expanded-details {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.expanded-title {
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0;
	}

	.expanded-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin: 0;
		line-height: var(--line-height-relaxed);
	}

	.expanded-actions {
		display: flex;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	/* Action Buttons - Unified Button System */
	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--glass-secondary-bg);
		backdrop-filter: blur(12px);
		border: 1px solid var(--glass-border-primary);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-smooth);
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-elevation-low);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		min-height: 36px;
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
		box-shadow: var(--shadow-elevation-medium);
		border-color: var(--glass-border-highlight);
	}

	.action-btn:hover::before {
		opacity: 1;
	}

	.action-btn:active {
		transform: translateY(0);
		box-shadow: var(--shadow-elevation-low);
	}

	/* Footer */
	.component-footer {
		border-top: 1px solid var(--glass-border-secondary);
		padding-top: var(--spacing-sm);
		position: relative;
		z-index: 3;
	}

	.footer-info {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.footer-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-quaternary);
		font-weight: var(--font-weight-medium);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.component-header {
			flex-direction: column;
			align-items: stretch;
			gap: var(--spacing-sm);
		}

		.header-actions {
			justify-content: flex-end;
		}

		.expanded-actions {
			flex-direction: column;
		}

		.action-btn {
			width: 100%;
		}
	}

	/* Reduced Motion Support */
	@media (prefers-reduced-motion: reduce) {
		.component-container,
		.expand-btn,
		.action-btn {
			transition: none;
		}

		.component-container:hover:not(.disabled) {
			transform: none;
		}

		.expand-btn:hover {
			transform: none;
		}

		.action-btn:hover {
			transform: none;
		}

		.spinner-circle {
			animation: none;
		}
	}

	/* High Contrast Mode Support */
	@media (prefers-contrast: high) {
		.component-container {
			background: var(--color-background-primary);
			border: 2px solid var(--color-border-primary);
			backdrop-filter: none;
		}

		.component-container::before,
		.component-container::after {
			display: none;
		}

		.expand-btn,
		.action-btn {
			background: var(--color-surface-primary);
			border: 2px solid var(--color-border-primary);
			backdrop-filter: none;
		}

		.expanded-content {
			background: var(--color-surface-secondary);
			border: 2px solid var(--color-border-secondary);
			backdrop-filter: none;
		}
	}
</style>

<!-- 
TEMPLATE IMPLEMENTATION GUIDE:

IMPLEMENTATION STEPS:

1. SETUP:
   - Copy this template to your component file (e.g., TaskCard.svelte)
   - Replace all PLACEHOLDER comments with actual values

2. CUSTOMIZE PROPS:
   - Replace example props with your component's props
   - Add proper TypeScript types for all props
   - Import necessary types from your type definitions

3. IMPLEMENT COMPONENT LOGIC:
   - Replace placeholder functions with actual logic
   - Add your reactive statements and computed values
   - Implement proper event handling

4. UPDATE TEMPLATE STRUCTURE:
   - Replace placeholder content with your actual component structure
   - Customize slots to match your component's needs
   - Add any additional sections or content areas

5. STYLE CUSTOMIZATION:
   - Modify styles to match your component's specific needs
   - Add any component-specific styling
   - Ensure accessibility compliance is maintained

6. ADD COMPONENT-SPECIFIC FEATURES:
   - Implement any specialized functionality
   - Add additional event handlers as needed
   - Integrate with stores or external APIs

EXAMPLE FOR TASK CARD COMPONENT:
- Replace 'component' with 'task-card' in class names
- Add Task type import and use as prop
- Implement task-specific actions (edit, delete, complete)
- Add task status indicators and priority levels
- Customize expanded content for task details

FEATURES INCLUDED:
- Glass morphism design with project styling
- Unified button system compliance
- Full accessibility support (WCAG 2.2+ AAA)
- Responsive design patterns
- Loading states and error handling
- Expandable content sections
- Keyboard navigation support
- Reduced motion and high contrast support
- Slot-based content injection
- Event dispatch system

ACCESSIBILITY FEATURES:
- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader support
- High contrast mode support
- Reduced motion support
- Semantic HTML structure
--> 
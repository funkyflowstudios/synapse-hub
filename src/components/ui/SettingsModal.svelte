<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import PaletteSelector from './PaletteSelector.svelte';

	export let isOpen = false;

	const dispatch = createEventDispatcher();

	function closeModal() {
		isOpen = false;
		dispatch('close');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Modal Backdrop -->
	<div
		class="modal-backdrop"
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="settings-title"
		tabindex="-1"
	>
		<!-- Modal Content -->
		<div class="modal-content">
			<!-- Header -->
			<header class="modal-header">
				<h2 id="settings-title" class="modal-title">Settings</h2>
				<button class="modal-close" on:click={closeModal} aria-label="Close settings">
					<svg
						class="modal-close-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</header>

			<!-- Content -->
			<div class="modal-body">
				<!-- Appearance Section -->
				<section class="settings-section">
					<h3 class="section-title">
						<svg
							class="section-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
							/>
						</svg>
						Appearance
					</h3>

					<div class="setting-group">
						<span class="setting-label">Color Palette</span>
						<p class="setting-description">Customize your interface colors and mood</p>
						<div class="setting-control">
							<PaletteSelector />
						</div>
					</div>
				</section>

				<!-- Accessibility Section -->
				<section class="settings-section">
					<h3 class="section-title">
						<svg
							class="section-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="3" />
							<path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
						</svg>
						Accessibility
					</h3>

					<div class="setting-group">
						<span class="setting-label">Motion</span>
						<p class="setting-description">Reduce animations and transitions</p>
						<div class="setting-control">
							<button class="toggle-button" aria-pressed="false" aria-label="Toggle reduced motion">
								<span class="toggle-slider"></span>
							</button>
						</div>
					</div>

					<div class="setting-group">
						<span class="setting-label">High Contrast</span>
						<p class="setting-description">Increase contrast for better visibility</p>
						<div class="setting-control">
							<button
								class="toggle-button"
								aria-pressed="false"
								aria-label="Toggle high contrast mode"
							>
								<span class="toggle-slider"></span>
							</button>
						</div>
					</div>
				</section>

				<!-- Performance Section -->
				<section class="settings-section">
					<h3 class="section-title">
						<svg
							class="section-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
						</svg>
						Performance
					</h3>

					<div class="setting-group">
						<span class="setting-label">GPU Acceleration</span>
						<p class="setting-description">Use hardware acceleration for smoother animations</p>
						<div class="setting-control">
							<button
								class="toggle-button"
								aria-pressed="true"
								aria-label="Toggle GPU acceleration"
							>
								<span class="toggle-slider active"></span>
							</button>
						</div>
					</div>

					<div class="setting-group">
						<span class="setting-label">Background Processing</span>
						<p class="setting-description">Enable Web Workers for better performance</p>
						<div class="setting-control">
							<button
								class="toggle-button"
								aria-pressed="true"
								aria-label="Toggle background processing"
							>
								<span class="toggle-slider active"></span>
							</button>
						</div>
					</div>
				</section>
			</div>

			<!-- Footer -->
			<footer class="modal-footer">
				<div class="footer-info">
					<p class="version-info">Synapse Hub v2.0 • Phase 2 Complete</p>
					<p class="settings-note">
						Theme changes apply immediately • Save Changes applies to accessibility & performance
						settings
					</p>
				</div>
				<div class="footer-actions">
					<button class="secondary-button" on:click={closeModal}> Cancel </button>
					<button class="primary-button" on:click={closeModal}> Done </button>
				</div>
			</footer>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--color-background-overlay);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: var(--spacing-lg);
	}

	.modal-content {
		background: var(--color-surface-primary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-elevation-highest);
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--color-border-secondary);
		background: var(--color-surface-secondary);
	}

	.modal-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0;
	}

	.modal-close {
		padding: var(--spacing-sm);
		background: transparent;
		border: 1px solid var(--color-border-secondary);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-smooth);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
		border-color: var(--color-border-primary);
	}

	.modal-close:focus-visible {
		outline: 2px solid var(--color-border-focus);
		outline-offset: 2px;
	}

	.modal-close-icon {
		width: 18px;
		height: 18px;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
		scroll-behavior: smooth;
	}

	.settings-section {
		margin-bottom: var(--spacing-xl);
	}

	.settings-section:last-child {
		margin-bottom: 0;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0 0 var(--spacing-lg) 0;
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border-muted);
	}

	.section-icon {
		width: 20px;
		height: 20px;
		color: var(--color-interactive-primary);
	}

	.setting-group {
		margin-bottom: var(--spacing-lg);
		padding: var(--spacing-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-muted);
	}

	.setting-group:last-child {
		margin-bottom: 0;
	}

	.setting-label {
		display: block;
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-xs);
	}

	.setting-description {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin: 0 0 var(--spacing-md) 0;
		line-height: var(--line-height-relaxed);
	}

	.setting-control {
		display: flex;
		align-items: center;
	}

	.toggle-button {
		position: relative;
		width: 44px;
		height: 24px;
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border-secondary);
		border-radius: 12px;
		cursor: pointer;
		transition: all var(--transition-smooth);
	}

	.toggle-button:hover {
		background: var(--color-surface-hover);
	}

	.toggle-button:focus-visible {
		outline: 2px solid var(--color-border-focus);
		outline-offset: 2px;
	}

	.toggle-button[aria-pressed='true'] {
		background: var(--color-interactive-primary);
		border-color: var(--color-interactive-primary);
	}

	.toggle-slider {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: var(--color-text-inverse);
		border-radius: 50%;
		transition: transform var(--transition-smooth);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.toggle-slider.active {
		transform: translateX(20px);
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-lg);
		border-top: 1px solid var(--color-border-secondary);
		background: var(--color-surface-secondary);
	}

	.footer-info {
		flex: 1;
	}

	.version-info {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin: 0;
	}

	.settings-note {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		margin: var(--spacing-xs) 0 0 0;
		opacity: 0.8;
	}

	.footer-actions {
		display: flex;
		gap: var(--spacing-sm);
	}

	.secondary-button,
	.primary-button {
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: all var(--transition-smooth);
		font-size: var(--font-size-sm);
	}

	.secondary-button {
		background: var(--color-surface-primary);
		border: 1px solid var(--color-border-secondary);
		color: var(--color-text-secondary);
	}

	.secondary-button:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
	}

	.primary-button {
		background: var(--color-interactive-primary);
		border: 1px solid var(--color-interactive-primary);
		color: var(--color-text-inverse);
	}

	.primary-button:hover {
		background: var(--color-interactive-primary-hover);
	}

	.secondary-button:focus-visible,
	.primary-button:focus-visible {
		outline: 2px solid var(--color-border-focus);
		outline-offset: 2px;
	}

	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.modal-backdrop {
			padding: var(--spacing-md);
		}

		.modal-content {
			max-height: 90vh;
		}

		.modal-header,
		.modal-body,
		.modal-footer {
			padding: var(--spacing-md);
		}

		.footer-actions {
			flex-direction: column;
			width: 100%;
		}

		.secondary-button,
		.primary-button {
			width: 100%;
			justify-content: center;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.modal-backdrop,
		.modal-close,
		.toggle-button,
		.toggle-slider,
		.secondary-button,
		.primary-button {
			transition: none;
		}
	}

	/* High contrast support */
	@media (prefers-contrast: high) {
		.modal-content {
			border: 2px solid var(--color-border-primary);
		}

		.modal-header,
		.modal-footer {
			border-color: var(--color-border-primary);
		}

		.setting-group {
			border: 2px solid var(--color-border-secondary);
		}
	}
</style>

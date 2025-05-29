<script lang="ts">
	// Placeholder for future ContextualOrchestrationPanel functionality
	let { class: className = '', isFloating = false, isMinimized = false } = $props();

	// Placeholder for future floating island functionality
	function toggleMinimized() {
		isMinimized = !isMinimized;
	}

	function dock() {
		isFloating = false;
	}

	function float() {
		isFloating = true;
	}
</script>

<aside 
	class="contextual-orchestration-panel {className}" 
	class:floating={isFloating}
	class:minimized={isMinimized}
	role="complementary" 
	aria-label="Contextual Orchestration Panel"
>
	<header class="panel-header">
		<h2>Context & Orchestration</h2>
		<div class="panel-controls">
			{#if isFloating}
				<button type="button" on:click={dock} aria-label="Dock panel">
					<span aria-hidden="true">📌</span>
				</button>
			{:else}
				<button type="button" on:click={float} aria-label="Float panel">
					<span aria-hidden="true">🏝️</span>
				</button>
			{/if}
			<button type="button" on:click={toggleMinimized} aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}>
				<span aria-hidden="true">{isMinimized ? '↗️' : '↙️'}</span>
			</button>
		</div>
	</header>
	
	{#if !isMinimized}
		<main class="panel-content">
			<!-- Context Section -->
			<section class="context-section">
				<h3>Active Context</h3>
				<div class="context-items">
					<div class="context-item">
						<div class="context-header">
							<span class="context-type">Project</span>
							<span class="context-status active">Active</span>
						</div>
						<div class="context-content">
							<p>Synapse Hub UI Development</p>
						</div>
					</div>
					
					<div class="context-item">
						<div class="context-header">
							<span class="context-type">Files</span>
							<span class="context-badge">3</span>
						</div>
						<div class="context-content">
							<ul class="file-list">
								<li>layout components</li>
								<li>progress tracking</li>
								<li>design specs</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			<!-- Orchestration Section -->
			<section class="orchestration-section">
				<h3>Task Orchestration</h3>
				<div class="task-flow">
					<div class="task-item current">
						<div class="task-indicator"></div>
						<div class="task-content">
							<p class="task-title">Layout Implementation</p>
							<p class="task-status">In Progress</p>
						</div>
					</div>
					
					<div class="task-item pending">
						<div class="task-indicator"></div>
						<div class="task-content">
							<p class="task-title">Responsive Testing</p>
							<p class="task-status">Pending</p>
						</div>
					</div>
					
					<div class="task-item pending">
						<div class="task-indicator"></div>
						<div class="task-content">
							<p class="task-title">Component Testing</p>
							<p class="task-status">Pending</p>
						</div>
					</div>
				</div>
			</section>

			<!-- Quick Tools Section -->
			<section class="tools-section">
				<h3>Quick Tools</h3>
				<nav aria-label="Quick tools">
					<div class="tool-grid">
						<button type="button" class="tool-button">
							<span class="tool-icon" aria-hidden="true">📊</span>
							<span class="tool-label">Analytics</span>
						</button>
						<button type="button" class="tool-button">
							<span class="tool-icon" aria-hidden="true">🔧</span>
							<span class="tool-label">Settings</span>
						</button>
						<button type="button" class="tool-button">
							<span class="tool-icon" aria-hidden="true">📝</span>
							<span class="tool-label">Notes</span>
						</button>
						<button type="button" class="tool-button">
							<span class="tool-icon" aria-hidden="true">🔍</span>
							<span class="tool-label">Search</span>
						</button>
					</div>
				</nav>
			</section>
		</main>
	{/if}
</aside>

<style>
	.contextual-orchestration-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--panel-bg, #f8f9fa);
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.contextual-orchestration-panel.floating {
		position: fixed;
		top: 2rem;
		right: 2rem;
		width: 20rem;
		max-height: calc(100vh - 4rem);
		border-radius: 0.75rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		border: 1px solid var(--panel-border, #e9ecef);
	}

	.contextual-orchestration-panel.minimized {
		height: auto;
	}

	.contextual-orchestration-panel.floating.minimized {
		width: auto;
		height: auto;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid var(--panel-border, #e9ecef);
		background: var(--panel-header-bg, #ffffff);
	}

	.contextual-orchestration-panel.floating .panel-header {
		border-radius: 0.75rem 0.75rem 0 0;
	}

	.panel-header h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #212529);
	}

	.panel-controls {
		display: flex;
		gap: 0.25rem;
	}

	.panel-controls button {
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid var(--button-border, #dee2e6);
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.75rem;
		transition: all 0.15s ease;
	}

	.panel-controls button:hover {
		background: var(--button-hover-bg, #f8f9fa);
	}

	.panel-controls button:focus {
		outline: 2px solid var(--focus-color, #0066cc);
		outline-offset: 2px;
	}

	.panel-content {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.context-section h3,
	.orchestration-section h3,
	.tools-section h3 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary, #6c757d);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.context-items {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.context-item {
		padding: 0.75rem;
		background: var(--context-item-bg, #ffffff);
		border: 1px solid var(--context-item-border, #e9ecef);
		border-radius: 0.375rem;
	}

	.context-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.context-type {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary, #6c757d);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.context-status {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-weight: 500;
	}

	.context-status.active {
		background: #d4edda;
		color: #155724;
	}

	.context-badge {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		background: var(--badge-bg, #6c757d);
		color: white;
		border-radius: 0.25rem;
		font-weight: 500;
	}

	.context-content p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-primary, #212529);
	}

	.file-list {
		list-style: none;
		margin: 0;
		padding: 0;
		font-size: 0.875rem;
	}

	.file-list li {
		padding: 0.125rem 0;
		color: var(--text-primary, #212529);
	}

	.task-flow {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.task-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: 0.375rem;
		transition: all 0.15s ease;
	}

	.task-item.current {
		background: var(--task-current-bg, #e3f2fd);
	}

	.task-item.pending {
		opacity: 0.7;
	}

	.task-indicator {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.task-item.current .task-indicator {
		background: var(--primary-color, #007bff);
	}

	.task-item.pending .task-indicator {
		background: var(--text-secondary, #6c757d);
	}

	.task-content {
		flex: 1;
	}

	.task-title {
		margin: 0 0 0.125rem 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary, #212529);
	}

	.task-status {
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-secondary, #6c757d);
	}

	.tool-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.tool-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 0.5rem;
		background: var(--tool-button-bg, #ffffff);
		border: 1px solid var(--tool-button-border, #dee2e6);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tool-button:hover {
		background: var(--tool-button-hover-bg, #f8f9fa);
		border-color: var(--tool-button-hover-border, #adb5bd);
	}

	.tool-button:focus {
		outline: 2px solid var(--focus-color, #0066cc);
		outline-offset: 2px;
	}

	.tool-icon {
		font-size: 1rem;
	}

	.tool-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-primary, #212529);
	}

	/* Accessibility: Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.contextual-orchestration-panel,
		.panel-controls button,
		.task-item,
		.tool-button {
			transition: none;
		}
	}
</style> 
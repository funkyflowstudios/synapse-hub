<script lang="ts">
	// Input & Control Nexus - Left panel with clean, progressive disclosure interface
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	// UI State - collapsible sections and tabs
	let activeTab: 'code' | 'tools' | 'resources' | 'projects' = 'code';
	let expandedSections = {
		codeGeneration: true,
		codeQuality: false,
		api: false,
		knowledge: false,
		projectContext: true,
		codeMetrics: false,
		learningResources: true,
		documentation: false
	};

	// Quick actions - most essential ones shown by default
	let quickActions = [
		{ id: 'function', label: 'Function', category: 'generate' },
		{ id: 'test', label: 'Test', category: 'generate' },
		{ id: 'validate', label: 'Validate', category: 'quality' },
		{ id: 'format', label: 'Format', category: 'quality' }
	];

	// Extended actions available when sections are expanded
	let extendedActions = {
		generate: [
			{ id: 'class', label: 'Class', description: 'Generate class template' },
			{ id: 'component', label: 'Component', description: 'Generate UI component' },
			{ id: 'interface', label: 'Interface', description: 'Generate TypeScript interface' },
			{ id: 'mock', label: 'Mock Data', description: 'Generate mock data' }
		],
		quality: [
			{ id: 'optimize', label: 'Optimize', description: 'Performance suggestions' },
			{ id: 'security', label: 'Security', description: 'Security check' },
			{ id: 'refactor', label: 'Refactor', description: 'Code refactoring' },
			{ id: 'docs', label: 'Document', description: 'Generate documentation' }
		]
	};

	// Platform API Assistant state
	let selectedPlatforms: Set<'windows' | 'apple' | 'linux' | 'web'> = new Set();
	let apiSearchQuery = '';

	// Knowledge base state
	let showKnowledgeDialog = false;
	let selectedText = '';

	// Project Context & VCS Status (moved from right panel)
	let projectContext = {
		currentFile: {
			name: 'CoCreationCanvas.svelte',
			path: 'src/components/panels/CoCreationCanvas.svelte',
			language: 'Svelte',
			lines: 421
		},
		vcs: {
			branch: 'feature/voice-input',
			status: 'Modified',
			uncommittedChanges: 3,
			lastCommit: '2h ago'
		},
		activeTask: {
			id: 'SYN-142',
			title: 'Implement voice input for AI chat'
		}
	};

	// Code Quality & Test Metrics (summary from right panel)
	let codeMetrics = {
		summary: {
			health: 'good' as 'excellent' | 'good' | 'warning' | 'poor',
			todos: 2,
			testsPassed: 85,
			testsTotal: 90,
			buildStatus: 'passing'
		},
		details: {
			todos: [
				{
					file: 'CoCreationCanvas.svelte',
					line: 45,
					text: 'Add error handling for speech recognition'
				},
				{ file: 'InputControlNexus.svelte', line: 128, text: 'Implement API caching' }
			]
		}
	};

	// Learning Resources (for Resources tab)
	let learningResources = [
		{
			title: 'Svelte Component Patterns',
			url: '#',
			type: 'docs',
			priority: 'high',
			category: 'frameworks'
		},
		{
			title: 'Web Speech API Guide',
			url: '#',
			type: 'tutorial',
			priority: 'high',
			category: 'apis'
		},
		{
			title: 'Accessibility Best Practices',
			url: '#',
			type: 'guide',
			priority: 'medium',
			category: 'accessibility'
		},
		{
			title: 'TypeScript Handbook',
			url: '#',
			type: 'docs',
			priority: 'medium',
			category: 'languages'
		},
		{
			title: 'CSS Grid Layout Guide',
			url: '#',
			type: 'tutorial',
			priority: 'low',
			category: 'styling'
		}
	];

	// Documentation categories (for Resources tab)
	let documentationCategories = [
		{ id: 'frameworks', label: 'Frameworks', count: 12 },
		{ id: 'apis', label: 'APIs', count: 8 },
		{ id: 'languages', label: 'Languages', count: 15 },
		{ id: 'styling', label: 'Styling', count: 6 },
		{ id: 'accessibility', label: 'Accessibility', count: 4 }
	];

	function toggleSection(section: keyof typeof expandedSections) {
		expandedSections[section] = !expandedSections[section];
	}

	function handleQuickAction(actionId: string) {
		dispatch('quickAction', { action: actionId });
	}

	function togglePlatform(platform: 'windows' | 'apple' | 'linux' | 'web') {
		if (selectedPlatforms.has(platform)) {
			selectedPlatforms.delete(platform);
		} else {
			selectedPlatforms.add(platform);
		}
		selectedPlatforms = selectedPlatforms; // Trigger reactivity
	}

	function handleApiSearch() {
		if (apiSearchQuery.trim()) {
			const platforms = Array.from(selectedPlatforms);
			dispatch('apiSearch', { platforms, query: apiSearchQuery.trim() });
			apiSearchQuery = '';
		}
	}

	function handleAddToKnowledge() {
		showKnowledgeDialog = true;
		selectedText = 'Selected code or explanation...';
	}

	function saveToKnowledge(category: string) {
		dispatch('saveToKnowledge', { text: selectedText, category });
		showKnowledgeDialog = false;
		selectedText = '';
	}

	function openFile(filePath: string, line?: number) {
		dispatch('openFile', { path: filePath, line });
	}

	function getHealthColor(health: string) {
		switch (health) {
			case 'excellent':
				return 'var(--color-success)';
			case 'good':
				return 'var(--color-success)';
			case 'warning':
				return 'var(--color-warning)';
			case 'poor':
				return 'var(--color-error)';
			default:
				return 'var(--color-text-secondary)';
		}
	}
</script>

<aside class="input-control-nexus glass-panel-primary" aria-label="Development Tools Panel">
	<!-- Tab Navigation -->
	<nav class="tab-nav">
		<button
			class="tab-btn"
			class:active={activeTab === 'code'}
			on:click={() => (activeTab = 'code')}
		>
			<span class="tab-label">Code</span>
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'tools'}
			on:click={() => (activeTab = 'tools')}
		>
			<span class="tab-label">Tools</span>
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'resources'}
			on:click={() => (activeTab = 'resources')}
		>
			<span class="tab-label">Resources</span>
		</button>
		<button
			class="tab-btn"
			class:active={activeTab === 'projects'}
			on:click={() => (activeTab = 'projects')}
		>
			<span class="tab-label">Projects</span>
		</button>
	</nav>

	<!-- Tab Content -->
	<div class="tab-content">
		<!-- Code Tab -->
		{#if activeTab === 'code'}
			<!-- Code Generation -->
			<section class="tools-section">
				<div class="section-header">
					<h2 class="section-title">Code Generation</h2>
					<button
						class="expand-btn"
						class:expanded={expandedSections.codeGeneration}
						on:click={() => toggleSection('codeGeneration')}
						title={expandedSections.codeGeneration ? 'Show less' : 'Show more'}
					>
						{expandedSections.codeGeneration ? '−' : '+'}
					</button>
				</div>

				<div class="action-grid">
					{#each quickActions.filter((action) => action.category === 'generate') as action (action.id)}
						<button
							class="action-btn button-3d"
							on:click={() => handleQuickAction(action.id)}
							title="Generate {action.label.toLowerCase()}"
						>
							<span class="action-label">{action.label}</span>
						</button>
					{/each}
				</div>

				{#if expandedSections.codeGeneration && extendedActions.generate.length > 0}
					<div class="extended-actions" transition:slide={{ duration: 300 }}>
						<div class="action-grid">
							{#each extendedActions.generate as action (action.id)}
								<button
									class="action-btn button-3d"
									on:click={() => handleQuickAction(action.id)}
									title={action.description}
								>
									<span class="action-label">{action.label}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</section>

			<!-- Code Quality -->
			<section class="tools-section">
				<div class="section-header">
					<h2 class="section-title">Code Quality</h2>
					<button
						class="expand-btn"
						class:expanded={expandedSections.codeQuality}
						on:click={() => toggleSection('codeQuality')}
						title={expandedSections.codeQuality ? 'Show less' : 'Show more'}
					>
						{expandedSections.codeQuality ? '−' : '+'}
					</button>
				</div>

				<div class="action-grid">
					{#each quickActions.filter((action) => action.category === 'quality') as action (action.id)}
						<button
							class="action-btn button-3d"
							on:click={() => handleQuickAction(action.id)}
							title="Run {action.label.toLowerCase()}"
						>
							<span class="action-label">{action.label}</span>
						</button>
					{/each}
				</div>

				{#if expandedSections.codeQuality && extendedActions.quality.length > 0}
					<div class="extended-actions" transition:slide={{ duration: 300 }}>
						<div class="action-grid">
							{#each extendedActions.quality as action (action.id)}
								<button
									class="action-btn button-3d"
									on:click={() => handleQuickAction(action.id)}
									title={action.description}
								>
									<span class="action-label">{action.label}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</section>
		{/if}

		<!-- Tools Tab -->
		{#if activeTab === 'tools'}
			<!-- API Assistant -->
			<section class="tools-section">
				<div class="section-header">
					<h2 class="section-title">API Assistant</h2>
					<button
						class="expand-btn"
						class:expanded={expandedSections.api}
						on:click={() => toggleSection('api')}
					>
						{expandedSections.api ? '−' : '+'}
					</button>
				</div>

				<!-- Always show search -->
				<div class="api-search">
					<input
						type="text"
						class="api-input"
						placeholder="Search API..."
						bind:value={apiSearchQuery}
						on:keydown={(e) => e.key === 'Enter' && handleApiSearch()}
					/>
					<button
						class="search-btn button-3d"
						on:click={handleApiSearch}
						disabled={!apiSearchQuery.trim()}
					>
						Search
					</button>
				</div>

				{#if expandedSections.api}
					<div class="platform-selector" transition:slide={{ duration: 300 }}>
						<button
							class="platform-btn button-3d"
							class:active={selectedPlatforms.has('web')}
							on:click={() => togglePlatform('web')}
							title="Web APIs"
						>
							Web
						</button>
						<button
							class="platform-btn button-3d"
							class:active={selectedPlatforms.has('windows')}
							on:click={() => togglePlatform('windows')}
							title="Windows APIs"
						>
							Windows
						</button>
						<button
							class="platform-btn button-3d"
							class:active={selectedPlatforms.has('apple')}
							on:click={() => togglePlatform('apple')}
							title="Apple APIs"
						>
							Apple
						</button>
						<button
							class="platform-btn button-3d"
							class:active={selectedPlatforms.has('linux')}
							on:click={() => togglePlatform('linux')}
							title="Linux APIs"
						>
							Linux
						</button>
					</div>
				{/if}
			</section>
		{/if}

		<!-- Resources Tab -->
		{#if activeTab === 'resources'}
			<!-- Learning Resources -->
			<section class="tools-section">
				<div class="section-header">
					<h2 class="section-title">Learning Resources</h2>
					<button
						class="expand-btn"
						class:expanded={expandedSections.learningResources}
						on:click={() => toggleSection('learningResources')}
						title={expandedSections.learningResources ? 'Show less' : 'Show more'}
					>
						{expandedSections.learningResources ? '−' : '+'}
					</button>
				</div>

				{#if expandedSections.learningResources}
					<div class="resource-grid">
						{#each learningResources as resource (resource.title)}
							<div class="resource-item">
								<div class="resource-content">
									<h3 class="resource-title">{resource.title}</h3>
									<p class="resource-meta">{resource.type} • {resource.priority}</p>
								</div>
								<button
									class="resource-action-btn button-3d"
									on:click={() => dispatch('openResource', { url: resource.url })}
									title="View {resource.title}"
								>
									<span class="action-label">View</span>
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Knowledge Base -->
			<section class="tools-section">
				<div class="section-header">
					<h2 class="section-title">Knowledge Base</h2>
					<button
						class="expand-btn"
						class:expanded={expandedSections.knowledge}
						on:click={() => toggleSection('knowledge')}
						title={expandedSections.knowledge ? 'Show less' : 'Show more'}
					>
						{expandedSections.knowledge ? '−' : '+'}
					</button>
				</div>

				<!-- Always show save button -->
				<button class="knowledge-btn-compact button-3d" on:click={handleAddToKnowledge}>
					<span class="knowledge-label">Save Selection</span>
				</button>

				{#if expandedSections.knowledge}
					<div class="knowledge-categories" transition:slide={{ duration: 300 }}>
						<div class="knowledge-stats">
							<div class="stat-item">
								<span class="stat-label">Snippets:</span>
								<span class="stat-value">12</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Commands:</span>
								<span class="stat-value">8</span>
							</div>
							<div class="stat-item">
								<span class="stat-label">Tips:</span>
								<span class="stat-value">15</span>
							</div>
						</div>
						<button
							class="browse-knowledge-btn button-3d"
							on:click={() => dispatch('browseKnowledge')}
						>
							<span class="action-label">Browse Saved Items</span>
						</button>
					</div>
				{/if}
			</section>

			<!-- Documentation -->
			<section class="tools-section">
				<div class="section-header">
					<h2 class="section-title">Documentation</h2>
					<button
						class="expand-btn"
						class:expanded={expandedSections.documentation}
						on:click={() => toggleSection('documentation')}
						title={expandedSections.documentation ? 'Show less' : 'Show more'}
					>
						{expandedSections.documentation ? '−' : '+'}
					</button>
				</div>

				{#if expandedSections.documentation}
					<div class="documentation-grid">
						{#each documentationCategories as category (category.id)}
							<div class="category-item">
								<div class="category-content">
									<div class="category-header">
										<h3 class="category-title">{category.label}</h3>
									</div>
									<p class="category-meta">{category.count} resources</p>
								</div>
								<button
									class="category-action-btn button-3d"
									on:click={() => dispatch('openCategory', { category: category.id })}
									title="Browse {category.label} documentation"
								>
									<span class="action-label">Browse</span>
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}

		<!-- Projects Tab -->
		{#if activeTab === 'projects'}
			<!-- Project Context -->
			<section class="tools-section">
				<div class="section-header">
					<h2 class="section-title">Project Context</h2>
					<button
						class="expand-btn"
						class:expanded={expandedSections.projectContext}
						on:click={() => toggleSection('projectContext')}
						title={expandedSections.projectContext ? 'Show less' : 'Show more'}
					>
						{expandedSections.projectContext ? '−' : '+'}
					</button>
				</div>

				<!-- Always visible summary -->
				<div class="context-summary">
					<div class="file-summary">
						<span class="file-name">{projectContext.currentFile.name}</span>
						<span class="file-meta"
							>{projectContext.currentFile.language} • {projectContext.currentFile.lines} lines</span
						>
					</div>
					<div class="vcs-summary">
						<span class="branch">{projectContext.vcs.branch}</span>
						<span class="status" class:modified={projectContext.vcs.status === 'Modified'}>
							{projectContext.vcs.uncommittedChanges} changes
						</span>
					</div>
				</div>

				<!-- Expanded details -->
				{#if expandedSections.projectContext}
					<div class="context-details" transition:slide={{ duration: 300 }}>
						<div class="detail-item">
							<span class="detail-label">Full Path:</span>
							<button
								class="detail-link"
								on:click={() => openFile(projectContext.currentFile.path)}
								title="Open file"
							>
								{projectContext.currentFile.path}
							</button>
						</div>
						<div class="detail-item">
							<span class="detail-label">Last Commit:</span>
							<span class="detail-value">{projectContext.vcs.lastCommit}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">Active Task:</span>
							<span class="detail-value"
								>{projectContext.activeTask.id} - {projectContext.activeTask.title}</span
							>
						</div>
					</div>
				{/if}
			</section>

			<!-- Code Quality & Test Metrics -->
			<section class="tools-section">
				<div class="section-header">
					<h2 class="section-title">Code Quality</h2>
					<button
						class="expand-btn"
						class:expanded={expandedSections.codeMetrics}
						on:click={() => toggleSection('codeMetrics')}
						title={expandedSections.codeMetrics ? 'Show less' : 'Show more'}
					>
						{expandedSections.codeMetrics ? '−' : '+'}
					</button>
				</div>

				<!-- Quality Summary -->
				<div class="quality-summary">
					<div class="metric-item">
						<span class="metric-label">Health:</span>
						<span
							class="metric-value health-indicator"
							style="color: {getHealthColor(codeMetrics.summary.health)}"
						>
							{codeMetrics.summary.health}
						</span>
					</div>
					<div class="metric-item">
						<span class="metric-label">Build:</span>
						<span
							class="metric-value build-status"
							class:passing={codeMetrics.summary.buildStatus === 'passing'}
						>
							{codeMetrics.summary.buildStatus}
						</span>
					</div>
					<div class="metric-item">
						<span class="metric-label">Tests:</span>
						<span class="metric-value tests-ratio">
							{codeMetrics.summary.testsPassed}/{codeMetrics.summary.testsTotal}
						</span>
					</div>
					<div class="metric-item">
						<span class="metric-label">TODOs:</span>
						<span class="metric-value todos-count" class:has-todos={codeMetrics.summary.todos > 0}>
							{codeMetrics.summary.todos}
						</span>
					</div>
				</div>

				<!-- Expanded details -->
				{#if expandedSections.codeMetrics}
					<div class="metrics-details" transition:slide={{ duration: 300 }}>
						{#if codeMetrics.details.todos.length > 0}
							<div class="todos-list">
								<h4 class="todos-title">TODOs:</h4>
								{#each codeMetrics.details.todos as todo (todo.file + ':' + todo.line)}
									<div class="todo-item">
										<button
											class="todo-link"
											on:click={() => openFile(todo.file, todo.line)}
											title="Open {todo.file} at line {todo.line}"
										>
											<span class="todo-file">{todo.file}</span>
											<span class="todo-line">:{todo.line}</span>
										</button>
										<span class="todo-text">{todo.text}</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</section>
		{/if}
	</div>
</aside>

<!-- Knowledge Base Dialog -->
{#if showKnowledgeDialog}
	<div
		class="dialog-overlay"
		on:click={() => (showKnowledgeDialog = false)}
		on:keydown={(e) => e.key === 'Escape' && (showKnowledgeDialog = false)}
		role="button"
		tabindex="0"
	>
		<div
			class="dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
			tabindex="-1"
			on:click|stopPropagation
			on:keydown|stopPropagation
		>
			<h3 id="dialog-title">Save to Knowledge Base</h3>
			<p>Selected: {selectedText}</p>
			<div class="category-buttons">
				<button on:click={() => saveToKnowledge('snippet')}>Code Snippet</button>
				<button on:click={() => saveToKnowledge('explanation')}>Explanation</button>
				<button on:click={() => saveToKnowledge('command')}>Command</button>
				<button on:click={() => saveToKnowledge('tip')}>Tip</button>
			</div>
			<button class="close-btn" on:click={() => (showKnowledgeDialog = false)}>Cancel</button>
		</div>
	</div>
{/if}

<style>
	.input-control-nexus {
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

	.input-control-nexus::before {
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

	.input-control-nexus::after {
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

	/* Tab Navigation - Enhanced */
	.tab-nav {
		display: flex;
		border-bottom: 1px solid var(--glass-border-secondary);
		background: rgba(17, 17, 17, 0.6);
		backdrop-filter: blur(12px);
		position: relative;
		z-index: 3;
	}

	.tab-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-md);
		background: none;
		border: none;
		color: var(--color-text-tertiary);
		cursor: pointer;
		transition: all var(--transition-smooth);
		border-bottom: 2px solid transparent;
		position: relative;
	}

	.tab-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-text-secondary);
		transform: translateY(-1px);
	}

	.tab-btn.active {
		color: var(--color-interactive-primary);
		border-bottom-color: var(--color-interactive-primary);
		background: rgba(34, 197, 94, 0.08);
		box-shadow: 0 0 16px rgba(34, 197, 94, 0.2);
	}

	.tab-label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Tab Content - Enhanced */
	.tab-content {
		flex: 1;
		padding: var(--spacing-lg);
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		position: relative;
		z-index: 3;
	}

	.tools-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		background: rgba(26, 26, 26, 0.4);
		border: 1px solid var(--glass-border-secondary);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
		backdrop-filter: blur(8px);
	}

	/* Section Headers - Enhanced */
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-xs);
	}

	.section-title {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.08em;
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
		cursor: pointer;
		transition: all var(--transition-smooth);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: var(--font-size-sm);
		box-shadow: var(--shadow-elevation-low);
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
		box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
	}

	/* Unified Button System - All buttons now have consistent styling */
	.action-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-sm);
	}

	/* Base button styling for ALL button types */
	.action-btn,
	.knowledge-btn-compact,
	.browse-knowledge-btn,
	.resource-action-btn,
	.category-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
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
		min-height: 44px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
	}

	/* Hover effects for regular buttons without green accent */
	.action-btn:hover,
	.knowledge-btn-compact:hover,
	.browse-knowledge-btn:hover,
	.resource-action-btn:hover,
	.category-action-btn:hover {
		background: var(--glass-elevated-bg);
		color: var(--color-text-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-elevation-medium);
		border-color: var(--glass-border-highlight);
	}

	/* Search button to exactly match send button styling */
	.search-btn {
		background: var(--glass-secondary-bg);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(34, 197, 94, 0.3);
		border-radius: var(--radius-lg);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		transition: all var(--transition-smooth);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-elevation-low), 0 0 8px rgba(34, 197, 94, 0.1);
		min-height: 44px;
		padding: var(--spacing-md);
	}

	.search-btn::before {
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

	.search-btn:hover:not(:disabled) {
		background: var(--glass-elevated-bg);
		color: var(--color-text-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-elevation-medium), 0 0 16px rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.5);
	}

	.search-btn:hover:not(:disabled)::before {
		opacity: 1;
	}

	.search-btn:disabled {
		background: var(--color-border-secondary);
		color: var(--color-text-quaternary);
		cursor: not-allowed;
		transform: none;
		box-shadow: var(--shadow-elevation-low);
	}

	/* Platform buttons to match AI selector exactly */
	.platform-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-surface-primary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: all var(--transition-smooth);
		position: relative;
		overflow: hidden;
		flex: 1;
	}

	.platform-btn::before {
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

	.platform-btn:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-elevation-medium);
	}

	.platform-btn:hover::before {
		opacity: 1;
	}

	.platform-btn.active {
		background: var(--color-surface-primary);
		color: var(--color-text-primary);
		border-color: var(--color-interactive-primary);
		border-width: 2px;
		box-shadow: 0 0 8px rgba(22, 163, 74, 0.2);
		transform: translateY(-1px);
	}

	.platform-btn.active::before {
		opacity: 1;
	}

	.platform-btn.active:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
		border-color: var(--color-interactive-primary);
	}

	/* Smaller buttons for compact areas */
	.resource-action-btn,
	.category-action-btn {
		min-height: 32px;
		padding: var(--spacing-sm);
		font-size: var(--font-size-xs);
	}

	/* Full width buttons */
	.knowledge-btn-compact,
	.browse-knowledge-btn {
		width: 100%;
		gap: var(--spacing-xs);
	}

	/* Platform selector specific styling */
	.platform-selector {
		display: flex;
		gap: var(--spacing-xs);
		margin-top: var(--spacing-sm);
	}

	.action-label,
	.knowledge-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		text-align: center;
		line-height: 1.3;
	}

	/* Extended Actions */
	.extended-actions {
		margin-top: var(--spacing-sm);
		padding-top: var(--spacing-sm);
		border-top: 1px solid var(--color-border-secondary);
	}

	/* API Search */
	.api-search {
		display: flex;
		gap: var(--spacing-xs);
	}

	.api-input {
		flex: 1;
		padding: var(--spacing-sm);
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-sm);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		outline: none;
	}

	.api-input:focus {
		border-color: var(--color-border-focus);
	}

	/* Knowledge Base */
	.knowledge-btn-compact {
		width: 100%;
		gap: var(--spacing-sm);
	}

	.knowledge-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
	}

	/* Dialog styles remain the same */
	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.dialog {
		background: var(--color-surface-primary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		max-width: 400px;
		width: 90%;
	}

	.category-buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-sm);
		margin: var(--spacing-md) 0;
	}

	.category-buttons button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
		background: var(--glass-secondary-bg);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(34, 197, 94, 0.3);
		border-radius: var(--radius-lg);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-smooth);
		position: relative;
		overflow: hidden;
		box-shadow:
			var(--shadow-elevation-low),
			0 0 8px rgba(34, 197, 94, 0.1);
		min-height: 44px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
	}

	.category-buttons button::before {
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

	.category-buttons button:hover {
		background: var(--glass-elevated-bg);
		color: var(--color-text-primary);
		transform: translateY(-2px);
		box-shadow:
			var(--shadow-elevation-medium),
			0 0 16px rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.5);
	}

	.category-buttons button:hover::before {
		opacity: 1;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: var(--spacing-md);
		background: var(--glass-secondary-bg);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(34, 197, 94, 0.3);
		border-radius: var(--radius-lg);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all var(--transition-smooth);
		position: relative;
		overflow: hidden;
		box-shadow:
			var(--shadow-elevation-low),
			0 0 8px rgba(34, 197, 94, 0.1);
		min-height: 44px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
	}

	.close-btn::before {
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

	.close-btn:hover {
		background: var(--glass-elevated-bg);
		color: var(--color-text-primary);
		transform: translateY(-2px);
		box-shadow:
			var(--shadow-elevation-medium),
			0 0 16px rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.5);
	}

	.close-btn:hover::before {
		opacity: 1;
	}

	/* Project Context Styles */
	.context-summary {
		background: var(--color-surface-secondary);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.file-summary {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.file-name {
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
	}

	.file-meta {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.vcs-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--spacing-xs);
		border-top: 1px solid var(--color-border-secondary);
	}

	.branch {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	.status {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		background: var(--color-surface-tertiary);
	}

	.status.modified {
		color: var(--color-warning);
		background: color-mix(in srgb, var(--color-warning) 15%, transparent);
	}

	.context-details {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--color-surface-tertiary);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-secondary);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.detail-label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.detail-value {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
	}

	.detail-link {
		background: none;
		border: none;
		color: var(--color-interactive-primary);
		text-align: left;
		cursor: pointer;
		font-size: var(--font-size-sm);
		text-decoration: underline;
		transition: color var(--transition-smooth);
	}

	.detail-link:hover {
		color: var(--color-interactive-hover);
	}

	/* Quality Summary Styles */
	.quality-summary {
		background: var(--color-surface-secondary);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-sm);
	}

	.metric-item {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.metric-label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.metric-value {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
	}

	.health-indicator {
		text-transform: capitalize;
	}

	.build-status.passing {
		color: var(--color-success);
	}

	.tests-ratio {
		color: var(--color-success);
	}

	.todos-count {
		color: var(--color-text-secondary);
	}

	.todos-count.has-todos {
		color: var(--color-warning);
	}

	.metrics-details {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--color-surface-tertiary);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-secondary);
	}

	.todos-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.todos-title {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0;
	}

	.todo-item {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm);
		background: var(--color-surface-primary);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border-secondary);
	}

	.todo-link {
		background: none;
		border: none;
		color: var(--color-interactive-primary);
		text-align: left;
		cursor: pointer;
		font-size: var(--font-size-xs);
		font-family: var(--font-mono);
		transition: color var(--transition-smooth);
	}

	.todo-link:hover {
		color: var(--color-interactive-hover);
	}

	.todo-file {
		font-weight: var(--font-weight-medium);
	}

	.todo-line {
		color: var(--color-text-secondary);
	}

	.todo-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		line-height: 1.4;
	}

	/* Resources Tab Styles */
	.resource-grid {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		margin-top: var(--spacing-sm);
	}

	.resource-item {
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-sm);
		padding: var(--spacing-sm);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		transition: all var(--transition-smooth);
	}

	.resource-item:hover {
		background: var(--color-surface-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-elevation-low);
	}

	.resource-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.resource-title {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.resource-meta {
		font-size: 10px;
		color: var(--color-text-secondary);
		margin: 0;
		text-transform: capitalize;
		line-height: 1.2;
	}

	.resource-action-btn {
		flex-shrink: 0;
		min-width: 48px;
		height: 24px;
	}

	.documentation-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-xs);
		margin-top: var(--spacing-sm);
	}

	.category-item {
		background: var(--color-surface-secondary);
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-sm);
		padding: var(--spacing-sm);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		transition: all var(--transition-smooth);
	}

	.category-item:hover {
		background: var(--color-surface-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-elevation-low);
	}

	.category-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.category-title {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin: 0;
		line-height: 1.2;
	}

	.category-meta {
		font-size: 10px;
		color: var(--color-text-secondary);
		margin: 0;
		line-height: 1.2;
	}

	.category-action-btn {
		width: 100%;
		height: 24px;
	}

	/* Knowledge Base Styles */
	.knowledge-categories {
		margin-top: var(--spacing-sm);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.knowledge-stats {
		background: var(--color-surface-secondary);
		border-radius: var(--radius-sm);
		padding: var(--spacing-sm);
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: var(--spacing-xs);
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		text-align: center;
	}

	.stat-label {
		font-size: 10px;
		color: var(--color-text-secondary);
		font-weight: var(--font-weight-medium);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}

	.browse-knowledge-btn {
		width: 100%;
		gap: var(--spacing-xs);
	}

	/* Gradient overlay effect for buttons */
	.action-btn::before,
	.search-btn::before,
	.platform-btn::before,
	.knowledge-btn-compact::before,
	.browse-knowledge-btn::before,
	.resource-action-btn::before,
	.category-action-btn::before {
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

	.action-btn:hover::before,
	.search-btn:hover::before,
	.platform-btn:hover::before,
	.knowledge-btn-compact:hover::before,
	.browse-knowledge-btn:hover::before,
	.resource-action-btn:hover::before,
	.category-action-btn:hover::before {
		opacity: 1;
	}

	.platform-btn.active::before {
		opacity: 1;
	}
</style>

# Complete Examples Repository - Synapse-Hub

**Purpose**: Working examples of major patterns and implementations  
**Last Updated**: Phase 1 Implementation - Reference Systems  
**Usage**: Reference implementations for AI-generated code validation

---

## Example Categories

### 1. Component Examples
- [Panel Component Example](#panel-component-example) - Complete panel implementation
- [Form Component Example](#form-component-example) - Accessible form with validation
- [Interactive Component Example](#interactive-component-example) - Complex user interactions

### 2. Pattern Examples
- [State Management Example](#state-management-example) - Svelte stores implementation
- [API Integration Example](#api-integration-example) - Type-safe API communication
- [Event Handling Example](#event-handling-example) - Component communication patterns

### 3. Feature Examples
- [Theme System Example](#theme-system-example) - Complete theming implementation
- [Accessibility Example](#accessibility-example) - WCAG compliance patterns
- [Performance Example](#performance-example) - Optimization techniques

### 4. Integration Examples
- [Full Feature Example](#full-feature-example) - End-to-end feature implementation
- [Testing Example](#testing-example) - Comprehensive testing patterns

---

## Panel Component Example

**File**: `EXAMPLES/components/ExamplePanel.svelte`  
**Purpose**: Demonstrates complete panel component with all standard features  
**Patterns**: Glass morphism, progressive disclosure, accessibility, event handling

```svelte
<script lang="ts">
	// Example Panel Component - Demonstrates all standard panel patterns
	//
	// 🤖 AI IMPLEMENTATION BREADCRUMBS:
	// Phase 1: Complete example implementation for pattern reference (Current)
	// Demonstrates: Glass morphism, progressive disclosure, accessibility, events
	//
	import { createEventDispatcher } from 'svelte';
	import { slide, fade } from 'svelte/transition';

	// Component interface - demonstrates proper typing
	interface ExampleData {
		id: string;
		title: string;
		description: string;
		priority: 'high' | 'medium' | 'low';
		completed: boolean;
	}

	interface ExampleEvents {
		itemSelect: { item: ExampleData };
		actionTrigger: { action: string; data?: unknown };
		stateChange: { section: string; expanded: boolean };
	}

	// Props with defaults
	export let title = 'Example Panel';
	export let data: ExampleData[] = [];
	export let isMinimized = false;
	export let allowSelection = true;

	// Event dispatcher with type safety
	const dispatch = createEventDispatcher<ExampleEvents>();

	// State management
	let expandedSections = {
		main: true,
		advanced: false,
		settings: false
	};
	let selectedItem: ExampleData | null = null;
	let searchQuery = '';

	// Derived state - demonstrates reactive patterns
	$: filteredData = data.filter(item => 
		item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
		item.description.toLowerCase().includes(searchQuery.toLowerCase())
	);
	$: hasSelection = selectedItem !== null;
	$: completedCount = data.filter(item => item.completed).length;

	// Event handlers
	function toggleSection(section: keyof typeof expandedSections) {
		expandedSections[section] = !expandedSections[section];
		dispatch('stateChange', { 
			section, 
			expanded: expandedSections[section] 
		});
	}

	function selectItem(item: ExampleData) {
		if (!allowSelection) return;
		
		selectedItem = selectedItem?.id === item.id ? null : item;
		if (selectedItem) {
			dispatch('itemSelect', { item: selectedItem });
		}
	}

	function triggerAction(action: string, data?: unknown) {
		dispatch('actionTrigger', { action, data });
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			selectedItem = null;
			searchQuery = '';
		}
	}

	// Focus management
	function focusSearchInput() {
		const input = document.getElementById('example-search');
		input?.focus();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<section 
	class="example-panel glass-panel-primary"
	class:minimized={isMinimized}
	aria-label={title}
	role="region"
>
	<!-- Panel Header -->
	<header class="panel-header">
		<div class="header-content">
			<h2 class="panel-title">{title}</h2>
			<div class="header-stats" aria-live="polite">
				<span class="stat">
					<span class="stat-value">{data.length}</span>
					<span class="stat-label">Total</span>
				</span>
				<span class="stat">
					<span class="stat-value">{completedCount}</span>
					<span class="stat-label">Completed</span>
				</span>
			</div>
		</div>
		
		<div class="header-actions">
			<button 
				class="unified-button mini"
				on:click={focusSearchInput}
				aria-label="Focus search"
			>
				Search
			</button>
			<button 
				class="unified-button mini"
				on:click={() => triggerAction('refresh')}
				aria-label="Refresh data"
			>
				Refresh
			</button>
		</div>
	</header>

	{#if !isMinimized}
		<!-- Search Section -->
		<div class="search-section">
			<label for="example-search" class="sr-only">Search items</label>
			<input
				id="example-search"
				type="text"
				bind:value={searchQuery}
				placeholder="Search items..."
				class="search-input"
				aria-describedby="search-help"
			/>
			<div id="search-help" class="sr-only">
				Type to filter items by title or description
			</div>
		</div>

		<!-- Main Content Section -->
		<div class="content-section">
			<button 
				class="section-header unified-button"
				on:click={() => toggleSection('main')}
				aria-expanded={expandedSections.main}
				aria-controls="main-content"
			>
				<span class="section-title">Main Content ({filteredData.length})</span>
				<span class="expand-indicator" class:expanded={expandedSections.main}>
					{expandedSections.main ? '−' : '+'}
				</span>
			</button>

			{#if expandedSections.main}
				<div 
					id="main-content"
					class="section-content"
					transition:slide={{ duration: 200 }}
				>
					{#if filteredData.length > 0}
						<ul class="item-list" role="listbox" aria-label="Example items">
							{#each filteredData as item (item.id)}
								<li 
									class="item"
									class:selected={selectedItem?.id === item.id}
									class:completed={item.completed}
									role="option"
									aria-selected={selectedItem?.id === item.id}
									tabindex="0"
									on:click={() => selectItem(item)}
									on:keydown={(e) => e.key === 'Enter' && selectItem(item)}
								>
									<div class="item-content">
										<h3 class="item-title">{item.title}</h3>
										<p class="item-description">{item.description}</p>
										<span class="item-priority priority-{item.priority}">
											{item.priority}
										</span>
									</div>
									{#if item.completed}
										<div class="item-status" aria-label="Completed">✓</div>
									{/if}
								</li>
							{/each}
						</ul>
					{:else}
						<div class="empty-state">
							<p>No items found</p>
							{#if searchQuery}
								<button 
									class="unified-button"
									on:click={() => searchQuery = ''}
								>
									Clear Search
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Advanced Section -->
		<div class="content-section">
			<button 
				class="section-header unified-button"
				on:click={() => toggleSection('advanced')}
				aria-expanded={expandedSections.advanced}
				aria-controls="advanced-content"
			>
				<span class="section-title">Advanced Options</span>
				<span class="expand-indicator" class:expanded={expandedSections.advanced}>
					{expandedSections.advanced ? '−' : '+'}
				</span>
			</button>

			{#if expandedSections.advanced}
				<div 
					id="advanced-content"
					class="section-content"
					transition:slide={{ duration: 200 }}
				>
					<div class="action-grid">
						<button 
							class="unified-button"
							on:click={() => triggerAction('export', { format: 'json' })}
							disabled={data.length === 0}
						>
							Export JSON
						</button>
						<button 
							class="unified-button"
							on:click={() => triggerAction('selectAll')}
							disabled={data.length === 0}
						>
							Select All
						</button>
						<button 
							class="unified-button"
							on:click={() => triggerAction('clearCompleted')}
							disabled={completedCount === 0}
						>
							Clear Completed
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Selection Details -->
		{#if hasSelection && selectedItem}
			<div 
				class="selection-details"
				transition:fade={{ duration: 150 }}
				aria-live="polite"
			>
				<h3 class="selection-title">Selected: {selectedItem.title}</h3>
				<p class="selection-description">{selectedItem.description}</p>
				<div class="selection-actions">
					<button 
						class="unified-button primary"
						on:click={() => triggerAction('edit', selectedItem)}
					>
						Edit
					</button>
					<button 
						class="unified-button"
						on:click={() => triggerAction('duplicate', selectedItem)}
					>
						Duplicate
					</button>
					<button 
						class="unified-button"
						on:click={() => selectedItem = null}
					>
						Clear Selection
					</button>
				</div>
			</div>
		{/if}
	{/if}
</section>

<style>
	/* Panel Structure */
	.example-panel {
		display: flex;
		flex-direction: column;
		min-height: 200px;
		max-height: 600px;
		overflow: hidden;
		transition: var(--transition-smooth);
	}

	.example-panel.minimized {
		max-height: 60px;
	}

	/* Header */
	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--glass-border);
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.panel-title {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.header-stats {
		display: flex;
		gap: var(--spacing-sm);
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: var(--font-size-xs);
	}

	.stat-value {
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.stat-label {
		color: var(--color-text-secondary);
	}

	.header-actions {
		display: flex;
		gap: var(--spacing-xs);
	}

	/* Search */
	.search-section {
		padding: var(--spacing-md);
		border-bottom: 1px solid var(--glass-border);
	}

	.search-input {
		width: 100%;
		padding: var(--spacing-sm);
		background: var(--glass-secondary-bg);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-md);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
	}

	.search-input:focus {
		outline: 2px solid rgba(34, 197, 94, 0.6);
		outline-offset: 2px;
		border-color: rgba(34, 197, 94, 0.5);
	}

	/* Content Sections */
	.content-section {
		border-bottom: 1px solid var(--glass-border-subtle);
	}

	.section-header {
		width: 100%;
		padding: var(--spacing-md);
		text-align: left;
		border: none;
		background: transparent;
		cursor: pointer;
	}

	.section-title {
		flex: 1;
		font-weight: 500;
	}

	.expand-indicator {
		margin-left: auto;
		transition: transform var(--transition-quick);
	}

	.expand-indicator.expanded {
		transform: rotate(180deg);
	}

	.section-content {
		padding: 0 var(--spacing-md) var(--spacing-md);
	}

	/* Item List */
	.item-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.item {
		display: flex;
		align-items: center;
		padding: var(--spacing-sm);
		background: var(--glass-secondary-bg);
		border: 1px solid var(--glass-border-subtle);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: var(--transition-smooth);
	}

	.item:hover {
		background: var(--glass-interactive-hover-bg);
		border-color: rgba(34, 197, 94, 0.3);
	}

	.item:focus-visible {
		outline: 2px solid rgba(34, 197, 94, 0.6);
		outline-offset: 2px;
	}

	.item.selected {
		background: rgba(34, 197, 94, 0.1);
		border-color: rgba(34, 197, 94, 0.4);
	}

	.item.completed {
		opacity: 0.7;
	}

	.item-content {
		flex: 1;
	}

	.item-title {
		margin: 0 0 var(--spacing-xs) 0;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.item-description {
		margin: 0;
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		line-height: 1.4;
	}

	.item-priority {
		display: inline-block;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: 500;
		text-transform: uppercase;
		margin-top: var(--spacing-xs);
	}

	.priority-high {
		background: rgba(239, 68, 68, 0.2);
		color: rgb(239, 68, 68);
	}

	.priority-medium {
		background: rgba(245, 158, 11, 0.2);
		color: rgb(245, 158, 11);
	}

	.priority-low {
		background: rgba(34, 197, 94, 0.2);
		color: rgb(34, 197, 94);
	}

	.item-status {
		margin-left: var(--spacing-sm);
		color: var(--color-success);
		font-weight: 600;
	}

	/* Action Grid */
	.action-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: var(--spacing-sm);
	}

	/* Selection Details */
	.selection-details {
		padding: var(--spacing-md);
		background: rgba(34, 197, 94, 0.05);
		border-top: 1px solid rgba(34, 197, 94, 0.2);
	}

	.selection-title {
		margin: 0 0 var(--spacing-xs) 0;
		font-size: var(--font-size-md);
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.selection-description {
		margin: 0 0 var(--spacing-md) 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.selection-actions {
		display: flex;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: var(--spacing-lg);
		color: var(--color-text-secondary);
	}

	/* Screen Reader Only */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--spacing-sm);
		}

		.action-grid {
			grid-template-columns: 1fr;
		}

		.selection-actions {
			flex-direction: column;
		}
	}

	/* Reduced Motion Support */
	@media (prefers-reduced-motion: reduce) {
		.item,
		.expand-indicator,
		.example-panel {
			transition: none;
		}
	}
</style>
```

### Usage Example

```svelte
<script lang="ts">
	import ExamplePanel from './EXAMPLES/components/ExamplePanel.svelte';
	
	const sampleData = [
		{
			id: '1',
			title: 'Implement authentication',
			description: 'Add user authentication with JWT tokens',
			priority: 'high' as const,
			completed: false
		},
		{
			id: '2',
			title: 'Update documentation',
			description: 'Update API documentation with new endpoints',
			priority: 'medium' as const,
			completed: true
		}
	];
	
	function handleItemSelect(event) {
		console.log('Item selected:', event.detail.item);
	}
	
	function handleAction(event) {
		console.log('Action triggered:', event.detail.action, event.detail.data);
	}
</script>

<ExamplePanel 
	title="Task Management"
	data={sampleData}
	on:itemSelect={handleItemSelect}
	on:actionTrigger={handleAction}
	on:stateChange={(e) => console.log('State changed:', e.detail)}
/>
```

---

## Form Component Example

**File**: `EXAMPLES/components/ExampleForm.svelte`  
**Purpose**: Demonstrates accessible form with validation and error handling  
**Patterns**: Form accessibility, validation, error states, keyboard navigation

*(Additional examples would continue in similar format...)*

---

## State Management Example

**File**: `EXAMPLES/patterns/StateManagement.ts`  
**Purpose**: Complete Svelte store implementation with actions and derived state  
**Patterns**: Stores, derived state, actions, persistence

```typescript
// Complete State Management Example
// Demonstrates Svelte stores, derived state, and actions

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// Types
interface Task {
	id: string;
	title: string;
	completed: boolean;
	priority: 'high' | 'medium' | 'low';
	createdAt: Date;
}

interface AppState {
	tasks: Task[];
	filter: 'all' | 'active' | 'completed';
	searchQuery: string;
}

// Base store
const initialState: AppState = {
	tasks: [],
	filter: 'all',
	searchQuery: ''
};

export const appState = writable<AppState>(initialState);

// Derived stores
export const filteredTasks = derived(
	appState,
	($state) => {
		let filtered = $state.tasks;
		
		// Apply search filter
		if ($state.searchQuery) {
			filtered = filtered.filter(task =>
				task.title.toLowerCase().includes($state.searchQuery.toLowerCase())
			);
		}
		
		// Apply status filter
		switch ($state.filter) {
			case 'active':
				return filtered.filter(task => !task.completed);
			case 'completed':
				return filtered.filter(task => task.completed);
			default:
				return filtered;
		}
	}
);

export const taskStats = derived(
	appState,
	($state) => ({
		total: $state.tasks.length,
		completed: $state.tasks.filter(t => t.completed).length,
		active: $state.tasks.filter(t => !t.completed).length,
		highPriority: $state.tasks.filter(t => t.priority === 'high' && !t.completed).length
	})
);

// Actions
export const taskActions = {
	addTask: (title: string, priority: Task['priority'] = 'medium') => {
		const newTask: Task = {
			id: crypto.randomUUID(),
			title,
			completed: false,
			priority,
			createdAt: new Date()
		};
		
		appState.update(state => ({
			...state,
			tasks: [...state.tasks, newTask]
		}));
	},
	
	toggleTask: (id: string) => {
		appState.update(state => ({
			...state,
			tasks: state.tasks.map(task =>
				task.id === id ? { ...task, completed: !task.completed } : task
			)
		}));
	},
	
	deleteTask: (id: string) => {
		appState.update(state => ({
			...state,
			tasks: state.tasks.filter(task => task.id !== id)
		}));
	},
	
	setFilter: (filter: AppState['filter']) => {
		appState.update(state => ({ ...state, filter }));
	},
	
	setSearchQuery: (searchQuery: string) => {
		appState.update(state => ({ ...state, searchQuery }));
	},
	
	clearCompleted: () => {
		appState.update(state => ({
			...state,
			tasks: state.tasks.filter(task => !task.completed)
		}));
	}
};

// Persistence
if (browser) {
	// Load from localStorage
	const stored = localStorage.getItem('synapse-hub-tasks');
	if (stored) {
		try {
			const parsed = JSON.parse(stored);
			appState.set({
				...initialState,
				...parsed,
				tasks: parsed.tasks?.map((task: any) => ({
					...task,
					createdAt: new Date(task.createdAt)
				})) || []
			});
		} catch (error) {
			console.error('Failed to parse stored state:', error);
		}
	}
	
	// Save to localStorage on changes
	appState.subscribe(state => {
		localStorage.setItem('synapse-hub-tasks', JSON.stringify(state));
	});
}
```

---

## API Integration Example

**File**: `EXAMPLES/patterns/ApiIntegration.ts`  
**Purpose**: Type-safe API communication with error handling  
**Patterns**: HTTP client, error handling, type safety, retry logic

```typescript
// Complete API Integration Example
// Demonstrates type-safe API communication

// Types
interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: any;
	};
	metadata: {
		timestamp: string;
		requestId: string;
	};
}

interface TaskDto {
	id: string;
	title: string;
	completed: boolean;
	priority: 'high' | 'medium' | 'low';
	createdAt: string;
	updatedAt: string;
}

// API Client Class
class ApiClient {
	private baseUrl: string;
	private defaultHeaders: Record<string, string>;
	
	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
		this.defaultHeaders = {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		};
	}
	
	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<ApiResponse<T>> {
		const url = `${this.baseUrl}${endpoint}`;
		const config: RequestInit = {
			...options,
			headers: {
				...this.defaultHeaders,
				...options.headers
			}
		};
		
		try {
			const response = await fetch(url, config);
			const data = await response.json();
			
			if (!response.ok) {
				return {
					success: false,
					error: {
						code: `HTTP_${response.status}`,
						message: data.message || response.statusText,
						details: data
					},
					metadata: {
						timestamp: new Date().toISOString(),
						requestId: crypto.randomUUID()
					}
				};
			}
			
			return {
				success: true,
				data,
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: crypto.randomUUID()
				}
			};
		} catch (error) {
			return {
				success: false,
				error: {
					code: 'NETWORK_ERROR',
					message: error instanceof Error ? error.message : 'Unknown error',
					details: error
				},
				metadata: {
					timestamp: new Date().toISOString(),
					requestId: crypto.randomUUID()
				}
			};
		}
	}
	
	// Task API methods
	async getTasks(): Promise<ApiResponse<TaskDto[]>> {
		return this.request<TaskDto[]>('/api/tasks');
	}
	
	async getTask(id: string): Promise<ApiResponse<TaskDto>> {
		return this.request<TaskDto>(`/api/tasks/${id}`);
	}
	
	async createTask(task: Omit<TaskDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<TaskDto>> {
		return this.request<TaskDto>('/api/tasks', {
			method: 'POST',
			body: JSON.stringify(task)
		});
	}
	
	async updateTask(id: string, updates: Partial<TaskDto>): Promise<ApiResponse<TaskDto>> {
		return this.request<TaskDto>(`/api/tasks/${id}`, {
			method: 'PUT',
			body: JSON.stringify(updates)
		});
	}
	
	async deleteTask(id: string): Promise<ApiResponse<void>> {
		return this.request<void>(`/api/tasks/${id}`, {
			method: 'DELETE'
		});
	}
}

// Create client instance
export const apiClient = new ApiClient('http://localhost:3000');

// Utility functions for common patterns
export async function handleApiCall<T>(
	apiCall: () => Promise<ApiResponse<T>>,
	onSuccess?: (data: T) => void,
	onError?: (error: ApiResponse<T>['error']) => void
): Promise<T | null> {
	const response = await apiCall();
	
	if (response.success && response.data) {
		onSuccess?.(response.data);
		return response.data;
	} else {
		onError?.(response.error);
		return null;
	}
}

// Usage example in component
/*
<script lang="ts">
	import { apiClient, handleApiCall } from './ApiIntegration';
	import { taskActions } from './StateManagement';
	
	async function loadTasks() {
		await handleApiCall(
			() => apiClient.getTasks(),
			(tasks) => {
				// Success: update local state
				tasks.forEach(task => taskActions.addTask(task.title, task.priority));
			},
			(error) => {
				// Error: show user feedback
				console.error('Failed to load tasks:', error?.message);
			}
		);
	}
</script>
*/
```

---

## Testing Example

**File**: `EXAMPLES/testing/ComponentTest.test.ts`  
**Purpose**: Comprehensive component testing patterns  
**Patterns**: Unit testing, accessibility testing, interaction testing

```typescript
// Complete Testing Example
// Demonstrates comprehensive component testing

import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import ExamplePanel from '../components/ExamplePanel.svelte';

// Mock data
const mockData = [
	{
		id: '1',
		title: 'Test Task 1',
		description: 'First test task',
		priority: 'high' as const,
		completed: false
	},
	{
		id: '2',
		title: 'Test Task 2',
		description: 'Second test task',
		priority: 'medium' as const,
		completed: true
	}
];

describe('ExamplePanel Component', () => {
	// Rendering tests
	describe('Rendering', () => {
		it('renders with default props', () => {
			render(ExamplePanel);
			
			expect(screen.getByRole('region')).toBeInTheDocument();
			expect(screen.getByText('Example Panel')).toBeInTheDocument();
		});
		
		it('renders with custom title and data', () => {
			render(ExamplePanel, {
				props: {
					title: 'Custom Panel',
					data: mockData
				}
			});
			
			expect(screen.getByText('Custom Panel')).toBeInTheDocument();
			expect(screen.getByText('Test Task 1')).toBeInTheDocument();
			expect(screen.getByText('Test Task 2')).toBeInTheDocument();
		});
		
		it('displays correct statistics', () => {
			render(ExamplePanel, {
				props: { data: mockData }
			});
			
			expect(screen.getByText('2')).toBeInTheDocument(); // Total
			expect(screen.getByText('1')).toBeInTheDocument(); // Completed
		});
	});
	
	// Interaction tests
	describe('User Interactions', () => {
		it('expands and collapses sections', async () => {
			render(ExamplePanel, {
				props: { data: mockData }
			});
			
			const mainSection = screen.getByText(/Main Content/);
			expect(screen.getByText('Test Task 1')).toBeInTheDocument();
			
			// Collapse section
			await fireEvent.click(mainSection);
			expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
			
			// Expand section
			await fireEvent.click(mainSection);
			await waitFor(() => {
				expect(screen.getByText('Test Task 1')).toBeInTheDocument();
			});
		});
		
		it('handles item selection', async () => {
			const mockHandler = vi.fn();
			render(ExamplePanel, {
				props: { 
					data: mockData,
					allowSelection: true
				}
			});
			
			// Add event listener
			const component = screen.getByRole('region').closest('.example-panel');
			component?.addEventListener('itemSelect', mockHandler);
			
			// Click item
			const item = screen.getByText('Test Task 1').closest('li');
			await fireEvent.click(item!);
			
			expect(mockHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: expect.objectContaining({
						item: expect.objectContaining({
							id: '1',
							title: 'Test Task 1'
						})
					})
				})
			);
		});
		
		it('filters items by search query', async () => {
			render(ExamplePanel, {
				props: { data: mockData }
			});
			
			const searchInput = screen.getByPlaceholderText('Search items...');
			
			// Search for specific task
			await fireEvent.input(searchInput, { target: { value: 'Task 1' } });
			
			expect(screen.getByText('Test Task 1')).toBeInTheDocument();
			expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
		});
	});
	
	// Accessibility tests
	describe('Accessibility', () => {
		it('has proper ARIA labels', () => {
			render(ExamplePanel, {
				props: { title: 'Test Panel' }
			});
			
			expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Test Panel');
			expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Example items');
		});
		
		it('supports keyboard navigation', async () => {
			render(ExamplePanel, {
				props: { data: mockData }
			});
			
			const firstItem = screen.getByText('Test Task 1').closest('li');
			
			// Focus item
			firstItem?.focus();
			expect(document.activeElement).toBe(firstItem);
			
			// Select with Enter key
			await fireEvent.keyDown(firstItem!, { key: 'Enter' });
			expect(firstItem).toHaveClass('selected');
		});
		
		it('handles escape key correctly', async () => {
			render(ExamplePanel, {
				props: { data: mockData }
			});
			
			const searchInput = screen.getByPlaceholderText('Search items...');
			
			// Add search query
			await fireEvent.input(searchInput, { target: { value: 'test' } });
			expect(searchInput).toHaveValue('test');
			
			// Press escape
			await fireEvent.keyDown(window, { key: 'Escape' });
			expect(searchInput).toHaveValue('');
		});
		
		it('announces state changes to screen readers', async () => {
			render(ExamplePanel, {
				props: { data: mockData }
			});
			
			const liveRegion = screen.getByLabelText(/Total/);
			expect(liveRegion.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
		});
	});
	
	// Error states and edge cases
	describe('Edge Cases', () => {
		it('handles empty data gracefully', () => {
			render(ExamplePanel, {
				props: { data: [] }
			});
			
			expect(screen.getByText('No items found')).toBeInTheDocument();
		});
		
		it('handles disabled selection mode', async () => {
			render(ExamplePanel, {
				props: { 
					data: mockData,
					allowSelection: false
				}
			});
			
			const item = screen.getByText('Test Task 1').closest('li');
			await fireEvent.click(item!);
			
			expect(item).not.toHaveClass('selected');
		});
		
		it('works in minimized mode', () => {
			render(ExamplePanel, {
				props: { 
					data: mockData,
					isMinimized: true
				}
			});
			
			expect(screen.queryByText('Test Task 1')).not.toBeInTheDocument();
			expect(screen.getByText('Example Panel')).toBeInTheDocument();
		});
	});
});
```

---

## Example Directory Structure

```
EXAMPLES/
├── README.md                    # This file
├── components/
│   ├── ExamplePanel.svelte      # Complete panel component
│   ├── ExampleForm.svelte       # Accessible form component
│   └── ExampleInteractive.svelte # Complex interactions
├── patterns/
│   ├── StateManagement.ts       # Svelte stores example
│   ├── ApiIntegration.ts        # API client example
│   ├── EventHandling.ts         # Event patterns
│   └── ThemeSystem.ts           # Theming implementation
├── features/
│   ├── TaskManagement/          # Complete feature example
│   │   ├── TaskList.svelte
│   │   ├── TaskForm.svelte
│   │   ├── TaskStore.ts
│   │   └── TaskApi.ts
│   └── UserPreferences/         # Preferences feature
├── testing/
│   ├── ComponentTest.test.ts    # Component testing patterns
│   ├── IntegrationTest.test.ts  # Integration testing
│   └── E2ETest.spec.ts         # End-to-end testing
└── utils/
    ├── TestHelpers.ts           # Testing utilities
    ├── MockData.ts              # Mock data generators
    └── Validators.ts            # Validation examples
```

---

## Usage Guidelines

### For AI Development
1. **Reference First**: Check examples before implementing similar functionality
2. **Copy and Adapt**: Use examples as starting points for new components
3. **Maintain Patterns**: Follow established patterns for consistency
4. **Update Examples**: Add new patterns when they emerge

### For Human Developers
1. **Learning Resource**: Understand project patterns and conventions
2. **Quick Start**: Bootstrap new components using example code
3. **Best Practices**: See accessibility, performance, and testing patterns
4. **Integration Guide**: Understand how components work together

### Example Maintenance
1. **Keep Current**: Update examples when patterns evolve
2. **Test Examples**: Ensure all examples are functional and tested
3. **Document Changes**: Update documentation when examples change
4. **Version Control**: Track example evolution alongside main codebase

---

**Example Repository Protocol**: All examples should be functional, tested, and demonstrate current best practices. Examples serve as both reference and validation for AI-generated code patterns. 
# Code Pattern Library - Synapse-Hub

**Purpose**: Documented patterns with examples for each component type  
**Last Updated**: Phase 1 Implementation - Reference Systems  
**Usage**: Reference guide for consistent AI-generated code patterns

---

## Pattern Categories

1. [Svelte Component Patterns](#svelte-component-patterns)
2. [TypeScript Interface Patterns](#typescript-interface-patterns)
3. [CSS Styling Patterns](#css-styling-patterns)
4. [State Management Patterns](#state-management-patterns)
5. [Event Handling Patterns](#event-handling-patterns)
6. [Accessibility Patterns](#accessibility-patterns)
7. [Performance Patterns](#performance-patterns)
8. [Testing Patterns](#testing-patterns)

---

## Svelte Component Patterns

### 1. Panel Component Structure

**Pattern**: Three-panel layout system component  
**Use Case**: Main UI panel components  
**Example**: `InputControlNexus.svelte`, `CoCreationCanvas.svelte`, `OrchestrationForesightDeck.svelte`

```svelte
<script lang="ts">
	// Component name - Brief description
	//
	// 🤖 AI IMPLEMENTATION BREADCRUMBS:
	// Phase 0: [Feature description] (Status)
	// Phase 1: [Feature description] (Status)
	// Future: [Planned features]
	//
	import { createEventDispatcher } from 'svelte';
	import { slide, fade } from 'svelte/transition';

	// Props with defaults
	export let isFloatingIsland: boolean = false;
	export let isMinimized: boolean = false;

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// State management
	let expandedSections = {
		section1: true,
		section2: false
	};

	// Event handlers
	function toggleSection(section: keyof typeof expandedSections) {
		expandedSections[section] = !expandedSections[section];
	}
</script>

<section 
	class="panel-component glass-panel-primary" 
	class:floating-island={isFloatingIsland}
	aria-label="Component Description"
>
	<!-- Content -->
</section>

<style>
	.panel-component {
		/* Glass morphism styling */
		background: var(--glass-primary-bg);
		backdrop-filter: blur(12px);
		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
	}
</style>
```

### 2. Collapsible Section Pattern

**Pattern**: Expandable/collapsible content sections  
**Use Case**: Progressive disclosure in panel components  

```svelte
<div class="section-container">
	<button 
		class="section-header unified-button"
		on:click={() => toggleSection('sectionName')}
		aria-expanded={expandedSections.sectionName}
		aria-controls="section-content"
	>
		<span class="section-title">Section Title</span>
		<span class="expand-indicator" class:expanded={expandedSections.sectionName}>
			{expandedSections.sectionName ? '−' : '+'}
		</span>
	</button>

	{#if expandedSections.sectionName}
		<div 
			id="section-content"
			class="section-content"
			transition:slide={{ duration: 200 }}
		>
			<!-- Section content -->
		</div>
	{/if}
</div>
```

### 3. Tab Navigation Pattern

**Pattern**: Tab-based navigation for panel sections  
**Use Case**: Multiple views within a single panel  

```svelte
<nav class="tab-nav" role="tablist">
	{#each tabs as tab}
		<button
			class="tab-button unified-button"
			class:active={activeTab === tab.id}
			on:click={() => activeTab = tab.id}
			role="tab"
			aria-selected={activeTab === tab.id}
			aria-controls="tab-panel-{tab.id}"
			id="tab-{tab.id}"
		>
			{tab.label}
		</button>
	{/each}
</nav>

<div class="tab-panels">
	{#each tabs as tab}
		<div
			id="tab-panel-{tab.id}"
			class="tab-panel"
			class:active={activeTab === tab.id}
			role="tabpanel"
			aria-labelledby="tab-{tab.id}"
			aria-hidden={activeTab !== tab.id}
		>
			<!-- Tab content -->
		</div>
	{/each}
</div>
```

---

## TypeScript Interface Patterns

### 1. Component Props Interface

**Pattern**: Strict typing for component properties  
**Use Case**: All Svelte component props  

```typescript
// Component Props Interface
interface ComponentProps {
	// Required props
	title: string;
	data: ComponentData[];
	
	// Optional props with defaults
	isVisible?: boolean;
	variant?: 'primary' | 'secondary' | 'tertiary';
	
	// Event handlers
	onAction?: (event: CustomEvent) => void;
	
	// Complex nested types
	config?: {
		theme: ThemeConfig;
		behavior: BehaviorSettings;
	};
}

// Supporting interfaces
interface ComponentData {
	id: string;
	label: string;
	value: unknown;
	metadata?: Record<string, unknown>;
}
```

### 2. Event Payload Interface

**Pattern**: Type-safe event dispatching  
**Use Case**: CustomEvent payloads in Svelte components  

```typescript
// Event payload interfaces
interface ComponentEvents {
	action: { type: string; payload: unknown };
	stateChange: { 
		previous: ComponentState; 
		current: ComponentState; 
	};
	error: { 
		code: string; 
		message: string; 
		details?: unknown; 
	};
}

// Usage in component
const dispatch = createEventDispatcher<ComponentEvents>();

// Type-safe dispatch
dispatch('action', { 
	type: 'user-interaction', 
	payload: { buttonId: 'submit' } 
});
```

### 3. API Response Interface

**Pattern**: Backend API response typing  
**Use Case**: HTTP client and WebSocket message typing  

```typescript
// Standard API response wrapper
interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};
	metadata: {
		timestamp: string;
		requestId: string;
		version: string;
	};
}

// Specific data interfaces
interface TaskResponse {
	id: string;
	title: string;
	status: TaskStatus;
	messages: Message[];
	createdAt: string;
	updatedAt: string;
}

// Usage with type assertion
const response: ApiResponse<TaskResponse> = await fetch('/api/tasks/123');
```

---

## CSS Styling Patterns

### 1. Glass Morphism Components

**Pattern**: Consistent glass morphism styling  
**Use Case**: All UI components and panels  

```css
/* Base glass morphism classes */
.glass-panel-primary {
	background: var(--glass-primary-bg);
	backdrop-filter: blur(12px);
	border: 1px solid var(--glass-border);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-soft);
}

.glass-panel-secondary {
	background: var(--glass-secondary-bg);
	backdrop-filter: blur(8px);
	border: 1px solid var(--glass-border-subtle);
	border-radius: var(--radius-md);
}

/* Interactive glass elements */
.glass-interactive {
	background: var(--glass-interactive-bg);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(34, 197, 94, 0.3);
	transition: var(--transition-smooth);
}

.glass-interactive:hover {
	background: var(--glass-interactive-hover-bg);
	border-color: rgba(34, 197, 94, 0.5);
	transform: translateY(-2px);
	box-shadow: var(--shadow-elevated);
}
```

### 2. Unified Button System

**Pattern**: Consistent button styling across all components  
**Use Case**: All interactive buttons and controls  

```css
/* Base unified button */
.unified-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 44px; /* Accessibility minimum */
	padding: var(--spacing-sm) var(--spacing-md);
	background: var(--glass-secondary-bg);
	backdrop-filter: blur(12px);
	border: 1px solid rgba(34, 197, 94, 0.3);
	border-radius: var(--radius-lg);
	color: var(--color-text-secondary);
	font-size: var(--font-size-sm);
	font-weight: 500;
	text-decoration: none;
	cursor: pointer;
	transition: var(--transition-smooth);
	
	/* Focus management */
	&:focus-visible {
		outline: 2px solid rgba(34, 197, 94, 0.6);
		outline-offset: 2px;
	}
	
	/* Hover effects */
	&:hover {
		background: var(--glass-interactive-hover-bg);
		border-color: rgba(34, 197, 94, 0.5);
		transform: translateY(-2px);
		box-shadow: var(--shadow-elevated);
	}
	
	/* Active state */
	&:active {
		transform: translateY(0);
		box-shadow: var(--shadow-soft);
	}
	
	/* Disabled state */
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
}

/* Button variants */
.unified-button.primary {
	background: rgba(34, 197, 94, 0.1);
	border-color: rgba(34, 197, 94, 0.4);
	color: var(--color-success);
}

.unified-button.mini {
	min-height: 28px;
	padding: var(--spacing-xs) var(--spacing-sm);
	font-size: var(--font-size-xs);
}
```

### 3. Responsive Grid System

**Pattern**: Flexible responsive layouts  
**Use Case**: Component internal layouts and grid systems  

```css
/* Responsive container */
.container {
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 var(--spacing-md);
}

/* Grid system */
.grid {
	display: grid;
	gap: var(--spacing-md);
	
	/* Auto-fit columns with minimum width */
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	
	/* Responsive breakpoints */
	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		gap: var(--spacing-sm);
	}
}

/* Flex utilities */
.flex {
	display: flex;
	gap: var(--spacing-sm);
}

.flex-col {
	flex-direction: column;
}

.flex-center {
	align-items: center;
	justify-content: center;
}

.flex-between {
	justify-content: space-between;
	align-items: center;
}
```

---

## State Management Patterns

### 1. Local Component State

**Pattern**: Reactive state management within components  
**Use Case**: Component-specific state that doesn't need global access  

```typescript
// State interface
interface ComponentState {
	isLoading: boolean;
	data: ComponentData[];
	error: string | null;
	ui: {
		expandedSections: Record<string, boolean>;
		activeTab: string;
		filters: FilterState;
	};
}

// State initialization
let state: ComponentState = {
	isLoading: false,
	data: [],
	error: null,
	ui: {
		expandedSections: {},
		activeTab: 'default',
		filters: {}
	}
};

// State update functions
function updateState(updates: Partial<ComponentState>) {
	state = { ...state, ...updates };
}

function updateUIState(updates: Partial<ComponentState['ui']>) {
	state.ui = { ...state.ui, ...updates };
}

// Reactive statements
$: isReady = !state.isLoading && state.error === null;
$: filteredData = state.data.filter(applyFilters);
```

### 2. Store-based State Management

**Pattern**: Svelte stores for shared state  
**Use Case**: Global application state, theme management, user preferences  

```typescript
// stores/appState.ts
import { writable, derived } from 'svelte/store';

// Base store
export const appState = writable({
	user: null as User | null,
	theme: 'auto' as ThemeMode,
	notifications: [] as Notification[]
});

// Derived stores
export const isAuthenticated = derived(
	appState,
	($state) => $state.user !== null
);

export const notificationCount = derived(
	appState,
	($state) => $state.notifications.filter(n => !n.read).length
);

// Store actions
export const appActions = {
	setUser: (user: User | null) => {
		appState.update(state => ({ ...state, user }));
	},
	
	addNotification: (notification: Omit<Notification, 'id'>) => {
		appState.update(state => ({
			...state,
			notifications: [
				...state.notifications,
				{ ...notification, id: generateId() }
			]
		}));
	}
};
```

---

## Event Handling Patterns

### 1. Component Event Communication

**Pattern**: Parent-child component communication  
**Use Case**: Data flow between nested components  

```svelte
<!-- Parent Component -->
<script lang="ts">
	import ChildComponent from './ChildComponent.svelte';
	
	function handleChildAction(event: CustomEvent<ActionPayload>) {
		const { type, data } = event.detail;
		
		switch (type) {
			case 'save':
				handleSave(data);
				break;
			case 'cancel':
				handleCancel();
				break;
			default:
				console.warn('Unknown action type:', type);
		}
	}
</script>

<ChildComponent on:action={handleChildAction} />

<!-- Child Component -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher<{
		action: ActionPayload;
	}>();
	
	function emitAction(type: string, data?: unknown) {
		dispatch('action', { type, data });
	}
</script>

<button on:click={() => emitAction('save', formData)}>
	Save
</button>
```

### 2. Keyboard Event Handling

**Pattern**: Accessible keyboard navigation  
**Use Case**: Interactive components requiring keyboard support  

```svelte
<script lang="ts">
	function handleKeydown(event: KeyboardEvent) {
		// Handle specific key combinations
		switch (event.key) {
			case 'Escape':
				event.preventDefault();
				handleClose();
				break;
				
			case 'Enter':
			case ' ': // Space
				if (event.target === button) {
					event.preventDefault();
					handleAction();
				}
				break;
				
			case 'ArrowDown':
				event.preventDefault();
				focusNext();
				break;
				
			case 'ArrowUp':
				event.preventDefault();
				focusPrevious();
				break;
		}
	}
	
	// Focus management
	function focusNext() {
		const focusableElements = container.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
		const nextIndex = (currentIndex + 1) % focusableElements.length;
		focusableElements[nextIndex]?.focus();
	}
</script>

<div 
	bind:this={container}
	on:keydown={handleKeydown}
	role="application"
	aria-label="Interactive Component"
>
	<!-- Interactive content -->
</div>
```

---

## Accessibility Patterns

### 1. ARIA Landmark Structure

**Pattern**: Semantic HTML with proper ARIA landmarks  
**Use Case**: All major UI sections and components  

```svelte
<main class="app-main" role="main">
	<aside 
		class="sidebar" 
		role="complementary" 
		aria-label="Development Tools"
	>
		<nav role="navigation" aria-label="Tool Categories">
			<!-- Navigation content -->
		</nav>
		
		<section 
			role="region" 
			aria-labelledby="quick-actions-heading"
		>
			<h2 id="quick-actions-heading" class="sr-only">Quick Actions</h2>
			<!-- Quick actions content -->
		</section>
	</aside>
	
	<section 
		class="content-area" 
		role="region" 
		aria-label="Main Content"
	>
		<!-- Main content -->
	</section>
	
	<aside 
		class="status-panel" 
		role="complementary" 
		aria-label="Development Status"
	>
		<!-- Status information -->
	</aside>
</main>
```

### 2. Form Accessibility Pattern

**Pattern**: Accessible form controls with proper labeling  
**Use Case**: All form inputs and interactive controls  

```svelte
<form on:submit={handleSubmit} novalidate>
	<div class="form-group">
		<label for="task-title" class="form-label required">
			Task Title
		</label>
		<input
			id="task-title"
			type="text"
			bind:value={taskTitle}
			class="form-input"
			aria-required="true"
			aria-invalid={titleError ? 'true' : 'false'}
			aria-describedby={titleError ? 'title-error' : 'title-help'}
		/>
		<div id="title-help" class="form-help">
			Enter a descriptive title for your task
		</div>
		{#if titleError}
			<div id="title-error" class="form-error" role="alert">
				{titleError}
			</div>
		{/if}
	</div>
	
	<fieldset class="form-fieldset">
		<legend class="form-legend">AI Agent Selection</legend>
		<div class="checkbox-group">
			<label class="checkbox-label">
				<input
					type="checkbox"
					bind:checked={useGemini}
					aria-describedby="gemini-desc"
				/>
				<span class="checkbox-text">Google Gemini</span>
			</label>
			<div id="gemini-desc" class="checkbox-description">
				Use Google Gemini for natural language processing
			</div>
		</div>
	</fieldset>
</form>
```

---

## Performance Patterns

### 1. Lazy Loading Components

**Pattern**: Dynamic component imports for code splitting  
**Use Case**: Large components or rarely used features  

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	
	let LazyComponent: any = null;
	let isLoading = false;
	let shouldLoad = false;
	
	async function loadComponent() {
		if (LazyComponent || isLoading) return;
		
		isLoading = true;
		try {
			const module = await import('./LazyComponent.svelte');
			LazyComponent = module.default;
		} catch (error) {
			console.error('Failed to load component:', error);
		} finally {
			isLoading = false;
		}
	}
	
	// Load when needed
	$: if (shouldLoad && !LazyComponent) {
		loadComponent();
	}
</script>

{#if shouldLoad}
	{#if LazyComponent}
		<svelte:component this={LazyComponent} {...componentProps} />
	{:else if isLoading}
		<div class="loading-placeholder">Loading...</div>
	{:else}
		<div class="error-placeholder">Failed to load component</div>
	{/if}
{/if}
```

### 2. Virtual Scrolling Pattern

**Pattern**: Efficient rendering of large lists  
**Use Case**: Message lists, data tables, large datasets  

```svelte
<script lang="ts">
	export let items: ListItem[] = [];
	export let itemHeight = 50;
	export let containerHeight = 400;
	
	let scrollTop = 0;
	let containerElement: HTMLElement;
	
	// Calculate visible range
	$: startIndex = Math.floor(scrollTop / itemHeight);
	$: endIndex = Math.min(
		startIndex + Math.ceil(containerHeight / itemHeight) + 1,
		items.length
	);
	$: visibleItems = items.slice(startIndex, endIndex);
	$: totalHeight = items.length * itemHeight;
	$: offsetY = startIndex * itemHeight;
	
	function handleScroll(event: Event) {
		scrollTop = (event.target as HTMLElement).scrollTop;
	}
</script>

<div 
	bind:this={containerElement}
	class="virtual-scroll-container"
	style="height: {containerHeight}px; overflow-y: auto;"
	on:scroll={handleScroll}
>
	<div 
		class="virtual-scroll-spacer"
		style="height: {totalHeight}px; position: relative;"
	>
		<div 
			class="virtual-scroll-content"
			style="transform: translateY({offsetY}px);"
		>
			{#each visibleItems as item, index (item.id)}
				<div 
					class="virtual-scroll-item"
					style="height: {itemHeight}px;"
				>
					<!-- Item content -->
				</div>
			{/each}
		</div>
	</div>
</div>
```

---

## Testing Patterns

### 1. Component Testing Pattern

**Pattern**: Comprehensive Svelte component testing  
**Use Case**: Unit tests for all UI components  

```typescript
// ComponentName.test.ts
import { render, fireEvent, screen } from '@testing-library/svelte';
import { vi } from 'vitest';
import ComponentName from './ComponentName.svelte';

describe('ComponentName', () => {
	// Test props and rendering
	it('renders with default props', () => {
		render(ComponentName);
		
		expect(screen.getByRole('button')).toBeInTheDocument();
		expect(screen.getByText('Default Text')).toBeInTheDocument();
	});
	
	// Test user interactions
	it('handles click events', async () => {
		const mockHandler = vi.fn();
		
		render(ComponentName, {
			props: { onAction: mockHandler }
		});
		
		const button = screen.getByRole('button');
		await fireEvent.click(button);
		
		expect(mockHandler).toHaveBeenCalledWith(
			expect.objectContaining({
				detail: expect.any(Object)
			})
		);
	});
	
	// Test accessibility
	it('meets accessibility requirements', () => {
		render(ComponentName);
		
		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('aria-label');
		expect(button).not.toHaveAttribute('aria-hidden');
	});
	
	// Test state changes
	it('updates state correctly', async () => {
		render(ComponentName, {
			props: { initialValue: 'test' }
		});
		
		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: 'new value' } });
		
		expect(input).toHaveValue('new value');
	});
});
```

### 2. Integration Testing Pattern

**Pattern**: Component integration and API testing  
**Use Case**: Testing component interactions and data flow  

```typescript
// integration.test.ts
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import App from '../App.svelte';

// Mock API calls
vi.mock('../lib/api', () => ({
	fetchTasks: vi.fn(() => Promise.resolve({ data: [] })),
	createTask: vi.fn(() => Promise.resolve({ data: { id: '1' } }))
}));

describe('Integration Tests', () => {
	it('creates and displays a new task', async () => {
		render(App);
		
		// Find and fill form
		const titleInput = screen.getByLabelText(/task title/i);
		const submitButton = screen.getByRole('button', { name: /create/i });
		
		await fireEvent.input(titleInput, { 
			target: { value: 'New Task' } 
		});
		await fireEvent.click(submitButton);
		
		// Wait for API call and UI update
		await waitFor(() => {
			expect(screen.getByText('New Task')).toBeInTheDocument();
		});
	});
});
```

---

## Usage Guidelines

### When to Use These Patterns

1. **Always use** for new component development
2. **Reference first** before implementing similar functionality  
3. **Adapt as needed** for specific use cases
4. **Update patterns** when establishing new conventions
5. **Document deviations** when patterns don't fit requirements

### Pattern Selection Criteria

- **Consistency**: Choose patterns that align with existing codebase
- **Accessibility**: Prioritize patterns that enhance accessibility  
- **Performance**: Consider performance implications of pattern choice
- **Maintainability**: Select patterns that are easy to understand and modify
- **Scalability**: Ensure patterns work well as the application grows

### Contributing New Patterns

1. Identify common, reusable implementation patterns
2. Document with clear examples and use cases
3. Include accessibility and performance considerations
4. Test patterns in real components
5. Update this library with new proven patterns

---

**Pattern Update Protocol**: This library should be updated whenever new patterns emerge or existing patterns are refined. All patterns should be validated in real components before inclusion. 
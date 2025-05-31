# Error Pattern Prevention Guide - Synapse-Hub

**Purpose**: Common AI coding errors and prevention strategies  
**Last Updated**: Phase 1 Implementation - Reference Systems  
**Usage**: Reference guide to prevent common mistakes in AI-generated code

---

## Error Categories

1. [TypeScript & Type Safety Errors](#typescript--type-safety-errors)
2. [Svelte-Specific Errors](#svelte-specific-errors)
3. [Accessibility Implementation Errors](#accessibility-implementation-errors)
4. [CSS & Styling Errors](#css--styling-errors)
5. [Event Handling Errors](#event-handling-errors)
6. [State Management Errors](#state-management-errors)
7. [Performance-Related Errors](#performance-related-errors)
8. [Testing & Validation Errors](#testing--validation-errors)

---

## TypeScript & Type Safety Errors

### ❌ Error: Missing Interface Exports

```typescript
// WRONG - Interface not exported
interface ComponentProps {
  title: string;
  data: unknown[];
}

// Missing export means other files can't use this interface
```

**✅ Correct Pattern**:
```typescript
// RIGHT - Always export interfaces
export interface ComponentProps {
  title: string;
  data: ComponentData[];
}

export interface ComponentData {
  id: string;
  // ... other properties
}
```

**Prevention**: Always export interfaces that might be used by other components or files.

---

### ❌ Error: Loose Type Definitions

```typescript
// WRONG - Using 'any' or loose typing
export let data: any[] = [];
export let onAction: Function;

function handleEvent(event: any) {
  // Type safety lost
}
```

**✅ Correct Pattern**:
```typescript
// RIGHT - Strict typing with proper interfaces
export let data: ComponentData[] = [];
export let onAction: (event: CustomEvent<ActionPayload>) => void;

function handleEvent(event: CustomEvent<ActionPayload>) {
  const { type, payload } = event.detail; // Type-safe access
}
```

**Prevention**: Define specific interfaces for all data structures and event payloads.

---

### ❌ Error: Missing Null/Undefined Checks

```typescript
// WRONG - No null checking
function processItem(item: Item | null) {
  return item.title.toUpperCase(); // Runtime error if item is null
}
```

**✅ Correct Pattern**:
```typescript
// RIGHT - Proper null checking
function processItem(item: Item | null): string {
  if (!item) return '';
  return item.title?.toUpperCase() ?? '';
}

// Or with optional chaining
function processItemSafe(item: Item | null): string {
  return item?.title?.toUpperCase() ?? '';
}
```

**Prevention**: Always handle null/undefined cases explicitly, especially with optional properties.

---

## Svelte-Specific Errors

### ❌ Error: Incorrect Reactive Statement Usage

```svelte
<script lang="ts">
  let items = [];
  let filteredItems = [];
  
  // WRONG - Not reactive, won't update when items change
  function updateFiltered() {
    filteredItems = items.filter(item => item.active);
  }
</script>
```

**✅ Correct Pattern**:
```svelte
<script lang="ts">
  let items: Item[] = [];
  let searchQuery = '';
  
  // RIGHT - Reactive statement updates automatically
  $: filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
</script>
```

**Prevention**: Use reactive statements (`$:`) for derived values that depend on other reactive variables.

---

### ❌ Error: Improper Event Dispatcher Typing

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // WRONG - No type safety for events
  const dispatch = createEventDispatcher();
  
  function handleClick() {
    dispatch('action', { someData: 'value' }); // No type checking
  }
</script>
```

**✅ Correct Pattern**:
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // RIGHT - Type-safe event dispatcher
  interface ComponentEvents {
    action: { type: string; data: unknown };
    stateChange: { expanded: boolean };
  }
  
  const dispatch = createEventDispatcher<ComponentEvents>();
  
  function handleClick() {
    dispatch('action', { type: 'click', data: 'value' }); // Type-safe
  }
</script>
```

**Prevention**: Always define event interfaces for type-safe event dispatching.

---

### ❌ Error: Missing Component Cleanup

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  
  onMount(() => {
    // WRONG - No cleanup for intervals/listeners
    const interval = setInterval(() => {
      console.log('Update');
    }, 1000);
    
    document.addEventListener('click', handleClick);
  });
</script>
```

**✅ Correct Pattern**:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  
  onMount(() => {
    // RIGHT - Proper cleanup
    const interval = setInterval(() => {
      console.log('Update');
    }, 1000);
    
    document.addEventListener('click', handleClick);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleClick);
    };
  });
</script>
```

**Prevention**: Always return cleanup functions from `onMount` to prevent memory leaks.

---

## Accessibility Implementation Errors

### ❌ Error: Missing ARIA Labels

```svelte
<!-- WRONG - No accessibility context -->
<button on:click={handleAction}>
  +
</button>

<div class="expandable-section">
  <button on:click={toggle}>Section Title</button>
  {#if expanded}
    <div>Content here</div>
  {/if}
</div>
```

**✅ Correct Pattern**:
```svelte
<!-- RIGHT - Comprehensive accessibility -->
<button 
  on:click={handleAction}
  aria-label="Add new item"
  class="unified-button"
>
  Add Item
</button>

<div class="expandable-section">
  <button 
    on:click={toggle}
    aria-expanded={expanded}
    aria-controls="section-content"
    class="section-header unified-button"
  >
    Section Title
  </button>
  {#if expanded}
    <div id="section-content" role="region">
      Content here
    </div>
  {/if}
</div>
```

**Prevention**: Always include proper ARIA attributes for interactive elements and dynamic content.

---

### ❌ Error: Poor Focus Management

```svelte
<script lang="ts">
  let showDialog = false;
  
  function openDialog() {
    showDialog = true;
    // WRONG - No focus management
  }
</script>

{#if showDialog}
  <div class="dialog">
    <button on:click={() => showDialog = false}>Close</button>
    Content here
  </div>
{/if}
```

**✅ Correct Pattern**:
```svelte
<script lang="ts">
  let showDialog = false;
  let dialogElement: HTMLElement;
  
  function openDialog() {
    showDialog = true;
    // RIGHT - Focus management
    requestAnimationFrame(() => {
      const firstFocusable = dialogElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      (firstFocusable as HTMLElement)?.focus();
    });
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      showDialog = false;
    }
  }
</script>

{#if showDialog}
  <div 
    class="dialog"
    bind:this={dialogElement}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
  >
    <h2 id="dialog-title">Dialog Title</h2>
    <button on:click={() => showDialog = false}>Close</button>
    Content here
  </div>
{/if}
```

**Prevention**: Always manage focus for dynamic content and modal dialogs.

---

## CSS & Styling Errors

### ❌ Error: Hardcoded Values Instead of CSS Variables

```css
/* WRONG - Hardcoded values break theming */
.component {
  background: #1a1a1a;
  color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}
```

**✅ Correct Pattern**:
```css
/* RIGHT - Use CSS custom properties */
.component {
  background: var(--glass-primary-bg);
  color: var(--color-text-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  transition: var(--transition-smooth);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
}
```

**Prevention**: Always use CSS custom properties for colors, spacing, and timing values.

---

### ❌ Error: Missing Responsive Design

```css
/* WRONG - No responsive considerations */
.panel {
  display: grid;
  grid-template-columns: 300px 1fr 250px;
  gap: 16px;
}
```

**✅ Correct Pattern**:
```css
/* RIGHT - Responsive design with mobile-first approach */
.panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);
}

@media (min-width: 768px) {
  .panel {
    grid-template-columns: 250px 1fr;
    gap: var(--spacing-md);
  }
}

@media (min-width: 1024px) {
  .panel {
    grid-template-columns: 300px 1fr 250px;
  }
}
```

**Prevention**: Always implement mobile-first responsive design with appropriate breakpoints.

---

### ❌ Error: Missing Reduced Motion Support

```css
/* WRONG - No reduced motion consideration */
.animated-element {
  transition: transform 0.3s ease, opacity 0.3s ease;
  animation: slideIn 0.5s ease-out;
}
```

**✅ Correct Pattern**:
```css
/* RIGHT - Respect user motion preferences */
.animated-element {
  transition: var(--transition-smooth);
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.animated-element {
  animation: slideIn 0.5s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    transition: none;
    animation: none;
  }
}
```

**Prevention**: Always include `prefers-reduced-motion` support for animations and transitions.

---

## Event Handling Errors

### ❌ Error: Missing Event Type Safety

```svelte
<script lang="ts">
  // WRONG - No type safety for event handlers
  function handleInput(event) {
    const value = event.target.value; // 'event' is any
  }
  
  function handleCustomEvent(event) {
    const data = event.detail.someProperty; // No type checking
  }
</script>
```

**✅ Correct Pattern**:
```svelte
<script lang="ts">
  // RIGHT - Type-safe event handlers
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value; // Type-safe
  }
  
  function handleCustomEvent(event: CustomEvent<{ someProperty: string }>) {
    const data = event.detail.someProperty; // Type-safe
  }
</script>
```

**Prevention**: Always type event handlers with specific event types.

---

### ❌ Error: Improper Keyboard Event Handling

```svelte
<script lang="ts">
  // WRONG - Only handles click events
  function handleSelect(item) {
    selectedItem = item;
  }
</script>

<div class="item" on:click={() => handleSelect(item)}>
  {item.title}
</div>
```

**✅ Correct Pattern**:
```svelte
<script lang="ts">
  // RIGHT - Supports both mouse and keyboard interaction
  function handleSelect(item: Item) {
    selectedItem = item;
  }
  
  function handleKeydown(event: KeyboardEvent, item: Item) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(item);
    }
  }
</script>

<div 
  class="item"
  tabindex="0"
  role="button"
  on:click={() => handleSelect(item)}
  on:keydown={(e) => handleKeydown(e, item)}
  aria-label="Select {item.title}"
>
  {item.title}
</div>
```

**Prevention**: Always support both mouse and keyboard interactions for interactive elements.

---

## State Management Errors

### ❌ Error: Direct Store Mutation

```typescript
// WRONG - Mutating store state directly
import { appState } from './stores';
import { get } from 'svelte/store';

function addItem(item) {
  const state = get(appState);
  state.items.push(item); // Direct mutation - won't trigger reactivity
}
```

**✅ Correct Pattern**:
```typescript
// RIGHT - Immutable state updates
import { appState } from './stores';

function addItem(item: Item) {
  appState.update(state => ({
    ...state,
    items: [...state.items, item] // Immutable update
  }));
}
```

**Prevention**: Always use immutable updates for store state changes.

---

### ❌ Error: Missing Store Unsubscription

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from './stores';
  
  onMount(() => {
    // WRONG - No unsubscription, memory leak
    appState.subscribe(state => {
      console.log('State updated:', state);
    });
  });
</script>
```

**✅ Correct Pattern**:
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { appState } from './stores';
  
  let unsubscribe: (() => void) | undefined;
  
  onMount(() => {
    // RIGHT - Proper subscription management
    unsubscribe = appState.subscribe(state => {
      console.log('State updated:', state);
    });
  });
  
  onDestroy(() => {
    unsubscribe?.();
  });
  
  // OR use the $ reactive statement for automatic subscription
  $: console.log('State updated:', $appState);
</script>
```

**Prevention**: Always clean up store subscriptions or use `$` reactive statements for automatic management.

---

## Performance-Related Errors

### ❌ Error: Expensive Operations in Reactive Statements

```svelte
<script lang="ts">
  let items = [];
  let searchQuery = '';
  
  // WRONG - Expensive operation runs on every change
  $: filteredItems = items.filter(item => {
    // Complex, slow filtering logic
    return performExpensiveCheck(item, searchQuery);
  });
</script>
```

**✅ Correct Pattern**:
```svelte
<script lang="ts">
  import { debounce } from 'lodash-es';
  
  let items: Item[] = [];
  let searchQuery = '';
  let filteredItems: Item[] = [];
  
  // RIGHT - Debounced expensive operations
  const debouncedFilter = debounce((query: string) => {
    filteredItems = items.filter(item => 
      performExpensiveCheck(item, query)
    );
  }, 300);
  
  $: debouncedFilter(searchQuery);
  $: if (items) debouncedFilter(searchQuery); // Re-filter when items change
</script>
```

**Prevention**: Debounce expensive operations and consider using Web Workers for heavy computations.

---

### ❌ Error: Missing Virtual Scrolling for Large Lists

```svelte
<!-- WRONG - Renders all items, poor performance with large lists -->
<div class="item-list">
  {#each allItems as item}
    <div class="item">{item.title}</div>
  {/each}
</div>
```

**✅ Correct Pattern**:
```svelte
<script lang="ts">
  export let items: Item[] = [];
  export let itemHeight = 50;
  export let containerHeight = 400;
  
  let scrollTop = 0;
  
  // Virtual scrolling calculation
  $: startIndex = Math.floor(scrollTop / itemHeight);
  $: endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  $: visibleItems = items.slice(startIndex, endIndex);
  $: totalHeight = items.length * itemHeight;
  $: offsetY = startIndex * itemHeight;
</script>

<!-- RIGHT - Virtual scrolling for performance -->
<div 
  class="virtual-container"
  style="height: {containerHeight}px; overflow-y: auto;"
  on:scroll={(e) => scrollTop = e.currentTarget.scrollTop}
>
  <div style="height: {totalHeight}px; position: relative;">
    <div style="transform: translateY({offsetY}px);">
      {#each visibleItems as item (item.id)}
        <div class="item" style="height: {itemHeight}px;">
          {item.title}
        </div>
      {/each}
    </div>
  </div>
</div>
```

**Prevention**: Use virtual scrolling for lists with more than 100 items.

---

## Testing & Validation Errors

### ❌ Error: Incomplete Test Coverage

```typescript
// WRONG - Only tests happy path
describe('Component', () => {
  it('renders correctly', () => {
    render(Component);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });
});
```

**✅ Correct Pattern**:
```typescript
// RIGHT - Comprehensive test coverage
describe('Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(Component);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
    
    it('renders with custom props', () => {
      render(Component, { props: { title: 'Custom' } });
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });
  
  describe('User Interactions', () => {
    it('handles click events', async () => {
      const mockHandler = vi.fn();
      render(Component, { props: { onClick: mockHandler } });
      
      await fireEvent.click(screen.getByRole('button'));
      expect(mockHandler).toHaveBeenCalled();
    });
  });
  
  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(Component);
      expect(screen.getByRole('button')).toHaveAttribute('aria-label');
    });
  });
  
  describe('Edge Cases', () => {
    it('handles empty data', () => {
      render(Component, { props: { data: [] } });
      expect(screen.getByText('No items')).toBeInTheDocument();
    });
  });
});
```

**Prevention**: Test rendering, interactions, accessibility, and edge cases for every component.

---

### ❌ Error: Missing Accessibility Testing

```typescript
// WRONG - No accessibility validation
describe('Component', () => {
  it('works correctly', () => {
    render(Component);
    fireEvent.click(screen.getByText('Button'));
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

**✅ Correct Pattern**:
```typescript
// RIGHT - Include accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Component Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(Component);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('supports keyboard navigation', async () => {
    render(Component);
    const button = screen.getByRole('button');
    
    button.focus();
    expect(document.activeElement).toBe(button);
    
    await fireEvent.keyDown(button, { key: 'Enter' });
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
  
  it('has proper ARIA attributes', () => {
    render(Component);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-label');
    expect(button).not.toHaveAttribute('aria-hidden', 'true');
  });
});
```

**Prevention**: Always include automated accessibility testing and manual keyboard navigation testing.

---

## Common Anti-Patterns to Avoid

### 1. The "Magic String" Anti-Pattern

```typescript
// WRONG - Magic strings
const STATUS_LOADING = 'loading';
const STATUS_ERROR = 'error';

if (status === 'loadng') { // Typo won't be caught
  // Handle loading
}
```

**✅ Use Enums or Const Assertions**:
```typescript
// RIGHT - Type-safe constants
const STATUS = {
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success'
} as const;

type Status = typeof STATUS[keyof typeof STATUS];

if (status === STATUS.LOADING) { // Type-safe
  // Handle loading
}
```

### 2. The "Everything is Optional" Anti-Pattern

```typescript
// WRONG - Everything optional
interface ComponentProps {
  title?: string;
  data?: Item[];
  onAction?: (action: string) => void;
  className?: string;
}
```

**✅ Be Explicit About Requirements**:
```typescript
// RIGHT - Clear required vs optional
interface ComponentProps {
  // Required props
  title: string;
  data: Item[];
  
  // Optional props with defaults
  className?: string;
  variant?: 'primary' | 'secondary';
  
  // Optional callbacks
  onAction?: (action: ActionType) => void;
}
```

### 3. The "One Size Fits All" Anti-Pattern

```svelte
<!-- WRONG - Monolithic component -->
<div class="mega-component">
  <!-- Header logic -->
  <!-- Navigation logic -->
  <!-- Content logic -->
  <!-- Footer logic -->
  <!-- Modal logic -->
  <!-- Everything in one component -->
</div>
```

**✅ Component Composition**:
```svelte
<!-- RIGHT - Composed components -->
<div class="app-layout">
  <AppHeader {user} on:menuToggle />
  <AppNavigation {menuOpen} />
  <main>
    <slot />
  </main>
  <AppFooter />
</div>

{#if showModal}
  <Modal on:close={() => showModal = false}>
    <slot name="modal" />
  </Modal>
{/if}
```

---

## Error Prevention Checklist

### Before Implementing New Components

- [ ] **Type Safety**: All interfaces defined and exported
- [ ] **Accessibility**: ARIA attributes and keyboard navigation planned
- [ ] **Responsive Design**: Mobile-first approach considered
- [ ] **Performance**: Virtual scrolling for large datasets planned
- [ ] **Error Handling**: Null checks and edge cases identified

### During Implementation

- [ ] **CSS Variables**: Using custom properties instead of hardcoded values
- [ ] **Event Types**: All event handlers properly typed
- [ ] **Cleanup**: Memory leaks prevented (intervals, listeners)
- [ ] **Reactivity**: Using reactive statements appropriately
- [ ] **Focus Management**: Interactive elements support keyboard navigation

### Testing Phase

- [ ] **Unit Tests**: Rendering, interactions, and edge cases covered
- [ ] **Accessibility Tests**: Automated axe testing and manual keyboard testing
- [ ] **Type Checking**: No TypeScript errors in strict mode
- [ ] **Performance**: Large lists and expensive operations optimized
- [ ] **Browser Testing**: Cross-browser compatibility verified

### Code Review

- [ ] **Pattern Consistency**: Follows established project patterns
- [ ] **Documentation**: Implementation breadcrumbs added
- [ ] **Error Boundaries**: Graceful error handling implemented
- [ ] **Progressive Enhancement**: Works without JavaScript
- [ ] **Theme Support**: Respects user preferences (motion, contrast)

---

## Quick Reference Commands

### TypeScript Validation
```bash
# Check for type errors
npm run type-check

# Run with strict mode
npx tsc --noEmit --strict
```

### Accessibility Testing
```bash
# Run accessibility tests
npm run test:a11y

# Manual accessibility check
npx @axe-core/cli http://localhost:5173
```

### Performance Testing
```bash
# Run performance tests
npm run test:perf

# Lighthouse audit
npx lighthouse http://localhost:5173 --output html
```

### Pattern Validation
```bash
# Check code patterns
npm run lint

# Prettier formatting
npm run format

# Check for unused dependencies
npx depcheck
```

---

**Error Prevention Protocol**: This guide should be consulted before implementing new features and updated when new error patterns are identified. Regular review of this guide helps maintain code quality and prevents regression of known issues. 
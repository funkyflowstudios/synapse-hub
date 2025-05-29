<script lang="ts">
  import { createPaletteStore, type ColorPalette } from '$lib/palette';
  
  // Create reactive palette store
  const paletteStore = createPaletteStore();
  
  // Reactive values
  $: currentPalette = $paletteStore;
  $: availablePalettes = paletteStore.getAvailablePalettes();
  
  // Component state
  let isOpen = false;
  
  /**
   * Handle palette selection
   */
  function selectPalette(palette: ColorPalette | null) {
    paletteStore.setPalette(palette);
    isOpen = false;
  }
  
  /**
   * Toggle palette selector dropdown
   */
  function toggleSelector() {
    isOpen = !isOpen;
  }
  
  /**
   * Close selector when clicking outside
   */
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.palette-selector')) {
      isOpen = false;
    }
  }
  
  /**
   * Get mood icon for palette
   */
  function getMoodIcon(mood: string): string {
    const icons = {
      energetic: '⚡',
      calm: '🌊',
      focused: '🎯',
      creative: '🎨',
      professional: '💼'
    };
    return icons[mood as keyof typeof icons] || '🎨';
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="palette-selector" class:palette-selector--open={isOpen}>
  <!-- Current palette display / trigger -->
  <button 
    class="palette-selector__trigger"
    on:click={toggleSelector}
    aria-label="Select color palette"
    aria-expanded={isOpen}
  >
    <div class="palette-selector__current">
      {#if currentPalette}
        <div class="palette-selector__colors">
          <div 
            class="palette-selector__color-dot" 
            style="background-color: {currentPalette.primary};"
          ></div>
          <div 
            class="palette-selector__color-dot" 
            style="background-color: {currentPalette.secondary};"
          ></div>
          <div 
            class="palette-selector__color-dot" 
            style="background-color: {currentPalette.accent};"
          ></div>
          {#if currentPalette.highlight}
            <div 
              class="palette-selector__color-dot" 
              style="background-color: {currentPalette.highlight};"
            ></div>
          {/if}
        </div>
        <span class="palette-selector__label">{currentPalette.name}</span>
      {:else}
        <div class="palette-selector__colors">
          <div class="palette-selector__color-dot palette-selector__color-dot--default"></div>
          <div class="palette-selector__color-dot palette-selector__color-dot--default"></div>
          <div class="palette-selector__color-dot palette-selector__color-dot--default"></div>
        </div>
        <span class="palette-selector__label">Default Theme</span>
      {/if}
    </div>
    
    <svg 
      class="palette-selector__chevron" 
      class:palette-selector__chevron--open={isOpen}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2"
    >
      <polyline points="6,9 12,15 18,9"></polyline>
    </svg>
  </button>
  
  <!-- Palette dropdown -->
  {#if isOpen}
    <div class="palette-selector__dropdown">
      <!-- Default/None option -->
      <button 
        class="palette-selector__option"
        class:palette-selector__option--active={!currentPalette}
        on:click={() => selectPalette(null)}
      >
        <div class="palette-selector__option-colors">
          <div class="palette-selector__color-dot palette-selector__color-dot--default"></div>
          <div class="palette-selector__color-dot palette-selector__color-dot--default"></div>
          <div class="palette-selector__color-dot palette-selector__color-dot--default"></div>
        </div>
        <div class="palette-selector__option-info">
          <span class="palette-selector__option-name">Default Theme</span>
          <span class="palette-selector__option-description">System colors only</span>
        </div>
      </button>
      
      <!-- Available palettes -->
      {#each availablePalettes as palette (palette.id)}
        <button 
          class="palette-selector__option"
          class:palette-selector__option--active={currentPalette?.id === palette.id}
          on:click={() => selectPalette(palette)}
        >
          <div class="palette-selector__option-colors">
            <div 
              class="palette-selector__color-dot" 
              style="background-color: {palette.primary};"
            ></div>
            <div 
              class="palette-selector__color-dot" 
              style="background-color: {palette.secondary};"
            ></div>
            <div 
              class="palette-selector__color-dot" 
              style="background-color: {palette.accent};"
            ></div>
            {#if palette.highlight}
              <div 
                class="palette-selector__color-dot" 
                style="background-color: {palette.highlight};"
              ></div>
            {/if}
          </div>
          <div class="palette-selector__option-info">
            <span class="palette-selector__option-name">
              {getMoodIcon(palette.mood)} {palette.name}
            </span>
            <span class="palette-selector__option-description">{palette.description}</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .palette-selector {
    position: relative;
    display: inline-block;
  }
  
  .palette-selector__trigger {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-surface-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    transition: all var(--transition-smooth);
    cursor: pointer;
    min-width: 200px;
    
    backdrop-filter: var(--backdrop-blur);
    box-shadow: var(--shadow-elevation-low);
  }
  
  .palette-selector__trigger:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-border-secondary);
    color: var(--color-text-primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-elevation-medium);
  }
  
  .palette-selector--open .palette-selector__trigger {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .palette-selector__current {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
  }
  
  .palette-selector__colors {
    display: flex;
    gap: 2px;
  }
  
  .palette-selector__color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid var(--color-border-muted);
    transition: transform var(--transition-fast);
  }
  
  .palette-selector__color-dot--default {
    background: var(--color-border-secondary);
  }
  
  .palette-selector__label {
    font-weight: var(--font-weight-medium);
    letter-spacing: -0.01em;
  }
  
  .palette-selector__chevron {
    width: 16px;
    height: 16px;
    color: var(--color-text-tertiary);
    transition: transform var(--transition-smooth);
  }
  
  .palette-selector__chevron--open {
    transform: rotate(180deg);
  }
  
  .palette-selector__dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: var(--spacing-xs);
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-elevation-high);
    backdrop-filter: var(--backdrop-blur);
    overflow: hidden;
    z-index: 50;
    
    /* Smooth dropdown animation */
    animation: paletteDropdownIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes paletteDropdownIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .palette-selector__option {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    width: 100%;
    padding: var(--spacing-md);
    background: transparent;
    border: none;
    text-align: left;
    transition: background-color var(--transition-fast);
    cursor: pointer;
  }
  
  .palette-selector__option:hover {
    background: var(--color-surface-hover);
  }
  
  .palette-selector__option--active {
    background: var(--color-surface-pressed);
  }
  
  .palette-selector__option:not(:last-child) {
    border-bottom: 1px solid var(--color-border-muted);
  }
  
  .palette-selector__option-colors {
    display: flex;
    gap: 3px;
    flex-shrink: 0;
  }
  
  .palette-selector__option-colors .palette-selector__color-dot {
    width: 14px;
    height: 14px;
  }
  
  .palette-selector__option:hover .palette-selector__color-dot {
    transform: scale(1.1);
  }
  
  .palette-selector__option-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  
  .palette-selector__option-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    line-height: var(--line-height-tight);
  }
  
  .palette-selector__option-description {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
    line-height: var(--line-height-snug);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  /* Reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .palette-selector__trigger,
    .palette-selector__chevron,
    .palette-selector__color-dot,
    .palette-selector__option {
      transition: none;
    }
    
    .palette-selector__trigger:hover {
      transform: none;
    }
    
    .palette-selector__dropdown {
      animation: none;
    }
    
    .palette-selector__option:hover .palette-selector__color-dot {
      transform: none;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .palette-selector__trigger {
      border: 2px solid var(--color-border-primary);
    }
    
    .palette-selector__color-dot {
      border: 2px solid var(--color-text-primary);
    }
    
    .palette-selector__dropdown {
      border: 2px solid var(--color-border-primary);
    }
  }
</style> 
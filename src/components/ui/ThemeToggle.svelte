<script lang="ts">
  import { createThemeStore, type ThemeOption } from '$lib/theme';
  
  // Create reactive theme store
  const themeStore = createThemeStore();
  
  // Reactive values from the theme store
  $: ({ theme, isDark } = $themeStore);
  
  /**
   * Handle theme toggle - cycles through auto, light, dark
   */
  function handleToggle() {
    if (theme === 'auto') {
      themeStore.setTheme('light');
    } else if (theme === 'light') {
      themeStore.setTheme('dark');
    } else {
      themeStore.setTheme('auto');
    }
  }
  
  /**
   * Get display label for current theme
   */
  $: themeLabel = theme === 'auto' ? (isDark ? 'Auto (Dark)' : 'Auto (Light)') : 
                  theme === 'light' ? 'Light' : 'Dark';
  
  /**
   * Get icon for current theme state
   */
  $: themeIcon = theme === 'auto' ? 'auto' : theme === 'light' ? 'sun' : 'moon';
</script>

<button
  class="theme-toggle"
  on:click={handleToggle}
  title="Switch theme: {themeLabel}"
  aria-label="Switch theme to {theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto'} mode"
>
  <div class="theme-toggle__icon" class:theme-toggle__icon--dark={isDark}>
    {#if themeIcon === 'sun'}
      <!-- Sun icon for light theme -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    {:else if themeIcon === 'moon'}
      <!-- Moon icon for dark theme -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    {:else}
      <!-- Auto icon for system theme -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    {/if}
  </div>
  
  <span class="theme-toggle__label">
    {themeLabel}
  </span>
</button>

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-surface-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-smooth);
    cursor: pointer;
    
    /* Sophisticated hover effects */
    backdrop-filter: var(--backdrop-blur);
    box-shadow: var(--shadow-elevation-low);
  }
  
  .theme-toggle:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-border-secondary);
    color: var(--color-text-primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-elevation-medium);
  }
  
  .theme-toggle:active {
    transform: translateY(0);
    box-shadow: var(--shadow-elevation-low);
  }
  
  .theme-toggle:focus-visible {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .theme-toggle__icon {
    width: 18px;
    height: 18px;
    color: var(--color-interactive-muted);
    transition: all var(--transition-smooth);
    transform-origin: center;
  }
  
  .theme-toggle__icon svg {
    width: 100%;
    height: 100%;
    transition: all var(--transition-smooth);
  }
  
  /* Icon color states */
  .theme-toggle:hover .theme-toggle__icon {
    color: var(--color-interactive-primary);
    transform: scale(1.1);
  }
  
  .theme-toggle__icon--dark {
    color: var(--color-interactive-secondary);
  }
  
  .theme-toggle__label {
    font-size: var(--font-size-xs);
    letter-spacing: 0.025em;
    text-transform: uppercase;
    opacity: 0.8;
    transition: opacity var(--transition-smooth);
  }
  
  .theme-toggle:hover .theme-toggle__label {
    opacity: 1;
  }
  
  /* Reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .theme-toggle,
    .theme-toggle__icon,
    .theme-toggle__icon svg,
    .theme-toggle__label {
      transition: none;
    }
    
    .theme-toggle:hover {
      transform: none;
    }
    
    .theme-toggle:hover .theme-toggle__icon {
      transform: none;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .theme-toggle {
      border: 2px solid var(--color-border-primary);
      background: var(--color-background-primary);
    }
    
    .theme-toggle:hover {
      border-color: var(--color-interactive-primary);
    }
  }
</style> 
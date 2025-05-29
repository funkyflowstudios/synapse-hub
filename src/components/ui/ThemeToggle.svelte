<script lang="ts">
  import type { ThemeOption } from '$lib/theme';
  import { onMount } from 'svelte';
  
  // Simple reactive state
  let currentTheme: ThemeOption = 'auto';
  let isDark = false;
  
  // Theme service functions (direct approach for better reactivity)
  function applyTheme(theme: ThemeOption) {
    if (typeof document === 'undefined') {
      return theme;
    }
    
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let effectiveTheme: string;
    
    if (theme === 'auto') {
      effectiveTheme = systemPrefersDark ? 'dark' : 'light';
    } else {
      effectiveTheme = theme;
    }
    
    // Apply the theme attribute
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', effectiveTheme);
    
    // Save to localStorage
    try {
      localStorage.setItem('synapse-theme', theme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }
    
    return effectiveTheme;
  }
  
  function getStoredTheme(): ThemeOption {
    if (typeof localStorage === 'undefined') return 'auto';
    const stored = localStorage.getItem('synapse-theme') as ThemeOption;
    return ['light', 'dark', 'twilight', 'auto'].includes(stored) ? stored : 'auto';
  }
  
  onMount(() => {
    // Initialize theme
    currentTheme = getStoredTheme();
    const effective = applyTheme(currentTheme);
    isDark = effective === 'dark' || effective === 'twilight';
  });
  
  function handleToggle() {
    // Cycle through themes: auto → light → dark → twilight → auto
    if (currentTheme === 'auto') {
      currentTheme = 'light';
    } else if (currentTheme === 'light') {
      currentTheme = 'dark';
    } else if (currentTheme === 'dark') {
      currentTheme = 'twilight';
    } else {
      currentTheme = 'auto';
    }
    
    const effective = applyTheme(currentTheme);
    isDark = effective === 'dark' || effective === 'twilight';
  }
  
  // Display labels
  $: themeLabel = currentTheme === 'auto' ? (isDark ? 'Auto (Dark)' : 'Auto (Light)') : 
                  currentTheme === 'light' ? 'Light' : 
                  currentTheme === 'dark' ? 'Dark' : 'Twilight';
  
  $: themeIcon = currentTheme === 'auto' ? 'auto' : 
                 currentTheme === 'light' ? 'sun' : 
                 currentTheme === 'dark' ? 'moon' : 'twilight';
</script>

<button
  class="theme-toggle"
  on:click={handleToggle}
  title="Switch theme: {themeLabel}"
  aria-label="Switch theme"
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
    {:else if themeIcon === 'twilight'}
      <!-- Twilight icon - blend of sun and moon -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5" opacity="0.5"/>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" opacity="0.7"/>
        <line x1="12" y1="1" x2="12" y2="3" opacity="0.6"/>
        <line x1="21" y1="12" x2="23" y2="12" opacity="0.6"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" opacity="0.6"/>
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
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-surface-secondary, #f8fafc);
    border: 1px solid var(--color-border-primary, #e2e8f0);
    border-radius: 0.5rem;
    color: var(--color-text-secondary, #64748b);
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 250ms ease;
    cursor: pointer;
    backdrop-filter: blur(8px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .theme-toggle:hover {
    background: var(--color-surface-hover, #f1f5f9);
    border-color: var(--color-border-secondary, #cbd5e1);
    color: var(--color-text-primary, #0f172a);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .theme-toggle:active {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .theme-toggle__icon {
    width: 18px;
    height: 18px;
    color: var(--color-interactive-muted, #94a3b8);
    transition: all 250ms ease;
    transform-origin: center;
  }
  
  .theme-toggle__icon svg {
    width: 100%;
    height: 100%;
    transition: all 250ms ease;
  }
  
  .theme-toggle:hover .theme-toggle__icon {
    color: var(--color-interactive-primary, #3b82f6);
    transform: scale(1.1);
  }
  
  .theme-toggle__icon--dark {
    color: var(--color-interactive-secondary, #8b5cf6);
  }
  
  .theme-toggle__label {
    font-size: 0.75rem;
    letter-spacing: 0.025em;
    text-transform: uppercase;
    opacity: 0.8;
    transition: opacity 250ms ease;
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
</style> 
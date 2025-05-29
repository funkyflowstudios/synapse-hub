/**
 * Theme Service - Manages theme switching and persistence
 * Implements the "Quiet Intelligence" theming engine
 */

export type ThemeOption = 'light' | 'dark' | 'auto';

class ThemeService {
  private currentTheme: ThemeOption = 'auto';
  private systemPrefersDark = false;
  private callbacks: Set<(theme: ThemeOption, isDark: boolean) => void> = new Set();

  constructor() {
    this.initializeTheme();
    this.setupSystemThemeListener();
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  private initializeTheme() {
    if (typeof window === 'undefined') return;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('synapse-theme') as ThemeOption | null;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      this.currentTheme = savedTheme;
    }

    // Check system preference
    this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply the initial theme
    this.applyTheme();
  }

  /**
   * Listen for system theme changes
   */
  private setupSystemThemeListener() {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      this.systemPrefersDark = e.matches;
      if (this.currentTheme === 'auto') {
        this.applyTheme();
        this.notifyCallbacks();
      }
    });
  }

  /**
   * Apply the current theme to the document
   */
  private applyTheme() {
    if (typeof document === 'undefined') return;

    const isDark = this.getEffectiveTheme() === 'dark';
    
    // Remove existing theme attributes
    document.documentElement.removeAttribute('data-theme');
    
    // Apply theme based on current selection
    if (this.currentTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (this.currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    // For 'auto', we rely on CSS media queries and don't set data-theme
  }

  /**
   * Get the effective theme (resolves 'auto' to 'light' or 'dark')
   */
  getEffectiveTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'auto') {
      return this.systemPrefersDark ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  /**
   * Get the current theme setting
   */
  getCurrentTheme(): ThemeOption {
    return this.currentTheme;
  }

  /**
   * Set the theme
   */
  setTheme(theme: ThemeOption) {
    this.currentTheme = theme;
    
    // Persist to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('synapse-theme', theme);
    }
    
    // Apply the theme
    this.applyTheme();
    
    // Notify callbacks
    this.notifyCallbacks();
  }

  /**
   * Toggle between light and dark (skips auto)
   */
  toggleTheme() {
    const effective = this.getEffectiveTheme();
    this.setTheme(effective === 'dark' ? 'light' : 'dark');
  }

  /**
   * Check if current effective theme is dark
   */
  isDark(): boolean {
    return this.getEffectiveTheme() === 'dark';
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(callback: (theme: ThemeOption, isDark: boolean) => void) {
    this.callbacks.add(callback);
    
    // Call immediately with current state
    callback(this.currentTheme, this.isDark());
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of theme changes
   */
  private notifyCallbacks() {
    const isDark = this.isDark();
    this.callbacks.forEach(callback => {
      callback(this.currentTheme, isDark);
    });
  }
}

// Create singleton instance
export const themeService = new ThemeService();

// Svelte store-like interface for reactive components
export function createThemeStore() {
  let currentTheme: ThemeOption = themeService.getCurrentTheme();
  let isDark = themeService.isDark();
  let subscribers: Set<(value: { theme: ThemeOption; isDark: boolean }) => void> = new Set();

  // Subscribe to theme service
  themeService.subscribe((theme, dark) => {
    currentTheme = theme;
    isDark = dark;
    
    // Notify Svelte subscribers
    subscribers.forEach(callback => {
      callback({ theme: currentTheme, isDark });
    });
  });

  return {
    subscribe(callback: (value: { theme: ThemeOption; isDark: boolean }) => void) {
      subscribers.add(callback);
      // Call immediately with current value
      callback({ theme: currentTheme, isDark });
      
      return () => {
        subscribers.delete(callback);
      };
    },
    setTheme: (theme: ThemeOption) => themeService.setTheme(theme),
    toggleTheme: () => themeService.toggleTheme(),
    get theme() { return currentTheme; },
    get isDark() { return isDark; }
  };
} 
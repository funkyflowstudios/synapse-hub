/**
 * Theme Service - Manages theme switching and persistence
 * Implements the "Quiet Intelligence" theming engine
 */

export type ThemeOption = 'light' | 'dark' | 'twilight' | 'auto';

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
    if (savedTheme && ['light', 'dark', 'twilight', 'auto'].includes(savedTheme)) {
      this.currentTheme = savedTheme;
    }

    // Check system preference
    this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Check if theme was already applied by app.html script
    const currentDataTheme = document.documentElement.getAttribute('data-theme');
    if (currentDataTheme && ['light', 'dark', 'twilight'].includes(currentDataTheme)) {
      // Theme already applied by app.html script, ensure consistency
      console.log('Theme already applied by app.html script:', currentDataTheme);
    } else {
      // Apply the initial theme if not already set
      this.applyTheme();
    }
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
    
    // Always set explicit data-theme attribute for all themes
    if (this.currentTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (this.currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (this.currentTheme === 'twilight') {
      document.documentElement.setAttribute('data-theme', 'twilight');
    } else if (this.currentTheme === 'auto') {
      // For auto mode, set explicit theme based on system preference
      document.documentElement.setAttribute('data-theme', this.systemPrefersDark ? 'dark' : 'light');
    }
  }

  /**
   * Get the effective theme (resolves 'auto' to 'light' or 'dark')
   */
  getEffectiveTheme(): 'light' | 'dark' | 'twilight' {
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
   * Toggle between light, dark, and twilight (skips auto)
   */
  toggleTheme() {
    const effective = this.getEffectiveTheme();
    if (effective === 'light') {
      this.setTheme('dark');
    } else if (effective === 'dark') {
      this.setTheme('twilight');
    } else {
      this.setTheme('light');
    }
  }

  /**
   * Check if current effective theme is dark (includes twilight)
   */
  isDark(): boolean {
    const effective = this.getEffectiveTheme();
    return effective === 'dark' || effective === 'twilight';
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

  /* ==========================================================================
     Dynamic Theme Adjustment Placeholders
     Future: AI-driven personalization based on usage patterns
     ========================================================================== */

  /**
   * Set ambient light level for dynamic brightness adjustment
   * Placeholder for future ambient light sensor integration
   */
  setAmbientLight(level: 'low' | 'medium' | 'high') {
    if (typeof document === 'undefined') return;
    
    // Remove existing ambient light attributes
    document.documentElement.removeAttribute('data-ambient-light');
    
    if (level !== 'medium') {
      document.documentElement.setAttribute('data-ambient-light', level);
    }
  }

  /**
   * Set contrast preference based on user behavior
   * Placeholder for future AI learning of user preferences
   */
  setContrastPreference(preference: 'low' | 'normal' | 'high') {
    if (typeof document === 'undefined') return;
    
    // Remove existing contrast preference attributes
    document.documentElement.removeAttribute('data-contrast-preference');
    
    if (preference !== 'normal') {
      document.documentElement.setAttribute('data-contrast-preference', preference);
    }
  }

  /**
   * Set reading mode for typography optimization
   * Placeholder for future reading pattern analysis
   */
  setReadingMode(mode: 'compact' | 'normal' | 'comfortable') {
    if (typeof document === 'undefined') return;
    
    // Remove existing reading mode attributes
    document.documentElement.removeAttribute('data-reading-mode');
    
    if (mode !== 'normal') {
      document.documentElement.setAttribute('data-reading-mode', mode);
    }
  }

  /**
   * Set focus mode for productivity optimization
   * Placeholder for future deep work pattern detection
   */
  setFocusMode(mode: 'normal' | 'deep') {
    if (typeof document === 'undefined') return;
    
    // Remove existing focus mode attributes
    document.documentElement.removeAttribute('data-focus-mode');
    
    if (mode !== 'normal') {
      document.documentElement.setAttribute('data-focus-mode', mode);
    }
  }

  /**
   * Auto-adjust theme based on time of day
   * Placeholder for future circadian rhythm optimization
   */
  autoAdjustForTimeOfDay() {
    const hour = new Date().getHours();
    
    // Simple heuristic - can be enhanced with AI learning
    if (hour >= 18 || hour <= 6) {
      // Evening/night: prefer twilight or dark
      if (this.currentTheme === 'auto') {
        // Could automatically switch to twilight mode
        // For now, just apply ambient light adjustment
        this.setAmbientLight('low');
      }
    } else if (hour >= 7 && hour <= 11) {
      // Morning: bright and energetic
      this.setAmbientLight('high');
      this.setReadingMode('normal');
    } else {
      // Afternoon: balanced
      this.setAmbientLight('medium');
    }
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
    get isDark() { return isDark; },
    
    // Dynamic adjustment methods
    setAmbientLight: (level: 'low' | 'medium' | 'high') => themeService.setAmbientLight(level),
    setContrastPreference: (pref: 'low' | 'normal' | 'high') => themeService.setContrastPreference(pref),
    setReadingMode: (mode: 'compact' | 'normal' | 'comfortable') => themeService.setReadingMode(mode),
    setFocusMode: (mode: 'normal' | 'deep') => themeService.setFocusMode(mode),
    autoAdjustForTimeOfDay: () => themeService.autoAdjustForTimeOfDay()
  };
} 
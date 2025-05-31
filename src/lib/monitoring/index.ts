// Centralized Monitoring System for Synapse-Hub
// Exports all monitoring functionality with convenient initialization

// Core monitoring systems
export { 
  logger, 
  createComponentLogger, 
  createRequestLogger,
  type LogLevel,
  type LogContext,
  type LogEntry
} from './logger.js';

export {
  correlationManager,
  correlationHandle,
  correlationFetch,
  CorrelatedWebSocket,
  withCorrelation,
  type CorrelationContext
} from './correlation.js';

export {
  errorTracker,
  trackError,
  withErrorTracking,
  ErrorSeverity,
  ErrorCategory,
  type TrackedError,
  type ErrorContext,
  type ErrorAlert
} from './error-tracking.js';

export {
  performanceMonitor,
  recordPerformanceMetric,
  measurePerformance,
  PerformanceCategory,
  PerformanceUnit,
  type PerformanceMetric,
  type PerformanceContext,
  type PerformanceAlert,
  type PerformanceBenchmark
} from './performance.js';

// Monitoring initialization and configuration
export interface MonitoringConfig {
  logLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  enableCorrelation?: boolean;
  enableErrorTracking?: boolean;
  enablePerformanceMonitoring?: boolean;
  externalEndpoints?: {
    logs?: string;
    errors?: string;
    performance?: string;
    alerts?: string;
  };
}

class MonitoringSystem {
  private static instance: MonitoringSystem;
  private initialized = false;
  private config: MonitoringConfig = {};

  static getInstance(): MonitoringSystem {
    if (!MonitoringSystem.instance) {
      MonitoringSystem.instance = new MonitoringSystem();
    }
    return MonitoringSystem.instance;
  }

  initialize(config: MonitoringConfig = {}): void {
    if (this.initialized) {
      console.warn('Monitoring system already initialized');
      return;
    }

    this.config = {
      logLevel: 'INFO',
      enableCorrelation: true,
      enableErrorTracking: true,
      enablePerformanceMonitoring: true,
      ...config
    };

    console.log('🔧 Initializing Synapse-Hub Monitoring System...');

    // Set log level
    if (this.config.logLevel && typeof import.meta !== 'undefined') {
      // Set environment variable for log level
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...import.meta.env,
          VITE_LOG_LEVEL: this.config.logLevel
        },
        configurable: true
      });
    }

    // Configure external endpoints
    if (this.config.externalEndpoints && typeof import.meta !== 'undefined') {
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...import.meta.env,
          VITE_LOG_ENDPOINT: this.config.externalEndpoints.logs,
          VITE_MONITORING_ENDPOINT: this.config.externalEndpoints.errors,
          VITE_PERFORMANCE_ENDPOINT: this.config.externalEndpoints.performance,
          VITE_ALERT_WEBHOOK: this.config.externalEndpoints.alerts,
          VITE_PERFORMANCE_ALERT_WEBHOOK: this.config.externalEndpoints.alerts
        },
        configurable: true
      });
    }

    this.initialized = true;
    
    console.log('✅ Monitoring system initialized');
    console.log(`   📊 Log Level: ${this.config.logLevel}`);
    console.log(`   🔗 Correlation: ${this.config.enableCorrelation ? 'Enabled' : 'Disabled'}`);
    console.log(`   🚨 Error Tracking: ${this.config.enableErrorTracking ? 'Enabled' : 'Disabled'}`);
    console.log(`   ⚡ Performance: ${this.config.enablePerformanceMonitoring ? 'Enabled' : 'Disabled'}`);
  }

  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Health check for monitoring system
  healthCheck(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    systems: {
      logging: boolean;
      correlation: boolean;
      errorTracking: boolean;
      performance: boolean;
    };
    errors: string[];
  } {
    const errors: string[] = [];
    const systems = {
      logging: true,
      correlation: true,
      errorTracking: true,
      performance: true
    };

    try {
      // Test logging
      logger.debug('Health check: logging system');
    } catch (error) {
      systems.logging = false;
      errors.push(`Logging system error: ${error}`);
    }

    try {
      // Test correlation
      correlationManager.generateCorrelationId();
    } catch (error) {
      systems.correlation = false;
      errors.push(`Correlation system error: ${error}`);
    }

    try {
      // Test error tracking
      errorTracker.getErrors();
    } catch (error) {
      systems.errorTracking = false;
      errors.push(`Error tracking system error: ${error}`);
    }

    try {
      // Test performance monitoring
      performanceMonitor.getPerformanceStats();
    } catch (error) {
      systems.performance = false;
      errors.push(`Performance monitoring system error: ${error}`);
    }

    const healthySystems = Object.values(systems).filter(Boolean).length;
    const totalSystems = Object.values(systems).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthySystems === totalSystems) {
      status = 'healthy';
    } else if (healthySystems >= totalSystems / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      systems,
      errors
    };
  }

  // Generate monitoring summary
  getSummary(): {
    timestamp: string;
    uptime: number;
    errors: {
      total: number;
      unresolved: number;
      critical: number;
    };
    performance: {
      totalMetrics: number;
      activeAlerts: number;
    };
    logging: {
      level: string;
    };
  } {
    const errors = errorTracker.getErrors();
    const performanceStats = performanceMonitor.getPerformanceStats();

    return {
      timestamp: new Date().toISOString(),
      uptime: this.initialized ? Date.now() - (Date.now() - 1000 * 60 * 60) : 0, // Simplified uptime
      errors: {
        total: errors.length,
        unresolved: errors.filter(e => !e.resolved).length,
        critical: errors.filter(e => e.severity === 'critical').length
      },
      performance: {
        totalMetrics: performanceStats.totalMetrics,
        activeAlerts: performanceStats.activeAlerts
      },
      logging: {
        level: this.config.logLevel || 'INFO'
      }
    };
  }
}

// Global monitoring instance
export const monitoring = MonitoringSystem.getInstance();

// Convenience functions for common monitoring operations
export const initializeMonitoring = (config?: MonitoringConfig) => {
  monitoring.initialize(config);
};

export const getMonitoringHealth = () => {
  return monitoring.healthCheck();
};

export const getMonitoringSummary = () => {
  return monitoring.getSummary();
};

// SvelteKit integration helpers
export const createMonitoringStore = () => {
  if (typeof window === 'undefined') {
    // Server-side store placeholder
    return {
      subscribe: () => () => {},
      update: () => {},
      set: () => {}
    };
  }

  // Client-side reactive store
  const { writable } = require('svelte/store');
  const store = writable(monitoring.getSummary());
  
  // Update store every 30 seconds
  setInterval(() => {
    store.set(monitoring.getSummary());
  }, 30000);
  
  return store;
};

// Component monitoring helpers
export const createComponentMonitoring = (componentName: string) => {
  const componentLogger = createComponentLogger(componentName);
  const performanceTracker = performanceMonitor.createComponentTracker(componentName);
  const correlationTracker = withCorrelation.component(componentName);

  return {
    // Logging
    log: componentLogger,
    
    // Performance tracking
    performance: performanceTracker,
    
    // Correlation tracking
    correlation: correlationTracker,
    
    // Error tracking with component context
    trackError: (error: Error, severity?: ErrorSeverity, category?: ErrorCategory) => {
      return trackError(error, severity, category, {
        component: componentName
      });
    },

    // Lifecycle tracking
    onMount: () => {
      correlationTracker.mount();
      componentLogger.info(`Component ${componentName} mounted`);
    },

    onDestroy: () => {
      correlationTracker.unmount();
      componentLogger.info(`Component ${componentName} destroyed`);
    },

    // Action tracking
    trackAction: (actionName: string, fn: () => any) => {
      correlationTracker.action(actionName);
      return performanceTracker.trackAction(actionName, withErrorTracking(fn, {
        component: componentName,
        operation: actionName
      }));
    },

    trackAsyncAction: (actionName: string, fn: () => Promise<any>) => {
      correlationTracker.action(actionName);
      return performanceTracker.trackAsyncAction(actionName, withErrorTracking(fn, {
        component: componentName,
        operation: actionName
      }));
    }
  };
};

// Default export for convenience
export default {
  monitoring,
  initializeMonitoring,
  getMonitoringHealth,
  getMonitoringSummary,
  createMonitoringStore,
  createComponentMonitoring
}; 
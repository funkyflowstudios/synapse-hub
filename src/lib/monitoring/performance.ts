// Performance Monitoring System
// Runtime performance tracking and optimization

import { logger } from './logger.js';
import { correlationManager } from './correlation.js';

export interface PerformanceMetric {
  id: string;
  name: string;
  category: PerformanceCategory;
  value: number;
  unit: PerformanceUnit;
  timestamp: string;
  correlationId?: string;
  context: PerformanceContext;
  tags: string[];
}

export interface PerformanceContext {
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  metadata?: Record<string, any>;
}

export enum PerformanceCategory {
  RENDER = 'render',
  API = 'api',
  DATABASE = 'database',
  NAVIGATION = 'navigation',
  BUNDLE = 'bundle',
  MEMORY = 'memory',
  NETWORK = 'network',
  USER_INTERACTION = 'user_interaction',
  COMPUTED = 'computed',
  REACTIVE = 'reactive'
}

export enum PerformanceUnit {
  MILLISECONDS = 'ms',
  SECONDS = 's',
  BYTES = 'bytes',
  KILOBYTES = 'kb',
  MEGABYTES = 'mb',
  COUNT = 'count',
  PERCENTAGE = 'percentage',
  RATIO = 'ratio'
}

export interface PerformanceBenchmark {
  name: string;
  target: number;
  warning: number;
  critical: number;
  unit: PerformanceUnit;
}

export interface PerformanceAlert {
  id: string;
  timestamp: string;
  metric: PerformanceMetric;
  benchmark: PerformanceBenchmark;
  severity: 'warning' | 'critical';
  message: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics = new Map<string, PerformanceMetric[]>();
  private benchmarks = new Map<string, PerformanceBenchmark>();
  private alerts = new Map<string, PerformanceAlert>();
  private observers = new Map<string, PerformanceObserver>();

  // Performance benchmarks
  private readonly defaultBenchmarks: PerformanceBenchmark[] = [
    { name: 'page_load', target: 2000, warning: 3000, critical: 5000, unit: PerformanceUnit.MILLISECONDS },
    { name: 'api_response', target: 500, warning: 1000, critical: 2000, unit: PerformanceUnit.MILLISECONDS },
    { name: 'component_render', target: 16, warning: 33, critical: 100, unit: PerformanceUnit.MILLISECONDS },
    { name: 'database_query', target: 100, warning: 500, critical: 1000, unit: PerformanceUnit.MILLISECONDS },
    { name: 'bundle_size', target: 250, warning: 500, critical: 1000, unit: PerformanceUnit.KILOBYTES },
    { name: 'memory_usage', target: 50, warning: 75, critical: 90, unit: PerformanceUnit.PERCENTAGE },
    { name: 'first_contentful_paint', target: 1000, warning: 2000, critical: 3000, unit: PerformanceUnit.MILLISECONDS },
    { name: 'largest_contentful_paint', target: 2500, warning: 4000, critical: 6000, unit: PerformanceUnit.MILLISECONDS },
    { name: 'cumulative_layout_shift', target: 0.1, warning: 0.25, critical: 0.5, unit: PerformanceUnit.RATIO }
  ];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    // Initialize default benchmarks
    this.defaultBenchmarks.forEach(benchmark => {
      this.benchmarks.set(benchmark.name, benchmark);
    });

    // Set up performance observers
    this.setupPerformanceObservers();
    
    // Start cleanup interval
    setInterval(() => this.cleanup(), 300000); // Every 5 minutes
  }

  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // Navigation timing
    this.createObserver('navigation', ['navigation'], (entries) => {
      entries.forEach(entry => {
        const nav = entry as PerformanceNavigationTiming;
        
        this.recordMetric('page_load', nav.loadEventEnd - nav.navigationStart, {
          category: PerformanceCategory.NAVIGATION,
          unit: PerformanceUnit.MILLISECONDS,
          context: {
            url: window.location.pathname,
            metadata: {
              domContentLoaded: nav.domContentLoadedEventEnd - nav.navigationStart,
              firstByte: nav.responseStart - nav.navigationStart,
              domComplete: nav.domComplete - nav.navigationStart
            }
          }
        });
      });
    });

    // Paint timing
    this.createObserver('paint', ['paint'], (entries) => {
      entries.forEach(entry => {
        this.recordMetric(entry.name.replace('-', '_'), entry.startTime, {
          category: PerformanceCategory.RENDER,
          unit: PerformanceUnit.MILLISECONDS,
          context: { url: window.location.pathname }
        });
      });
    });

    // Largest Contentful Paint
    this.createObserver('lcp', ['largest-contentful-paint'], (entries) => {
      entries.forEach(entry => {
        this.recordMetric('largest_contentful_paint', entry.startTime, {
          category: PerformanceCategory.RENDER,
          unit: PerformanceUnit.MILLISECONDS,
          context: { 
            url: window.location.pathname,
            metadata: { 
              element: (entry as any).element?.tagName 
            }
          }
        });
      });
    });

    // Layout Shift
    this.createObserver('cls', ['layout-shift'], (entries) => {
      let clsValue = 0;
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      
      if (clsValue > 0) {
        this.recordMetric('cumulative_layout_shift', clsValue, {
          category: PerformanceCategory.RENDER,
          unit: PerformanceUnit.RATIO,
          context: { url: window.location.pathname }
        });
      }
    });

    // Long Tasks
    this.createObserver('longtask', ['longtask'], (entries) => {
      entries.forEach(entry => {
        this.recordMetric('long_task', entry.duration, {
          category: PerformanceCategory.RENDER,
          unit: PerformanceUnit.MILLISECONDS,
          context: { 
            url: window.location.pathname,
            metadata: {
              startTime: entry.startTime,
              attribution: (entry as any).attribution
            }
          }
        });
      });
    });

    // Memory monitoring (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        this.recordMetric('memory_usage', usedPercent, {
          category: PerformanceCategory.MEMORY,
          unit: PerformanceUnit.PERCENTAGE,
          context: {
            metadata: {
              used: memory.usedJSHeapSize,
              total: memory.totalJSHeapSize,
              limit: memory.jsHeapSizeLimit
            }
          }
        });
      }, 30000); // Every 30 seconds
    }
  }

  private createObserver(
    name: string,
    entryTypes: string[],
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes });
      this.observers.set(name, observer);
    } catch (error) {
      logger.warn(`Failed to create performance observer for ${name}`, { 
        metadata: { error: (error as Error).message } 
      });
    }
  }

  recordMetric(
    name: string,
    value: number,
    options: {
      category: PerformanceCategory;
      unit: PerformanceUnit;
      context?: PerformanceContext;
      tags?: string[];
    }
  ): PerformanceMetric {
    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      name,
      category: options.category,
      value,
      unit: options.unit,
      timestamp: new Date().toISOString(),
      correlationId: correlationManager.getCorrelationId(),
      context: {
        ...options.context,
        ...(correlationManager.getCurrentContext() && {
          userId: correlationManager.getCurrentContext()?.userId,
          sessionId: correlationManager.getCurrentContext()?.sessionId
        })
      },
      tags: options.tags || []
    };

    // Store metric
    const metricList = this.metrics.get(name) || [];
    metricList.push(metric);
    this.metrics.set(name, metricList);

    // Check against benchmarks
    this.checkBenchmark(metric);

    // Log performance metric
    logger.performance(
      `Performance metric: ${name}`,
      value,
      {
        correlationId: metric.correlationId,
        component: metric.context.component,
        operation: metric.context.operation,
        metadata: {
          metricId: metric.id,
          category: metric.category,
          unit: metric.unit,
          tags: metric.tags
        }
      }
    );

    // Send to external monitoring
    this.sendToMonitoring(metric);

    return metric;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkBenchmark(metric: PerformanceMetric): void {
    const benchmark = this.benchmarks.get(metric.name);
    if (!benchmark) return;

    let severity: 'warning' | 'critical' | null = null;
    
    if (metric.value >= benchmark.critical) {
      severity = 'critical';
    } else if (metric.value >= benchmark.warning) {
      severity = 'warning';
    }

    if (severity) {
      this.createPerformanceAlert(metric, benchmark, severity);
    }
  }

  private createPerformanceAlert(
    metric: PerformanceMetric,
    benchmark: PerformanceBenchmark,
    severity: 'warning' | 'critical'
  ): void {
    const alert: PerformanceAlert = {
      id: `perf_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      metric,
      benchmark,
      severity,
      message: `Performance ${severity}: ${metric.name} (${metric.value}${metric.unit}) exceeded ${severity} threshold (${benchmark[severity]}${benchmark.unit})`
    };

    this.alerts.set(alert.id, alert);
    this.sendAlert(alert);
  }

  private async sendAlert(alert: PerformanceAlert): Promise<void> {
    try {
      // Send to external alerting service
      if (import.meta.env?.VITE_PERFORMANCE_ALERT_WEBHOOK) {
        await fetch(import.meta.env.VITE_PERFORMANCE_ALERT_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alert)
        });
      }

      // Console log for immediate visibility
      const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
      console.warn(`${emoji} PERFORMANCE ALERT [${alert.severity.toUpperCase()}]:`, alert);
      
    } catch (error) {
      logger.error('Failed to send performance alert', error as Error);
    }
  }

  private async sendToMonitoring(metric: PerformanceMetric): Promise<void> {
    try {
      if (import.meta.env?.VITE_PERFORMANCE_ENDPOINT) {
        await fetch(import.meta.env.VITE_PERFORMANCE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metric)
        });
      }
    } catch (error) {
      // Don't log monitoring failures to avoid infinite loops
      console.warn('Failed to send performance metric to monitoring service:', error);
    }
  }

  private cleanup(): void {
    const oneHourAgo = Date.now() - 3600000;
    
    // Clean up old metrics (keep only last hour)
    for (const [name, metricList] of this.metrics) {
      const filteredMetrics = metricList.filter(metric => 
        new Date(metric.timestamp).getTime() > oneHourAgo
      );
      this.metrics.set(name, filteredMetrics);
    }

    // Clean up old alerts
    for (const [id, alert] of this.alerts) {
      if (new Date(alert.timestamp).getTime() < oneHourAgo) {
        this.alerts.delete(id);
      }
    }
  }

  // Public API methods
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    return Array.from(this.metrics.values()).flat();
  }

  getAverageMetric(name: string, timeRange?: number): number | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const cutoff = timeRange ? Date.now() - timeRange : 0;
    const filteredMetrics = metrics.filter(m => 
      new Date(m.timestamp).getTime() > cutoff
    );

    if (filteredMetrics.length === 0) return null;

    const sum = filteredMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / filteredMetrics.length;
  }

  getPercentileMetric(name: string, percentile: number, timeRange?: number): number | null {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return null;

    const cutoff = timeRange ? Date.now() - timeRange : 0;
    const filteredMetrics = metrics.filter(m => 
      new Date(m.timestamp).getTime() > cutoff
    );

    if (filteredMetrics.length === 0) return null;

    const sorted = filteredMetrics.map(m => m.value).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  setBenchmark(name: string, benchmark: PerformanceBenchmark): void {
    this.benchmarks.set(name, benchmark);
  }

  getBenchmarks(): Map<string, PerformanceBenchmark> {
    return new Map(this.benchmarks);
  }

  getAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values());
  }

  getPerformanceStats(): {
    totalMetrics: number;
    metricsPerCategory: Record<PerformanceCategory, number>;
    activeAlerts: number;
    benchmarkViolations: number;
  } {
    const allMetrics = this.getMetrics();
    
    return {
      totalMetrics: allMetrics.length,
      metricsPerCategory: allMetrics.reduce((acc, metric) => {
        acc[metric.category] = (acc[metric.category] || 0) + 1;
        return acc;
      }, {} as Record<PerformanceCategory, number>),
      activeAlerts: this.alerts.size,
      benchmarkViolations: Array.from(this.alerts.values()).filter(a => 
        new Date(a.timestamp).getTime() > Date.now() - 3600000 // Last hour
      ).length
    };
  }

  // Performance measurement utilities
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceCategory = PerformanceCategory.API,
    context?: PerformanceContext
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, {
        category,
        unit: PerformanceUnit.MILLISECONDS,
        context,
        tags: ['async', 'success']
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, {
        category,
        unit: PerformanceUnit.MILLISECONDS,
        context,
        tags: ['async', 'error']
      });
      
      throw error;
    }
  }

  measureSync<T>(
    name: string,
    fn: () => T,
    category: PerformanceCategory = PerformanceCategory.COMPUTED,
    context?: PerformanceContext
  ): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, {
        category,
        unit: PerformanceUnit.MILLISECONDS,
        context,
        tags: ['sync', 'success']
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration, {
        category,
        unit: PerformanceUnit.MILLISECONDS,
        context,
        tags: ['sync', 'error']
      });
      
      throw error;
    }
  }

  // Component performance tracking
  createComponentTracker(componentName: string) {
    return {
      markRenderStart: () => {
        (performance as any)[`${componentName}_render_start`] = performance.now();
      },
      
      markRenderEnd: () => {
        const startTime = (performance as any)[`${componentName}_render_start`];
        if (startTime) {
          const duration = performance.now() - startTime;
          this.recordMetric('component_render', duration, {
            category: PerformanceCategory.RENDER,
            unit: PerformanceUnit.MILLISECONDS,
            context: { component: componentName },
            tags: ['component', componentName]
          });
        }
      },

      trackAction: (actionName: string, fn: () => any) => {
        return this.measureSync(
          `${componentName}_${actionName}`,
          fn,
          PerformanceCategory.USER_INTERACTION,
          { component: componentName, operation: actionName }
        );
      },

      trackAsyncAction: (actionName: string, fn: () => Promise<any>) => {
        return this.measureAsync(
          `${componentName}_${actionName}`,
          fn,
          PerformanceCategory.USER_INTERACTION,
          { component: componentName, operation: actionName }
        );
      }
    };
  }
}

// Global instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions
export const recordPerformanceMetric = (
  name: string,
  value: number,
  options: {
    category: PerformanceCategory;
    unit: PerformanceUnit;
    context?: PerformanceContext;
    tags?: string[];
  }
) => performanceMonitor.recordMetric(name, value, options);

export const measurePerformance = {
  async: <T>(
    name: string,
    fn: () => Promise<T>,
    category?: PerformanceCategory,
    context?: PerformanceContext
  ) => performanceMonitor.measureAsync(name, fn, category, context),

  sync: <T>(
    name: string,
    fn: () => T,
    category?: PerformanceCategory,
    context?: PerformanceContext
  ) => performanceMonitor.measureSync(name, fn, category, context)
};

export default performanceMonitor; 
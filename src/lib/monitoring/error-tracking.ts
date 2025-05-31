// Real-time Error Tracking System
// Centralized error monitoring and alerting

import { logger } from './logger.js';
import { correlationManager } from './correlation.js';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  RUNTIME = 'runtime',
  PERFORMANCE = 'performance',
  UI = 'ui',
  EXTERNAL_SERVICE = 'external_service',
  CONFIGURATION = 'configuration'
}

export interface ErrorContext {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  operation?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface TrackedError {
  id: string;
  timestamp: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context: ErrorContext;
  fingerprint: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;
  tags: string[];
}

export interface ErrorAlert {
  id: string;
  timestamp: string;
  errorId: string;
  severity: ErrorSeverity;
  message: string;
  threshold: number;
  count: number;
  sent: boolean;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private errors = new Map<string, TrackedError>();
  private alerts = new Map<string, ErrorAlert>();
  private errorCounts = new Map<string, number>();
  private lastAlertTime = new Map<string, number>();

  // Alert thresholds (errors per minute)
  private readonly alertThresholds = {
    [ErrorSeverity.LOW]: 10,
    [ErrorSeverity.MEDIUM]: 5,
    [ErrorSeverity.HIGH]: 2,
    [ErrorSeverity.CRITICAL]: 1
  };

  // Alert cooldown (minutes)
  private readonly alertCooldown = {
    [ErrorSeverity.LOW]: 15,
    [ErrorSeverity.MEDIUM]: 10,
    [ErrorSeverity.HIGH]: 5,
    [ErrorSeverity.CRITICAL]: 1
  };

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  constructor() {
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
    
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  private setupGlobalErrorHandlers(): void {
    // Unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError(
          event.error || new Error(event.message),
          ErrorSeverity.HIGH,
          ErrorCategory.RUNTIME,
          {
            component: 'global',
            operation: 'unhandled_error',
            url: window.location.href,
            metadata: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno
            }
          }
        );
      });

      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(
          new Error(event.reason?.toString() || 'Unhandled promise rejection'),
          ErrorSeverity.HIGH,
          ErrorCategory.RUNTIME,
          {
            component: 'global',
            operation: 'unhandled_rejection',
            url: window.location.href,
            metadata: {
              reason: event.reason
            }
          }
        );
      });
    }

    // Node.js process handlers
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.trackError(
          error,
          ErrorSeverity.CRITICAL,
          ErrorCategory.RUNTIME,
          {
            component: 'node',
            operation: 'uncaught_exception'
          }
        );
      });

      process.on('unhandledRejection', (reason) => {
        this.trackError(
          new Error(reason?.toString() || 'Unhandled promise rejection'),
          ErrorSeverity.CRITICAL,
          ErrorCategory.RUNTIME,
          {
            component: 'node',
            operation: 'unhandled_rejection',
            metadata: { reason }
          }
        );
      });
    }
  }

  private generateFingerprint(
    error: Error,
    category: ErrorCategory,
    context: ErrorContext
  ): string {
    // Create a fingerprint for grouping similar errors
    const parts = [
      error.name,
      error.message.replace(/\d+/g, 'X'), // Replace numbers with X
      category,
      context.component || 'unknown',
      context.operation || 'unknown'
    ];
    
    return btoa(parts.join('|')).substr(0, 16);
  }

  private categorizeError(error: Error, context: ErrorContext): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Network errors
    if (message.includes('fetch') || message.includes('network') || 
        message.includes('connection') || error.name === 'TypeError' && 
        (message.includes('failed to fetch') || message.includes('load'))) {
      return ErrorCategory.NETWORK;
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') ||
        message.includes('required') || message.includes('schema')) {
      return ErrorCategory.VALIDATION;
    }

    // Authentication/Authorization
    if (message.includes('unauthorized') || message.includes('forbidden') ||
        message.includes('authentication') || message.includes('token')) {
      return ErrorCategory.AUTHENTICATION;
    }

    // Database errors
    if (message.includes('database') || message.includes('sql') ||
        message.includes('connection') && stack.includes('db')) {
      return ErrorCategory.DATABASE;
    }

    // Performance errors
    if (message.includes('timeout') || message.includes('performance') ||
        message.includes('memory') || message.includes('resource')) {
      return ErrorCategory.PERFORMANCE;
    }

    // UI errors
    if (context.component && (
        context.component.includes('component') ||
        context.component.includes('ui') ||
        stack.includes('svelte')
      )) {
      return ErrorCategory.UI;
    }

    return ErrorCategory.RUNTIME;
  }

  private determineSeverity(
    error: Error,
    category: ErrorCategory,
    context: ErrorContext
  ): ErrorSeverity {
    // Critical errors
    if (category === ErrorCategory.DATABASE ||
        error.name === 'SecurityError' ||
        context.operation === 'uncaught_exception') {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (category === ErrorCategory.AUTHENTICATION ||
        category === ErrorCategory.AUTHORIZATION ||
        error.name === 'TypeError' ||
        context.operation === 'unhandled_rejection') {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (category === ErrorCategory.NETWORK ||
        category === ErrorCategory.PERFORMANCE ||
        category === ErrorCategory.EXTERNAL_SERVICE) {
      return ErrorSeverity.MEDIUM;
    }

    // Default to low severity
    return ErrorSeverity.LOW;
  }

  trackError(
    error: Error,
    severity?: ErrorSeverity,
    category?: ErrorCategory,
    context: ErrorContext = {}
  ): TrackedError {
    const now = new Date().toISOString();
    const correlationId = context.correlationId || correlationManager.getCorrelationId();
    
    // Enhance context with correlation data
    const enhancedContext: ErrorContext = {
      ...context,
      correlationId,
      ...(correlationManager.getCurrentContext() && {
        sessionId: correlationManager.getCurrentContext()?.sessionId,
        userId: correlationManager.getCurrentContext()?.userId
      })
    };

    // Auto-categorize if not provided
    const finalCategory = category || this.categorizeError(error, enhancedContext);
    
    // Auto-determine severity if not provided
    const finalSeverity = severity || this.determineSeverity(error, finalCategory, enhancedContext);

    const fingerprint = this.generateFingerprint(error, finalCategory, enhancedContext);
    
    // Check if this error already exists
    let trackedError = this.errors.get(fingerprint);
    
    if (trackedError) {
      // Update existing error
      trackedError.count++;
      trackedError.lastSeen = now;
      trackedError.severity = Math.max(
        Object.values(ErrorSeverity).indexOf(trackedError.severity),
        Object.values(ErrorSeverity).indexOf(finalSeverity)
      ) === Object.values(ErrorSeverity).indexOf(finalSeverity) 
        ? finalSeverity 
        : trackedError.severity;
    } else {
      // Create new error
      trackedError = {
        id: this.generateErrorId(),
        timestamp: now,
        severity: finalSeverity,
        category: finalCategory,
        message: error.message,
        stack: error.stack,
        context: enhancedContext,
        fingerprint,
        count: 1,
        firstSeen: now,
        lastSeen: now,
        resolved: false,
        tags: this.generateTags(error, finalCategory, enhancedContext)
      };
      
      this.errors.set(fingerprint, trackedError);
    }

    // Log the error
    logger.error(
      `Error tracked: ${error.message}`,
      error,
      {
        correlationId,
        component: enhancedContext.component,
        operation: enhancedContext.operation,
        metadata: {
          errorId: trackedError.id,
          severity: finalSeverity,
          category: finalCategory,
          fingerprint,
          count: trackedError.count
        }
      }
    );

    // Check for alerting
    this.checkAlertThreshold(trackedError);

    // Send to external monitoring service
    this.sendToMonitoring(trackedError);

    return trackedError;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTags(
    error: Error,
    category: ErrorCategory,
    context: ErrorContext
  ): string[] {
    const tags = [category, error.name];
    
    if (context.component) tags.push(`component:${context.component}`);
    if (context.operation) tags.push(`operation:${context.operation}`);
    if (context.userId) tags.push(`user:${context.userId}`);
    
    return tags;
  }

  private checkAlertThreshold(error: TrackedError): void {
    const now = Date.now();
    const minuteKey = `${error.fingerprint}-${Math.floor(now / 60000)}`;
    
    // Increment error count for this minute
    const currentCount = (this.errorCounts.get(minuteKey) || 0) + 1;
    this.errorCounts.set(minuteKey, currentCount);
    
    const threshold = this.alertThresholds[error.severity];
    const cooldown = this.alertCooldown[error.severity] * 60000; // Convert to ms
    const lastAlert = this.lastAlertTime.get(error.fingerprint) || 0;
    
    if (currentCount >= threshold && (now - lastAlert) > cooldown) {
      this.createAlert(error, threshold, currentCount);
      this.lastAlertTime.set(error.fingerprint, now);
    }
  }

  private createAlert(
    error: TrackedError,
    threshold: number,
    count: number
  ): void {
    const alert: ErrorAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      errorId: error.id,
      severity: error.severity,
      message: `Error threshold exceeded: ${error.message}`,
      threshold,
      count,
      sent: false
    };

    this.alerts.set(alert.id, alert);
    this.sendAlert(alert);
  }

  private async sendAlert(alert: ErrorAlert): Promise<void> {
    try {
      // Send to external alerting service
      if (import.meta.env?.VITE_ALERT_WEBHOOK) {
        await fetch(import.meta.env.VITE_ALERT_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(alert)
        });
      }

      // Console log for immediate visibility
      console.error(`🚨 ERROR ALERT [${alert.severity.toUpperCase()}]:`, alert);
      
      alert.sent = true;
    } catch (error) {
      logger.error('Failed to send alert', error as Error);
    }
  }

  private async sendToMonitoring(error: TrackedError): Promise<void> {
    try {
      if (import.meta.env?.VITE_MONITORING_ENDPOINT) {
        await fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(error)
        });
      }
    } catch (monitoringError) {
      // Don't log monitoring failures to avoid infinite loops
      console.warn('Failed to send error to monitoring service:', monitoringError);
    }
  }

  private cleanup(): void {
    const oneHourAgo = Date.now() - 3600000;
    
    // Clean up old error counts
    for (const [key] of this.errorCounts) {
      const timestamp = parseInt(key.split('-').pop() || '0') * 60000;
      if (timestamp < oneHourAgo) {
        this.errorCounts.delete(key);
      }
    }
  }

  // Public API methods
  getErrors(): TrackedError[] {
    return Array.from(this.errors.values());
  }

  getError(fingerprint: string): TrackedError | undefined {
    return this.errors.get(fingerprint);
  }

  resolveError(fingerprint: string): boolean {
    const error = this.errors.get(fingerprint);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  getAlerts(): ErrorAlert[] {
    return Array.from(this.alerts.values());
  }

  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    resolved: number;
  } {
    const errors = this.getErrors();
    
    return {
      total: errors.length,
      bySeverity: errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<ErrorSeverity, number>),
      byCategory: errors.reduce((acc, error) => {
        acc[error.category] = (acc[error.category] || 0) + 1;
        return acc;
      }, {} as Record<ErrorCategory, number>),
      resolved: errors.filter(e => e.resolved).length
    };
  }
}

// Global instance
export const errorTracker = ErrorTracker.getInstance();

// Utility functions for easy integration
export const trackError = (
  error: Error,
  severity?: ErrorSeverity,
  category?: ErrorCategory,
  context?: ErrorContext
) => errorTracker.trackError(error, severity, category, context);

export const withErrorTracking = <T extends (...args: any[]) => any>(
  fn: T,
  context?: Partial<ErrorContext>
): T => {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          trackError(error, undefined, undefined, context);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      trackError(error as Error, undefined, undefined, context);
      throw error;
    }
  }) as T;
};

export default errorTracker; 
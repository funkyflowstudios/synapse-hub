// Structured Logging System for Synapse-Hub
// Provides consistent logging format across all components

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    duration: number;
    memoryUsage?: number;
  };
}

class StructuredLogger {
  private minLevel: LogLevel = LogLevel.INFO;

  constructor() {
    // Set log level from environment or default to INFO
    const envLevel = import.meta.env?.VITE_LOG_LEVEL || 'INFO';
    this.minLevel = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: Error,
    performance?: { duration: number; memoryUsage?: number }
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        correlationId: context.correlationId || this.generateCorrelationId(),
        ...context
      },
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      }),
      ...(performance && { performance })
    };
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private outputLog(entry: LogEntry): void {
    const output = JSON.stringify(entry, null, 2);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(output);
        break;
      case LogLevel.INFO:
        console.info(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(output);
        break;
    }

    // In production, you might want to send to external logging service
    if (import.meta.env?.PROD) {
      this.sendToExternalLogger(entry);
    }
  }

  private async sendToExternalLogger(entry: LogEntry): Promise<void> {
    try {
      // Placeholder for external logging service integration
      // e.g., sending to LogTail, DataDog, New Relic, etc.
      if (import.meta.env?.VITE_LOG_ENDPOINT) {
        await fetch(import.meta.env.VITE_LOG_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry)
        });
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.outputLog(entry);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.outputLog(entry);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.outputLog(entry);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.outputLog(entry);
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    const entry = this.createLogEntry(LogLevel.FATAL, message, context, error);
    this.outputLog(entry);
  }

  performance(
    message: string, 
    duration: number, 
    context?: LogContext,
    memoryUsage?: number
  ): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.createLogEntry(
      LogLevel.INFO, 
      message, 
      context, 
      undefined, 
      { duration, memoryUsage }
    );
    this.outputLog(entry);
  }

  // Performance measurement helper
  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize;
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      const memoryUsage = startMemory 
        ? (performance as any).memory?.usedJSHeapSize - startMemory 
        : undefined;
      
      this.performance(
        `Operation completed: ${operation}`, 
        duration, 
        { ...context, operation },
        memoryUsage
      );
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(
        `Operation failed: ${operation}`, 
        error as Error, 
        { ...context, operation }
      );
      throw error;
    }
  }

  // Create a child logger with preset context
  child(context: LogContext): StructuredLogger {
    const childLogger = new StructuredLogger();
    const originalCreateLogEntry = childLogger.createLogEntry.bind(childLogger);
    
    childLogger.createLogEntry = (level, message, additionalContext = {}, error?, performance?) => {
      return originalCreateLogEntry(level, message, { ...context, ...additionalContext }, error, performance);
    };
    
    return childLogger;
  }
}

// Global logger instance
export const logger = new StructuredLogger();

// Component-specific loggers
export const createComponentLogger = (component: string) => {
  return logger.child({ component });
};

// Request-specific logger with correlation ID
export const createRequestLogger = (correlationId: string) => {
  return logger.child({ correlationId });
};

export default logger; 
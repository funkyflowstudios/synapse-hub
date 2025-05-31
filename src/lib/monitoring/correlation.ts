// Correlation ID System for Request Tracing
// Enables tracing requests across distributed components

import type { Handle } from '@sveltejs/kit';
import { AsyncLocalStorage } from 'async_hooks';

export interface CorrelationContext {
  correlationId: string;
  sessionId?: string;
  userId?: string;
  startTime: number;
  metadata?: Record<string, any>;
}

// AsyncLocalStorage for maintaining correlation context across async operations
const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

export class CorrelationManager {
  private static instance: CorrelationManager;

  static getInstance(): CorrelationManager {
    if (!CorrelationManager.instance) {
      CorrelationManager.instance = new CorrelationManager();
    }
    return CorrelationManager.instance;
  }

  generateCorrelationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${random}`;
  }

  createContext(
    correlationId?: string,
    sessionId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): CorrelationContext {
    return {
      correlationId: correlationId || this.generateCorrelationId(),
      sessionId,
      userId,
      startTime: performance.now(),
      metadata
    };
  }

  getCurrentContext(): CorrelationContext | undefined {
    return correlationStorage.getStore();
  }

  getCorrelationId(): string | undefined {
    return this.getCurrentContext()?.correlationId;
  }

  runWithContext<T>(context: CorrelationContext, fn: () => T): T {
    return correlationStorage.run(context, fn);
  }

  async runWithContextAsync<T>(
    context: CorrelationContext, 
    fn: () => Promise<T>
  ): Promise<T> {
    return correlationStorage.run(context, fn);
  }

  updateContext(updates: Partial<CorrelationContext>): void {
    const current = this.getCurrentContext();
    if (current) {
      Object.assign(current, updates);
    }
  }

  addMetadata(key: string, value: any): void {
    const current = this.getCurrentContext();
    if (current) {
      current.metadata = current.metadata || {};
      current.metadata[key] = value;
    }
  }

  getElapsedTime(): number {
    const context = this.getCurrentContext();
    return context ? performance.now() - context.startTime : 0;
  }
}

// Global instance
export const correlationManager = CorrelationManager.getInstance();

// SvelteKit Handle for correlation ID middleware
export const correlationHandle: Handle = async ({ event, resolve }) => {
  // Extract correlation ID from headers or generate new one
  const correlationId = 
    event.request.headers.get('x-correlation-id') ||
    event.request.headers.get('x-request-id') ||
    correlationManager.generateCorrelationId();

  // Extract session/user info if available
  const sessionId = event.cookies.get('sessionId');
  const userId = event.locals?.user?.id;

  // Create correlation context
  const context = correlationManager.createContext(
    correlationId,
    sessionId,
    userId,
    {
      method: event.request.method,
      url: event.url.pathname,
      userAgent: event.request.headers.get('user-agent')
    }
  );

  // Run the request within the correlation context
  return correlationManager.runWithContextAsync(context, async () => {
    // Add correlation ID to response headers
    const response = await resolve(event);
    response.headers.set('x-correlation-id', correlationId);
    
    return response;
  });
};

// Fetch wrapper that includes correlation ID in outbound requests
export const correlationFetch = (
  originalFetch: typeof fetch = fetch
) => {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const correlationId = correlationManager.getCorrelationId();
    
    if (correlationId) {
      const headers = new Headers(init?.headers);
      headers.set('x-correlation-id', correlationId);
      
      init = {
        ...init,
        headers
      };
    }
    
    return originalFetch(input, init);
  };
};

// WebSocket wrapper for correlation ID propagation
export class CorrelatedWebSocket extends WebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    // Add correlation ID to WebSocket URL as query parameter
    const correlationId = correlationManager.getCorrelationId();
    const wsUrl = new URL(url);
    
    if (correlationId) {
      wsUrl.searchParams.set('correlationId', correlationId);
    }
    
    super(wsUrl, protocols);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    // If sending JSON, try to add correlation ID
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        const correlationId = correlationManager.getCorrelationId();
        
        if (correlationId && !parsed.correlationId) {
          parsed.correlationId = correlationId;
          data = JSON.stringify(parsed);
        }
      } catch {
        // Not JSON, send as-is
      }
    }
    
    super.send(data);
  }
}

// Utility functions for component integration
export const withCorrelation = {
  // Higher-order function for API calls
  apiCall: <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
    return (async (...args: Parameters<T>) => {
      const context = correlationManager.getCurrentContext();
      correlationManager.addMetadata('apiCall', fn.name);
      return fn(...args);
    }) as T;
  },

  // Database operation wrapper
  dbOperation: async <T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    correlationManager.addMetadata('dbOperation', operation);
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      correlationManager.addMetadata('dbDuration', duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      correlationManager.addMetadata('dbError', {
        operation,
        duration,
        error: (error as Error).message
      });
      throw error;
    }
  },

  // Component lifecycle tracking
  component: (componentName: string) => ({
    mount: () => {
      correlationManager.addMetadata('componentMount', componentName);
    },
    unmount: () => {
      correlationManager.addMetadata('componentUnmount', componentName);
    },
    action: (actionName: string) => {
      correlationManager.addMetadata('componentAction', {
        component: componentName,
        action: actionName
      });
    }
  })
};

// Browser-compatible version for environments without AsyncLocalStorage
let browserContext: CorrelationContext | undefined;

export const browserCorrelationManager = {
  setContext: (context: CorrelationContext) => {
    browserContext = context;
  },

  getContext: (): CorrelationContext | undefined => {
    return browserContext;
  },

  getCorrelationId: (): string | undefined => {
    return browserContext?.correlationId;
  },

  clear: () => {
    browserContext = undefined;
  }
};

// Auto-detect environment and export appropriate manager
export const correlationContext = typeof AsyncLocalStorage !== 'undefined' 
  ? correlationManager 
  : browserCorrelationManager; 
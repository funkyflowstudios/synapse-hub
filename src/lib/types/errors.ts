// Error handling patterns and types
// Standardized error management across all Synapse-Hub components

import type { UserId, ConnectorId, WorkflowId } from './common';

// Base error interfaces
export interface SynapseError extends Error {
  code: ErrorCode;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: ErrorContext;
  timestamp: Date;
  correlationId?: string;
  userId?: UserId;
  retry: RetryInfo;
  metadata?: Record<string, unknown>;
}

export enum ErrorCode {
  // Authentication & Authorization Errors (1000-1099)
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_TOKEN_EXPIRED = 'AUTH_002',
  AUTH_TOKEN_INVALID = 'AUTH_003',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_004',
  AUTH_USER_DISABLED = 'AUTH_005',
  AUTH_SESSION_EXPIRED = 'AUTH_006',
  AUTH_RATE_LIMITED = 'AUTH_007',
  AUTH_MFA_REQUIRED = 'AUTH_008',
  AUTH_MFA_INVALID = 'AUTH_009',
  AUTH_PASSWORD_WEAK = 'AUTH_010',

  // User Management Errors (1100-1199)
  USER_NOT_FOUND = 'USER_001',
  USER_ALREADY_EXISTS = 'USER_002',
  USER_EMAIL_TAKEN = 'USER_003',
  USER_USERNAME_TAKEN = 'USER_004',
  USER_VALIDATION_FAILED = 'USER_005',
  USER_PROFILE_INCOMPLETE = 'USER_006',
  USER_QUOTA_EXCEEDED = 'USER_007',

  // Workflow Errors (2000-2199)
  WORKFLOW_NOT_FOUND = 'WORKFLOW_001',
  WORKFLOW_INVALID_DEFINITION = 'WORKFLOW_002',
  WORKFLOW_VALIDATION_FAILED = 'WORKFLOW_003',
  WORKFLOW_EXECUTION_FAILED = 'WORKFLOW_004',
  WORKFLOW_STEP_FAILED = 'WORKFLOW_005',
  WORKFLOW_TIMEOUT = 'WORKFLOW_006',
  WORKFLOW_CANCELLED = 'WORKFLOW_007',
  WORKFLOW_PERMISSION_DENIED = 'WORKFLOW_008',
  WORKFLOW_DEPENDENCY_MISSING = 'WORKFLOW_009',
  WORKFLOW_CIRCULAR_DEPENDENCY = 'WORKFLOW_010',
  WORKFLOW_RESOURCE_EXHAUSTED = 'WORKFLOW_011',
  WORKFLOW_DEADLOCK = 'WORKFLOW_012',

  // Connector Errors (3000-3199)
  CONNECTOR_NOT_FOUND = 'CONNECTOR_001',
  CONNECTOR_UNAVAILABLE = 'CONNECTOR_002',
  CONNECTOR_CONNECTION_FAILED = 'CONNECTOR_003',
  CONNECTOR_TIMEOUT = 'CONNECTOR_004',
  CONNECTOR_AUTHENTICATION_FAILED = 'CONNECTOR_005',
  CONNECTOR_RATE_LIMITED = 'CONNECTOR_006',
  CONNECTOR_CONFIGURATION_INVALID = 'CONNECTOR_007',
  CONNECTOR_VERSION_MISMATCH = 'CONNECTOR_008',
  CONNECTOR_PROTOCOL_ERROR = 'CONNECTOR_009',
  CONNECTOR_DATA_CORRUPTION = 'CONNECTOR_010',
  CONNECTOR_QUOTA_EXCEEDED = 'CONNECTOR_011',

  // API Errors (4000-4199)
  API_INVALID_REQUEST = 'API_001',
  API_INVALID_PARAMETERS = 'API_002',
  API_MISSING_PARAMETERS = 'API_003',
  API_VALIDATION_FAILED = 'API_004',
  API_RATE_LIMITED = 'API_005',
  API_QUOTA_EXCEEDED = 'API_006',
  API_ENDPOINT_NOT_FOUND = 'API_007',
  API_METHOD_NOT_ALLOWED = 'API_008',
  API_UNSUPPORTED_MEDIA_TYPE = 'API_009',
  API_PAYLOAD_TOO_LARGE = 'API_010',

  // Database Errors (5000-5199)
  DB_CONNECTION_FAILED = 'DB_001',
  DB_QUERY_FAILED = 'DB_002',
  DB_TRANSACTION_FAILED = 'DB_003',
  DB_CONSTRAINT_VIOLATION = 'DB_004',
  DB_DEADLOCK = 'DB_005',
  DB_TIMEOUT = 'DB_006',
  DB_DUPLICATE_KEY = 'DB_007',
  DB_FOREIGN_KEY_VIOLATION = 'DB_008',
  DB_DATA_INTEGRITY = 'DB_009',
  DB_MIGRATION_FAILED = 'DB_010',

  // File System Errors (6000-6199)
  FILE_NOT_FOUND = 'FILE_001',
  FILE_ACCESS_DENIED = 'FILE_002',
  FILE_SIZE_EXCEEDED = 'FILE_003',
  FILE_TYPE_UNSUPPORTED = 'FILE_004',
  FILE_CORRUPTED = 'FILE_005',
  FILE_VIRUS_DETECTED = 'FILE_006',
  FILE_UPLOAD_FAILED = 'FILE_007',
  FILE_DOWNLOAD_FAILED = 'FILE_008',
  FILE_STORAGE_FULL = 'FILE_009',

  // Network Errors (7000-7199)
  NETWORK_UNREACHABLE = 'NETWORK_001',
  NETWORK_TIMEOUT = 'NETWORK_002',
  NETWORK_CONNECTION_REFUSED = 'NETWORK_003',
  NETWORK_DNS_FAILED = 'NETWORK_004',
  NETWORK_SSL_ERROR = 'NETWORK_005',
  NETWORK_PROXY_ERROR = 'NETWORK_006',
  NETWORK_BANDWIDTH_EXCEEDED = 'NETWORK_007',

  // System Errors (8000-8199)
  SYSTEM_OUT_OF_MEMORY = 'SYSTEM_001',
  SYSTEM_DISK_FULL = 'SYSTEM_002',
  SYSTEM_CPU_OVERLOAD = 'SYSTEM_003',
  SYSTEM_SERVICE_UNAVAILABLE = 'SYSTEM_004',
  SYSTEM_MAINTENANCE_MODE = 'SYSTEM_005',
  SYSTEM_CONFIGURATION_ERROR = 'SYSTEM_006',
  SYSTEM_DEPENDENCY_MISSING = 'SYSTEM_007',
  SYSTEM_VERSION_INCOMPATIBLE = 'SYSTEM_008',

  // External Service Errors (9000-9199)
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_001',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_002',
  EXTERNAL_SERVICE_RATE_LIMITED = 'EXTERNAL_003',
  EXTERNAL_SERVICE_AUTHENTICATION_FAILED = 'EXTERNAL_004',
  EXTERNAL_SERVICE_QUOTA_EXCEEDED = 'EXTERNAL_005',
  EXTERNAL_SERVICE_CONFIGURATION_ERROR = 'EXTERNAL_006',

  // Generic Errors (9900-9999)
  UNKNOWN_ERROR = 'GENERIC_001',
  INTERNAL_ERROR = 'GENERIC_002',
  NOT_IMPLEMENTED = 'GENERIC_003',
  FEATURE_DISABLED = 'GENERIC_004',
  MAINTENANCE_MODE = 'GENERIC_005'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  FILE_SYSTEM = 'file_system',
  WORKFLOW = 'workflow',
  CONNECTOR = 'connector',
  SYSTEM = 'system',
  EXTERNAL = 'external',
  USER = 'user',
  CONFIGURATION = 'configuration'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  component: string;
  operation: string;
  resource?: string;
  resourceId?: string;
  userId?: UserId;
  sessionId?: string;
  workflowId?: WorkflowId;
  connectorId?: ConnectorId;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  parameters?: Record<string, unknown>;
  stackTrace?: string[];
  breadcrumbs?: ErrorBreadcrumb[];
}

export interface ErrorBreadcrumb {
  timestamp: Date;
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  data?: Record<string, unknown>;
}

export interface RetryInfo {
  isRetryable: boolean;
  maxAttempts: number;
  currentAttempt: number;
  nextRetryAt?: Date;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  jitter: boolean;
}

// Specific error types
export class AuthenticationError extends Error implements SynapseError {
  code: ErrorCode;
  category = ErrorCategory.AUTHENTICATION;
  severity = ErrorSeverity.HIGH;
  context?: ErrorContext;
  timestamp = new Date();
  correlationId?: string;
  userId?: UserId;
  retry: RetryInfo;
  metadata?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    context?: ErrorContext,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.context = context;
    this.metadata = metadata;
    this.retry = {
      isRetryable: false,
      maxAttempts: 1,
      currentAttempt: 1,
      backoffStrategy: 'fixed',
      baseDelay: 0,
      maxDelay: 0,
      jitter: false
    };
  }
}

export class ValidationError extends Error implements SynapseError {
  code: ErrorCode;
  category = ErrorCategory.VALIDATION;
  severity = ErrorSeverity.MEDIUM;
  context?: ErrorContext;
  timestamp = new Date();
  correlationId?: string;
  userId?: UserId;
  retry: RetryInfo;
  metadata?: Record<string, unknown>;
  validationErrors: ValidationErrorDetail[];

  constructor(
    code: ErrorCode,
    message: string,
    validationErrors: ValidationErrorDetail[],
    context?: ErrorContext,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.validationErrors = validationErrors;
    this.context = context;
    this.metadata = metadata;
    this.retry = {
      isRetryable: false,
      maxAttempts: 1,
      currentAttempt: 1,
      backoffStrategy: 'fixed',
      baseDelay: 0,
      maxDelay: 0,
      jitter: false
    };
  }
}

export interface ValidationErrorDetail {
  field: string;
  value: unknown;
  message: string;
  code: string;
  constraint?: string;
}

export class WorkflowError extends Error implements SynapseError {
  code: ErrorCode;
  category = ErrorCategory.WORKFLOW;
  severity: ErrorSeverity;
  context?: ErrorContext;
  timestamp = new Date();
  correlationId?: string;
  userId?: UserId;
  retry: RetryInfo;
  metadata?: Record<string, unknown>;
  workflowId: WorkflowId;
  stepId?: string;
  executionId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    workflowId: WorkflowId,
    severity: ErrorSeverity = ErrorSeverity.HIGH,
    stepId?: string,
    executionId?: string,
    context?: ErrorContext,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WorkflowError';
    this.code = code;
    this.severity = severity;
    this.workflowId = workflowId;
    this.stepId = stepId;
    this.executionId = executionId;
    this.context = context;
    this.metadata = metadata;
    this.retry = {
      isRetryable: true,
      maxAttempts: 3,
      currentAttempt: 1,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 30000,
      jitter: true
    };
  }
}

export class ConnectorError extends Error implements SynapseError {
  code: ErrorCode;
  category = ErrorCategory.CONNECTOR;
  severity: ErrorSeverity;
  context?: ErrorContext;
  timestamp = new Date();
  correlationId?: string;
  userId?: UserId;
  retry: RetryInfo;
  metadata?: Record<string, unknown>;
  connectorId: ConnectorId;
  operation?: string;

  constructor(
    code: ErrorCode,
    message: string,
    connectorId: ConnectorId,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    operation?: string,
    context?: ErrorContext,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ConnectorError';
    this.code = code;
    this.severity = severity;
    this.connectorId = connectorId;
    this.operation = operation;
    this.context = context;
    this.metadata = metadata;
    this.retry = {
      isRetryable: true,
      maxAttempts: 5,
      currentAttempt: 1,
      backoffStrategy: 'exponential',
      baseDelay: 500,
      maxDelay: 15000,
      jitter: true
    };
  }
}

export class ApiError extends Error implements SynapseError {
  code: ErrorCode;
  category = ErrorCategory.VALIDATION;
  severity = ErrorSeverity.MEDIUM;
  context?: ErrorContext;
  timestamp = new Date();
  correlationId?: string;
  userId?: UserId;
  retry: RetryInfo;
  metadata?: Record<string, unknown>;
  statusCode: number;
  endpoint?: string;
  method?: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    endpoint?: string,
    method?: string,
    context?: ErrorContext,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.method = method;
    this.context = context;
    this.metadata = metadata;
    this.retry = {
      isRetryable: statusCode >= 500 || statusCode === 429,
      maxAttempts: statusCode === 429 ? 5 : 3,
      currentAttempt: 1,
      backoffStrategy: 'exponential',
      baseDelay: statusCode === 429 ? 2000 : 1000,
      maxDelay: 30000,
      jitter: true
    };
  }
}

export class SystemError extends Error implements SynapseError {
  code: ErrorCode;
  category = ErrorCategory.SYSTEM;
  severity = ErrorSeverity.CRITICAL;
  context?: ErrorContext;
  timestamp = new Date();
  correlationId?: string;
  userId?: UserId;
  retry: RetryInfo;
  metadata?: Record<string, unknown>;
  component: string;

  constructor(
    code: ErrorCode,
    message: string,
    component: string,
    context?: ErrorContext,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SystemError';
    this.code = code;
    this.component = component;
    this.context = context;
    this.metadata = metadata;
    this.retry = {
      isRetryable: false,
      maxAttempts: 1,
      currentAttempt: 1,
      backoffStrategy: 'fixed',
      baseDelay: 0,
      maxDelay: 0,
      jitter: false
    };
  }
}

// Error handling patterns
export interface ErrorHandler {
  canHandle(error: Error): boolean;
  handle(error: SynapseError): Promise<ErrorHandlingResult>;
  priority: number;
}

export interface ErrorHandlingResult {
  handled: boolean;
  retry: boolean;
  retryAfter?: number; // milliseconds
  fallback?: unknown;
  escalate: boolean;
  notify: boolean;
  log: boolean;
  metadata?: Record<string, unknown>;
}

export interface ErrorRecoveryStrategy {
  name: string;
  canRecover(error: SynapseError): boolean;
  recover(error: SynapseError): Promise<RecoveryResult>;
  maxAttempts: number;
  timeout: number; // milliseconds
}

export interface RecoveryResult {
  recovered: boolean;
  result?: unknown;
  newError?: SynapseError;
  shouldRetry: boolean;
  retryDelay?: number;
}

// Error reporting and monitoring
export interface ErrorReport {
  id: string;
  error: SynapseError;
  environment: EnvironmentInfo;
  user?: UserInfo;
  session?: SessionInfo;
  request?: RequestInfo;
  fingerprint: string;
  occurrenceCount: number;
  firstOccurred: Date;
  lastOccurred: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: UserId;
  resolution?: string;
  tags: string[];
  watchers: UserId[];
}

export interface EnvironmentInfo {
  platform: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  region: string;
  instance: string;
  buildNumber: string;
  gitCommit: string;
}

export interface UserInfo {
  userId: UserId;
  username: string;
  role: string;
  subscription: string;
  timezone: string;
  locale: string;
}

export interface SessionInfo {
  sessionId: string;
  duration: number; // milliseconds
  device: string;
  browser: string;
  ipAddress: string;
  country: string;
}

export interface RequestInfo {
  requestId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  parameters: Record<string, unknown>;
  body?: unknown;
  userAgent: string;
  referer?: string;
}

// Error aggregation and metrics
export interface ErrorMetrics {
  errorRate: number; // errors per minute
  errorsByCategory: Record<ErrorCategory, number>;
  errorsByCode: Record<ErrorCode, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  topErrors: ErrorSummary[];
  meanTimeToResolution: number; // minutes
  impactedUsers: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface ErrorSummary {
  code: ErrorCode;
  message: string;
  count: number;
  lastOccurred: Date;
  severity: ErrorSeverity;
  trend: 'increasing' | 'decreasing' | 'stable';
  impactedUsers: number;
}

// Error notification preferences
export interface ErrorNotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  filters: NotificationFilter[];
  throttling: ThrottlingConfig;
  escalation: EscalationConfig;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  configuration: Record<string, unknown>;
  enabled: boolean;
  severityThreshold: ErrorSeverity;
}

export interface NotificationFilter {
  category?: ErrorCategory;
  code?: ErrorCode;
  severity?: ErrorSeverity;
  component?: string;
  userId?: UserId;
  include: boolean;
}

export interface ThrottlingConfig {
  enabled: boolean;
  maxNotificationsPerHour: number;
  maxNotificationsPerDay: number;
  similarErrorWindow: number; // minutes
  backoffMultiplier: number;
}

export interface EscalationConfig {
  enabled: boolean;
  levels: EscalationLevel[];
  autoEscalate: boolean;
}

export interface EscalationLevel {
  level: number;
  severityThreshold: ErrorSeverity;
  delay: number; // minutes
  notificationChannels: string[];
  assignees: UserId[];
}

// Error context builders and utilities
export class ErrorContextBuilder {
  private context: Partial<ErrorContext> = {};

  component(component: string): this {
    this.context.component = component;
    return this;
  }

  operation(operation: string): this {
    this.context.operation = operation;
    return this;
  }

  resource(resource: string, resourceId?: string): this {
    this.context.resource = resource;
    this.context.resourceId = resourceId;
    return this;
  }

  user(userId: UserId, sessionId?: string): this {
    this.context.userId = userId;
    this.context.sessionId = sessionId;
    return this;
  }

  workflow(workflowId: WorkflowId): this {
    this.context.workflowId = workflowId;
    return this;
  }

  connector(connectorId: ConnectorId): this {
    this.context.connectorId = connectorId;
    return this;
  }

  request(requestId: string, method?: string, url?: string): this {
    this.context.requestId = requestId;
    this.context.method = method;
    this.context.url = url;
    return this;
  }

  addBreadcrumb(category: string, message: string, level: 'debug' | 'info' | 'warn' | 'error', data?: Record<string, unknown>): this {
    if (!this.context.breadcrumbs) {
      this.context.breadcrumbs = [];
    }
    this.context.breadcrumbs.push({
      timestamp: new Date(),
      category,
      message,
      level,
      data
    });
    return this;
  }

  build(): ErrorContext {
    return this.context as ErrorContext;
  }
}

// Utility functions
export function isRetryableError(error: Error): boolean {
  if ('retry' in error && typeof error.retry === 'object') {
    return (error.retry as RetryInfo).isRetryable;
  }
  return false;
}

export function shouldRetry(error: SynapseError): boolean {
  if (!error.retry.isRetryable) {
    return false;
  }
  return error.retry.currentAttempt < error.retry.maxAttempts;
}

export function calculateRetryDelay(error: SynapseError): number {
  const { backoffStrategy, baseDelay, maxDelay, currentAttempt, jitter } = error.retry;
  
  let delay = baseDelay;
  
  switch (backoffStrategy) {
    case 'linear':
      delay = baseDelay * currentAttempt;
      break;
    case 'exponential':
      delay = baseDelay * Math.pow(2, currentAttempt - 1);
      break;
    case 'fixed':
      delay = baseDelay;
      break;
  }
  
  delay = Math.min(delay, maxDelay);
  
  if (jitter) {
    delay += Math.random() * delay * 0.1; // Add up to 10% jitter
  }
  
  return Math.round(delay);
}

export function createErrorFingerprint(error: SynapseError): string {
  const parts = [
    error.code,
    error.category,
    error.context?.component || 'unknown',
    error.context?.operation || 'unknown',
    error.message.replace(/\d+/g, 'N').replace(/[a-f0-9-]{8,}/gi, 'ID')
  ];
  
  return parts.join('|');
} 
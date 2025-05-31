// API contract specifications and types
// These interfaces define all REST API endpoints and WebSocket protocols

import type { 
  ApiResponse, 
  Pagination, 
  SearchParams, 
  UserId, 
  SessionId, 
  ConnectorId, 
  WorkflowId, 
  TaskId, 
  ProjectId 
} from './common';
import type { User, Session, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './auth';
import type { WorkflowSummary, WorkflowStep } from './panels';

// Base API endpoint configuration
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  tags: string[];
  authentication: boolean;
  rateLimit?: RateLimit;
}

export interface RateLimit {
  requests: number;
  window: number; // seconds
  identifier: 'ip' | 'user' | 'session';
}

// Authentication API
export interface AuthApi {
  // POST /api/auth/login
  login: {
    request: LoginRequest;
    response: ApiResponse<LoginResponse>;
  };
  
  // POST /api/auth/register
  register: {
    request: RegisterRequest;
    response: ApiResponse<RegisterResponse>;
  };
  
  // POST /api/auth/logout
  logout: {
    request: { sessionId: SessionId };
    response: ApiResponse<{ success: boolean }>;
  };
  
  // POST /api/auth/refresh
  refresh: {
    request: { refreshToken: string };
    response: ApiResponse<{ accessToken: string; expiresIn: number }>;
  };
  
  // GET /api/auth/me
  profile: {
    response: ApiResponse<User>;
  };
  
  // PUT /api/auth/profile
  updateProfile: {
    request: Partial<Pick<User, 'displayName' | 'email' | 'preferences'>>;
    response: ApiResponse<User>;
  };
}

// User Management API
export interface UserApi {
  // GET /api/users
  list: {
    query: SearchParams & {
      role?: string;
      status?: 'active' | 'inactive';
    };
    response: ApiResponse<User[]>;
  };
  
  // GET /api/users/:id
  get: {
    params: { id: UserId };
    response: ApiResponse<User>;
  };
  
  // PUT /api/users/:id
  update: {
    params: { id: UserId };
    request: Partial<User>;
    response: ApiResponse<User>;
  };
  
  // DELETE /api/users/:id
  delete: {
    params: { id: UserId };
    response: ApiResponse<{ success: boolean }>;
  };
  
  // GET /api/users/:id/sessions
  sessions: {
    params: { id: UserId };
    response: ApiResponse<Session[]>;
  };
}

// Workflow Management API
export interface WorkflowApi {
  // GET /api/workflows
  list: {
    query: SearchParams & {
      status?: 'running' | 'paused' | 'completed' | 'failed' | 'draft';
      userId?: UserId;
    };
    response: ApiResponse<WorkflowSummary[]>;
  };
  
  // POST /api/workflows
  create: {
    request: CreateWorkflowRequest;
    response: ApiResponse<WorkflowSummary>;
  };
  
  // GET /api/workflows/:id
  get: {
    params: { id: WorkflowId };
    response: ApiResponse<WorkflowDetails>;
  };
  
  // PUT /api/workflows/:id
  update: {
    params: { id: WorkflowId };
    request: UpdateWorkflowRequest;
    response: ApiResponse<WorkflowSummary>;
  };
  
  // DELETE /api/workflows/:id
  delete: {
    params: { id: WorkflowId };
    response: ApiResponse<{ success: boolean }>;
  };
  
  // POST /api/workflows/:id/execute
  execute: {
    params: { id: WorkflowId };
    request: ExecuteWorkflowRequest;
    response: ApiResponse<WorkflowExecution>;
  };
  
  // POST /api/workflows/:id/pause
  pause: {
    params: { id: WorkflowId };
    response: ApiResponse<{ success: boolean }>;
  };
  
  // POST /api/workflows/:id/resume
  resume: {
    params: { id: WorkflowId };
    response: ApiResponse<{ success: boolean }>;
  };
  
  // GET /api/workflows/:id/steps
  steps: {
    params: { id: WorkflowId };
    response: ApiResponse<WorkflowStep[]>;
  };
  
  // GET /api/workflows/:id/executions
  executions: {
    params: { id: WorkflowId };
    query: Pagination;
    response: ApiResponse<WorkflowExecution[]>;
  };
}

// Connector Management API
export interface ConnectorApi {
  // GET /api/connectors
  list: {
    query: SearchParams & {
      status?: 'connected' | 'disconnected' | 'error';
      type?: ConnectorType;
    };
    response: ApiResponse<ConnectorInfo[]>;
  };
  
  // POST /api/connectors
  create: {
    request: CreateConnectorRequest;
    response: ApiResponse<ConnectorInfo>;
  };
  
  // GET /api/connectors/:id
  get: {
    params: { id: ConnectorId };
    response: ApiResponse<ConnectorDetails>;
  };
  
  // PUT /api/connectors/:id
  update: {
    params: { id: ConnectorId };
    request: UpdateConnectorRequest;
    response: ApiResponse<ConnectorInfo>;
  };
  
  // DELETE /api/connectors/:id
  delete: {
    params: { id: ConnectorId };
    response: ApiResponse<{ success: boolean }>;
  };
  
  // POST /api/connectors/:id/connect
  connect: {
    params: { id: ConnectorId };
    response: ApiResponse<{ success: boolean; connectionId: string }>;
  };
  
  // POST /api/connectors/:id/disconnect
  disconnect: {
    params: { id: ConnectorId };
    response: ApiResponse<{ success: boolean }>;
  };
  
  // GET /api/connectors/:id/status
  status: {
    params: { id: ConnectorId };
    response: ApiResponse<ConnectorStatus>;
  };
  
  // GET /api/connectors/:id/logs
  logs: {
    params: { id: ConnectorId };
    query: Pagination & {
      level?: 'debug' | 'info' | 'warn' | 'error';
      since?: Date;
    };
    response: ApiResponse<ConnectorLogEntry[]>;
  };
}

// Analytics and Monitoring API
export interface AnalyticsApi {
  // GET /api/analytics/metrics
  metrics: {
    query: {
      metric: string[];
      timeRange: { start: Date; end: Date };
      granularity: 'minute' | 'hour' | 'day';
      filters?: Record<string, unknown>;
    };
    response: ApiResponse<MetricData[]>;
  };
  
  // GET /api/analytics/dashboard
  dashboard: {
    query: { dashboardId: string };
    response: ApiResponse<DashboardData>;
  };
  
  // GET /api/analytics/alerts
  alerts: {
    query: SearchParams & {
      severity?: 'info' | 'warning' | 'error' | 'critical';
      status?: 'active' | 'acknowledged' | 'resolved';
    };
    response: ApiResponse<AlertData[]>;
  };
  
  // POST /api/analytics/alerts/:id/acknowledge
  acknowledgeAlert: {
    params: { id: string };
    response: ApiResponse<{ success: boolean }>;
  };
}

// File and Media API
export interface FileApi {
  // POST /api/files/upload
  upload: {
    request: FormData; // multipart/form-data
    response: ApiResponse<FileUploadResult>;
  };
  
  // GET /api/files/:id
  get: {
    params: { id: string };
    response: Blob; // File stream
  };
  
  // DELETE /api/files/:id
  delete: {
    params: { id: string };
    response: ApiResponse<{ success: boolean }>;
  };
  
  // GET /api/files/:id/metadata
  metadata: {
    params: { id: string };
    response: ApiResponse<FileMetadata>;
  };
}

// System and Health API
export interface SystemApi {
  // GET /api/system/health
  health: {
    response: ApiResponse<SystemHealthStatus>;
  };
  
  // GET /api/system/info
  info: {
    response: ApiResponse<SystemInfo>;
  };
  
  // GET /api/system/version
  version: {
    response: ApiResponse<VersionInfo>;
  };
  
  // GET /api/system/config
  config: {
    response: ApiResponse<SystemConfiguration>;
  };
}

// Request/Response Type Definitions
export interface CreateWorkflowRequest {
  name: string;
  description: string;
  steps: CreateWorkflowStepRequest[];
  triggers?: CreateWorkflowTriggerRequest[];
  metadata?: Record<string, unknown>;
}

export interface CreateWorkflowStepRequest {
  name: string;
  type: 'action' | 'condition' | 'loop' | 'parallel' | 'delay';
  configuration: Record<string, unknown>;
  order: number;
  dependencies?: string[];
}

export interface CreateWorkflowTriggerRequest {
  type: 'manual' | 'schedule' | 'event' | 'webhook' | 'file' | 'api';
  configuration: Record<string, unknown>;
  isActive: boolean;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  steps?: CreateWorkflowStepRequest[];
  triggers?: CreateWorkflowTriggerRequest[];
  metadata?: Record<string, unknown>;
}

export interface ExecuteWorkflowRequest {
  parameters?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: WorkflowId;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  results: Record<string, unknown>;
  error?: string;
  stepExecutions: StepExecution[];
}

export interface StepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  input?: unknown;
  output?: unknown;
  error?: string;
}

export interface WorkflowDetails extends WorkflowSummary {
  configuration: Record<string, unknown>;
  permissions: WorkflowPermission[];
  metrics: WorkflowMetrics;
  history: WorkflowHistoryEntry[];
}

export interface WorkflowPermission {
  userId: UserId;
  role: 'owner' | 'editor' | 'viewer';
  grantedAt: Date;
  grantedBy: UserId;
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  lastExecution?: Date;
  errorCount: number;
}

export interface WorkflowHistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'executed' | 'paused' | 'resumed' | 'deleted';
  timestamp: Date;
  userId: UserId;
  details?: Record<string, unknown>;
}

export type ConnectorType = 'ai_model' | 'database' | 'api' | 'file_system' | 'hardware' | 'service';

export interface ConnectorInfo {
  id: ConnectorId;
  name: string;
  type: ConnectorType;
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  lastConnected?: Date;
  health: 'healthy' | 'degraded' | 'down';
}

export interface CreateConnectorRequest {
  name: string;
  type: ConnectorType;
  description?: string;
  configuration: ConnectorConfiguration;
}

export interface UpdateConnectorRequest {
  name?: string;
  description?: string;
  configuration?: Partial<ConnectorConfiguration>;
}

export interface ConnectorConfiguration {
  endpoint?: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  customSettings?: Record<string, unknown>;
}

export interface ConnectorDetails extends ConnectorInfo {
  configuration: ConnectorConfiguration;
  metrics: ConnectorMetrics;
  capabilities: ConnectorCapability[];
  logs: ConnectorLogEntry[];
}

export interface ConnectorStatus {
  isConnected: boolean;
  lastHeartbeat?: Date;
  responseTime?: number;
  errorCount: number;
  version?: string;
  capabilities: string[];
}

export interface ConnectorMetrics {
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

export interface ConnectorCapability {
  name: string;
  description: string;
  isEnabled: boolean;
  configuration?: Record<string, unknown>;
}

export interface ConnectorLogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface MetricData {
  name: string;
  timestamp: Date;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}

export interface DashboardData {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  refreshInterval: number;
  lastUpdated: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'text';
  title: string;
  configuration: Record<string, unknown>;
  position: { x: number; y: number; width: number; height: number };
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
}

export interface AlertData {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  source: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
  uploadedAt: Date;
  uploadedBy: UserId;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: Date;
  services: ServiceHealthStatus[];
  metrics: SystemMetric[];
}

export interface ServiceHealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  lastChecked: Date;
  message?: string;
}

export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  threshold?: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface SystemInfo {
  name: string;
  environment: 'development' | 'staging' | 'production';
  region: string;
  uptime: number;
  startedAt: Date;
  nodeVersion: string;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
}

export interface VersionInfo {
  version: string;
  buildNumber: string;
  buildDate: Date;
  gitCommit: string;
  gitBranch: string;
}

export interface SystemConfiguration {
  features: FeatureFlag[];
  limits: SystemLimits;
  settings: SystemSetting[];
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
}

export interface SystemLimits {
  maxUsers: number;
  maxWorkflows: number;
  maxConnectors: number;
  maxFileSize: number;
  requestRateLimit: number;
}

export interface SystemSetting {
  key: string;
  value: unknown;
  description: string;
  category: string;
}

// API Error Types
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
    timestamp: Date;
  };
}

// HTTP Status Code Types
export type HttpStatusCode = 
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable; 
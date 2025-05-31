// WebSocket message schemas for real-time communication
// Defines all message types and protocols for WebSocket connections

import type { 
  UserId, 
  SessionId, 
  ConnectorId, 
  WorkflowId, 
  TaskId 
} from './common';
import type { 
  WorkflowExecution, 
  StepExecution, 
  LogEntry, 
  Alert, 
  MetricData 
} from './api';

// Base WebSocket message structure
export interface WebSocketMessage<T = unknown> {
  id: string; // Unique message ID for correlation
  type: WebSocketMessageType;
  timestamp: Date;
  userId?: UserId;
  sessionId?: SessionId;
  data: T;
  correlationId?: string; // For request/response correlation
  requestId?: string; // For tracking API requests
}

// WebSocket message types
export type WebSocketMessageType =
  // Connection management
  | 'connection:auth'
  | 'connection:auth_success'
  | 'connection:auth_failure'
  | 'connection:ping'
  | 'connection:pong'
  | 'connection:error'
  | 'connection:close'
  
  // User presence and activity
  | 'user:online'
  | 'user:offline'
  | 'user:typing'
  | 'user:idle'
  | 'user:active'
  | 'user:cursor_move'
  
  // Workflow notifications
  | 'workflow:created'
  | 'workflow:updated'
  | 'workflow:started'
  | 'workflow:paused'
  | 'workflow:resumed'
  | 'workflow:completed'
  | 'workflow:failed'
  | 'workflow:step_started'
  | 'workflow:step_completed'
  | 'workflow:step_failed'
  | 'workflow:progress'
  
  // Connector status updates
  | 'connector:connected'
  | 'connector:disconnected'
  | 'connector:error'
  | 'connector:health_change'
  | 'connector:data_received'
  | 'connector:command_sent'
  | 'connector:response_received'
  
  // Chat and collaboration
  | 'chat:message'
  | 'chat:message_edit'
  | 'chat:message_delete'
  | 'chat:typing_start'
  | 'chat:typing_stop'
  | 'chat:reaction_add'
  | 'chat:reaction_remove'
  
  // Real-time editing
  | 'editor:file_open'
  | 'editor:file_close'
  | 'editor:content_change'
  | 'editor:cursor_change'
  | 'editor:selection_change'
  | 'editor:save'
  | 'editor:conflict'
  
  // System monitoring
  | 'system:alert'
  | 'system:metric_update'
  | 'system:health_change'
  | 'system:log_entry'
  | 'system:performance_warning'
  
  // Panel synchronization
  | 'panel:state_change'
  | 'panel:resize'
  | 'panel:collapse'
  | 'panel:expand'
  | 'panel:tab_change'
  
  // File system events
  | 'file:created'
  | 'file:modified'
  | 'file:deleted'
  | 'file:moved'
  | 'file:upload_progress'
  
  // Analytics and metrics
  | 'analytics:metric'
  | 'analytics:event'
  | 'analytics:dashboard_update';

// Connection management message types
export interface AuthMessage {
  token: string;
  sessionId: SessionId;
  capabilities: string[];
}

export interface AuthSuccessMessage {
  userId: UserId;
  sessionId: SessionId;
  permissions: string[];
  serverTime: Date;
}

export interface AuthFailureMessage {
  reason: 'invalid_token' | 'session_expired' | 'insufficient_permissions';
  message: string;
}

export interface PingMessage {
  timestamp: Date;
}

export interface PongMessage {
  timestamp: Date;
  serverTime: Date;
  latency?: number;
}

export interface ErrorMessage {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CloseMessage {
  reason: 'user_logout' | 'session_expired' | 'server_shutdown' | 'idle_timeout';
  message: string;
}

// User presence message types
export interface UserOnlineMessage {
  userId: UserId;
  username: string;
  location?: string; // Current page/panel
  timestamp: Date;
}

export interface UserOfflineMessage {
  userId: UserId;
  lastSeen: Date;
}

export interface UserTypingMessage {
  userId: UserId;
  location: string; // chat, editor, etc.
  isTyping: boolean;
}

export interface UserActivityMessage {
  userId: UserId;
  activity: 'active' | 'idle';
  lastActivity: Date;
}

export interface CursorMoveMessage {
  userId: UserId;
  fileId?: string;
  position: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

// Workflow notification message types
export interface WorkflowCreatedMessage {
  workflowId: WorkflowId;
  name: string;
  createdBy: UserId;
  timestamp: Date;
}

export interface WorkflowUpdatedMessage {
  workflowId: WorkflowId;
  changes: string[];
  updatedBy: UserId;
  timestamp: Date;
}

export interface WorkflowExecutionMessage {
  workflowId: WorkflowId;
  executionId: string;
  status: 'started' | 'paused' | 'resumed' | 'completed' | 'failed';
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface WorkflowStepMessage {
  workflowId: WorkflowId;
  executionId: string;
  stepId: string;
  stepName: string;
  status: 'started' | 'completed' | 'failed';
  timestamp: Date;
  duration?: number;
  output?: unknown;
  error?: string;
}

export interface WorkflowProgressMessage {
  workflowId: WorkflowId;
  executionId: string;
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  estimatedTimeRemaining?: number;
}

// Connector status message types
export interface ConnectorStatusMessage {
  connectorId: ConnectorId;
  status: 'connected' | 'disconnected' | 'error';
  previousStatus?: string;
  timestamp: Date;
  details?: {
    errorMessage?: string;
    responseTime?: number;
    retryCount?: number;
  };
}

export interface ConnectorHealthMessage {
  connectorId: ConnectorId;
  health: 'healthy' | 'degraded' | 'down';
  metrics: {
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
  timestamp: Date;
}

export interface ConnectorDataMessage {
  connectorId: ConnectorId;
  dataType: string;
  data: unknown;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ConnectorCommandMessage {
  connectorId: ConnectorId;
  commandId: string;
  command: string;
  parameters: Record<string, unknown>;
  timestamp: Date;
}

export interface ConnectorResponseMessage {
  connectorId: ConnectorId;
  commandId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  timestamp: Date;
  duration: number;
}

// Chat and collaboration message types
export interface ChatMessage {
  messageId: string;
  userId: UserId;
  username: string;
  content: string;
  timestamp: Date;
  editedAt?: Date;
  threadId?: string;
  replyTo?: string;
  attachments?: ChatAttachment[];
  metadata?: Record<string, unknown>;
}

export interface ChatAttachment {
  id: string;
  type: 'file' | 'image' | 'code' | 'link';
  name: string;
  url?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatMessageEditMessage {
  messageId: string;
  newContent: string;
  editedBy: UserId;
  editedAt: Date;
}

export interface ChatMessageDeleteMessage {
  messageId: string;
  deletedBy: UserId;
  deletedAt: Date;
  reason?: string;
}

export interface ChatReactionMessage {
  messageId: string;
  userId: UserId;
  emoji: string;
  action: 'add' | 'remove';
  timestamp: Date;
}

// Real-time editing message types
export interface EditorFileMessage {
  fileId: string;
  filePath: string;
  action: 'open' | 'close';
  userId: UserId;
  timestamp: Date;
}

export interface EditorContentChangeMessage {
  fileId: string;
  changes: EditorChange[];
  userId: UserId;
  timestamp: Date;
  version: number;
}

export interface EditorChange {
  type: 'insert' | 'delete' | 'replace';
  position: {
    line: number;
    column: number;
  };
  length?: number; // For delete/replace
  text?: string; // For insert/replace
}

export interface EditorCursorChangeMessage {
  fileId: string;
  userId: UserId;
  position: {
    line: number;
    column: number;
  };
  timestamp: Date;
}

export interface EditorSelectionChangeMessage {
  fileId: string;
  userId: UserId;
  selection: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  timestamp: Date;
}

export interface EditorSaveMessage {
  fileId: string;
  userId: UserId;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface EditorConflictMessage {
  fileId: string;
  conflictId: string;
  conflictType: 'concurrent_edit' | 'version_mismatch';
  details: {
    localVersion: number;
    serverVersion: number;
    conflictingChanges: EditorChange[];
  };
  timestamp: Date;
}

// System monitoring message types
export interface SystemAlertMessage {
  alertId: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface SystemMetricMessage {
  metrics: MetricData[];
  source: string;
  timestamp: Date;
}

export interface SystemHealthMessage {
  component: string;
  health: 'healthy' | 'degraded' | 'down';
  previousHealth?: string;
  message?: string;
  timestamp: Date;
}

export interface SystemLogMessage {
  logId: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface SystemPerformanceMessage {
  component: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

// Panel synchronization message types
export interface PanelStateChangeMessage {
  panelId: string;
  panelType: 'input' | 'creation' | 'orchestration';
  stateChange: {
    property: string;
    oldValue: unknown;
    newValue: unknown;
  };
  userId: UserId;
  timestamp: Date;
}

export interface PanelResizeMessage {
  panelId: string;
  dimensions: {
    width: number;
    height: number;
  };
  userId: UserId;
  timestamp: Date;
}

export interface PanelCollapseMessage {
  panelId: string;
  isCollapsed: boolean;
  userId: UserId;
  timestamp: Date;
}

export interface PanelTabChangeMessage {
  panelId: string;
  activeTab: string;
  previousTab?: string;
  userId: UserId;
  timestamp: Date;
}

// File system event message types
export interface FileSystemEventMessage {
  fileId: string;
  filePath: string;
  action: 'created' | 'modified' | 'deleted' | 'moved';
  userId?: UserId;
  timestamp: Date;
  details?: {
    oldPath?: string; // For moved files
    size?: number;
    mimeType?: string;
  };
}

export interface FileUploadProgressMessage {
  uploadId: string;
  filename: string;
  progress: number; // 0-100
  bytesUploaded: number;
  totalBytes: number;
  estimatedTimeRemaining?: number;
  userId: UserId;
  timestamp: Date;
}

// Analytics message types
export interface AnalyticsMetricMessage {
  metric: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface AnalyticsEventMessage {
  event: string;
  properties: Record<string, unknown>;
  userId?: UserId;
  sessionId?: SessionId;
  timestamp: Date;
}

export interface AnalyticsDashboardMessage {
  dashboardId: string;
  widgets: {
    widgetId: string;
    data: unknown;
    lastUpdated: Date;
  }[];
  timestamp: Date;
}

// WebSocket connection state
export interface WebSocketConnectionState {
  isConnected: boolean;
  connectionId?: string;
  userId?: UserId;
  sessionId?: SessionId;
  reconnectAttempts: number;
  lastPing?: Date;
  lastPong?: Date;
  latency?: number;
  subscribedChannels: string[];
}

// WebSocket subscription management
export interface SubscriptionRequest {
  action: 'subscribe' | 'unsubscribe';
  channels: string[];
  filters?: Record<string, unknown>;
}

export interface SubscriptionResponse {
  success: boolean;
  channels: string[];
  errors?: string[];
}

// Channel types for subscription management
export type WebSocketChannel =
  | `user:${UserId}`
  | `session:${SessionId}`
  | `workflow:${WorkflowId}`
  | `connector:${ConnectorId}`
  | `file:${string}`
  | 'system:alerts'
  | 'system:metrics'
  | 'system:health'
  | 'chat:global'
  | `chat:thread:${string}`
  | 'analytics:dashboard'
  | 'editor:collaborative';

// WebSocket event handlers type
export type WebSocketEventHandler<T = unknown> = (message: WebSocketMessage<T>) => void;

// WebSocket client interface
export interface WebSocketClient {
  connect(url: string, token: string): Promise<void>;
  disconnect(): void;
  send<T>(type: WebSocketMessageType, data: T, correlationId?: string): void;
  subscribe(channels: WebSocketChannel[]): Promise<void>;
  unsubscribe(channels: WebSocketChannel[]): Promise<void>;
  on<T>(type: WebSocketMessageType, handler: WebSocketEventHandler<T>): void;
  off<T>(type: WebSocketMessageType, handler: WebSocketEventHandler<T>): void;
  getConnectionState(): WebSocketConnectionState;
} 
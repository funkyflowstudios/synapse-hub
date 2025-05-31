// State management schema for Synapse-Hub
// Comprehensive store definitions and state transitions

import type { Writable, Readable, Derived } from 'svelte/store';
import type { 
  User, 
  Session, 
  UserPreferences, 
  AuthState, 
  AuthError 
} from './auth';
import type { 
  WorkflowDefinition, 
  WorkflowExecution, 
  WorkflowExecutionContext,
  WorkflowStepDefinition 
} from './workflow';
import type { 
  ConnectorInstance, 
  ConnectorStatus, 
  ConnectorMetric,
  ConnectorLog 
} from './connector';
import type { 
  Message, 
  MessageThread, 
  MessageAttachment 
} from './api';
import type { 
  UITheme, 
  UILayout, 
  PanelConfig,
  NotificationConfig 
} from './ui';
import type { 
  SynapseError, 
  ErrorReport,
  ErrorMetrics 
} from './errors';
import type { SynapseHubConfig } from './config';
import type { DataFlow } from './dataFlow';

// ==============================================
// CORE STORE INTERFACES
// ==============================================

export interface StoreDefinition<T> {
  name: string;
  type: StoreType;
  initialValue: T;
  persistence: StorePersistence;
  validation: StoreValidation<T>;
  middleware: StoreMiddleware<T>[];
  dependencies: StoreDependency[];
  subscribers: StoreSubscriber<T>[];
}

export enum StoreType {
  WRITABLE = 'writable',
  READABLE = 'readable',
  DERIVED = 'derived',
  ASYNC = 'async',
  COMPUTED = 'computed'
}

export interface StorePersistence {
  enabled: boolean;
  storage: StorageType;
  key: string;
  serializer?: SerializerType;
  encryption?: boolean;
  compression?: boolean;
  ttl?: number; // milliseconds
}

export enum StorageType {
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  INDEXED_DB = 'indexedDB',
  MEMORY = 'memory',
  SERVER = 'server'
}

export enum SerializerType {
  JSON = 'json',
  CBOR = 'cbor',
  MSGPACK = 'msgpack',
  CUSTOM = 'custom'
}

export interface StoreValidation<T> {
  enabled: boolean;
  schema?: ValidationSchema;
  rules: ValidationRule<T>[];
  onError: ValidationErrorHandler;
}

export interface ValidationSchema {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: boolean;
}

export interface ValidationRule<T> {
  name: string;
  validator: (value: T) => boolean | Promise<boolean>;
  message: string;
  severity: 'error' | 'warning';
}

export type ValidationErrorHandler = (error: ValidationError) => void;

export interface ValidationError {
  rule: string;
  message: string;
  value: unknown;
  path?: string;
}

export interface StoreMiddleware<T> {
  name: string;
  type: MiddlewareType;
  handler: MiddlewareHandler<T>;
  order: number;
  enabled: boolean;
}

export enum MiddlewareType {
  BEFORE_UPDATE = 'before_update',
  AFTER_UPDATE = 'after_update',
  ON_SUBSCRIBE = 'on_subscribe',
  ON_UNSUBSCRIBE = 'on_unsubscribe',
  ON_ERROR = 'on_error'
}

export type MiddlewareHandler<T> = (context: MiddlewareContext<T>) => T | Promise<T>;

export interface MiddlewareContext<T> {
  currentValue: T;
  newValue: T;
  metadata: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
}

export interface StoreDependency {
  storeName: string;
  type: DependencyType;
  condition?: string;
  debounce?: number; // milliseconds
}

export enum DependencyType {
  REQUIRES = 'requires',
  INVALIDATES = 'invalidates',
  DERIVES_FROM = 'derives_from',
  TRIGGERS = 'triggers'
}

export interface StoreSubscriber<T> {
  id: string;
  callback: SubscriberCallback<T>;
  filter?: SubscriberFilter<T>;
  debounce?: number; // milliseconds
  once?: boolean;
}

export type SubscriberCallback<T> = (value: T, previous: T) => void;
export type SubscriberFilter<T> = (value: T, previous: T) => boolean;

// ==============================================
// AUTHENTICATION STORES
// ==============================================

export interface AuthStoreState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  permissions: string[];
  preferences: UserPreferences | null;
  mfaRequired: boolean;
  loginAttempts: number;
  lastActivity: Date | null;
}

export interface AuthStoreActions {
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  checkPermission: (permission: string) => boolean;
  resetPassword: (email: string) => Promise<void>;
  verifyMFA: (code: string) => Promise<AuthResult>;
  impersonate: (userId: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

export interface LoginCredentials {
  username: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: AuthError;
  requiresMFA?: boolean;
}

export interface AuthStoreComputed {
  isAdmin: Readable<boolean>;
  canManageUsers: Readable<boolean>;
  canManageWorkflows: Readable<boolean>;
  canManageConnectors: Readable<boolean>;
  sessionTimeRemaining: Readable<number>;
  userDisplayName: Readable<string>;
  userInitials: Readable<string>;
}

// ==============================================
// WORKFLOW STORES
// ==============================================

export interface WorkflowStoreState {
  workflows: WorkflowDefinition[];
  activeWorkflow: WorkflowDefinition | null;
  executions: WorkflowExecution[];
  activeExecution: WorkflowExecution | null;
  executionContext: WorkflowExecutionContext | null;
  isLoading: boolean;
  isExecuting: boolean;
  error: SynapseError | null;
  filters: WorkflowFilters;
  pagination: PaginationState;
  cache: WorkflowCache;
}

export interface WorkflowFilters {
  status: string[];
  category: string[];
  createdBy: string[];
  tags: string[];
  dateRange: DateRange;
  search: string;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface WorkflowCache {
  templates: Map<string, WorkflowDefinition>;
  executions: Map<string, WorkflowExecution>;
  lastFetch: Date | null;
  ttl: number;
}

export interface WorkflowStoreActions {
  loadWorkflows: (filters?: WorkflowFilters) => Promise<void>;
  createWorkflow: (workflow: Partial<WorkflowDefinition>) => Promise<string>;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  duplicateWorkflow: (id: string, name: string) => Promise<string>;
  executeWorkflow: (id: string, parameters?: Record<string, unknown>) => Promise<string>;
  pauseExecution: (executionId: string) => Promise<void>;
  resumeExecution: (executionId: string) => Promise<void>;
  cancelExecution: (executionId: string) => Promise<void>;
  retryExecution: (executionId: string) => Promise<string>;
  loadExecutions: (workflowId?: string) => Promise<void>;
  loadExecutionLogs: (executionId: string) => Promise<void>;
  validateWorkflow: (workflow: WorkflowDefinition) => Promise<ValidationResult>;
  exportWorkflow: (id: string) => Promise<Blob>;
  importWorkflow: (file: File) => Promise<string>;
  setActiveWorkflow: (workflow: WorkflowDefinition | null) => void;
  updateFilters: (filters: Partial<WorkflowFilters>) => void;
  clearCache: () => void;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationWarning {
  message: string;
  path?: string;
  suggestion?: string;
}

export interface WorkflowStoreComputed {
  filteredWorkflows: Readable<WorkflowDefinition[]>;
  workflowsByStatus: Readable<Record<string, WorkflowDefinition[]>>;
  executionStats: Readable<ExecutionStats>;
  recentExecutions: Readable<WorkflowExecution[]>;
  workflowOptions: Readable<SelectOption[]>;
  canCreateWorkflow: Readable<boolean>;
  canExecuteWorkflow: Readable<boolean>;
}

export interface ExecutionStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  successRate: number;
  averageDuration: number;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

// ==============================================
// CONNECTOR STORES
// ==============================================

export interface ConnectorStoreState {
  connectors: ConnectorInstance[];
  activeConnector: ConnectorInstance | null;
  logs: ConnectorLog[];
  metrics: ConnectorMetric[];
  isLoading: boolean;
  isConnecting: boolean;
  error: SynapseError | null;
  filters: ConnectorFilters;
  realTimeData: Map<string, unknown>;
  subscriptions: ConnectorSubscription[];
}

export interface ConnectorFilters {
  status: ConnectorStatus[];
  type: string[];
  health: string[];
  search: string;
}

export interface ConnectorSubscription {
  connectorId: string;
  eventType: string;
  callback: (data: unknown) => void;
  active: boolean;
}

export interface ConnectorStoreActions {
  loadConnectors: () => Promise<void>;
  createConnector: (connector: Partial<ConnectorInstance>) => Promise<string>;
  updateConnector: (id: string, updates: Partial<ConnectorInstance>) => Promise<void>;
  deleteConnector: (id: string) => Promise<void>;
  connectConnector: (id: string) => Promise<void>;
  disconnectConnector: (id: string) => Promise<void>;
  testConnector: (id: string) => Promise<TestResult>;
  restartConnector: (id: string) => Promise<void>;
  loadLogs: (connectorId: string, filters?: LogFilters) => Promise<void>;
  loadMetrics: (connectorId: string, timeRange?: DateRange) => Promise<void>;
  sendCommand: (connectorId: string, command: ConnectorCommand) => Promise<CommandResult>;
  subscribeToEvents: (connectorId: string, eventType: string, callback: (data: unknown) => void) => string;
  unsubscribeFromEvents: (subscriptionId: string) => void;
  setActiveConnector: (connector: ConnectorInstance | null) => void;
  updateFilters: (filters: Partial<ConnectorFilters>) => void;
  clearLogs: (connectorId?: string) => void;
}

export interface TestResult {
  success: boolean;
  latency: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface LogFilters {
  level: string[];
  timeRange: DateRange;
  search: string;
}

export interface ConnectorCommand {
  action: string;
  parameters: Record<string, unknown>;
  timeout?: number;
}

export interface CommandResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
}

export interface ConnectorStoreComputed {
  connectedConnectors: Readable<ConnectorInstance[]>;
  connectorsByType: Readable<Record<string, ConnectorInstance[]>>;
  connectorStats: Readable<ConnectorStats>;
  healthySystems: Readable<boolean>;
  systemOverview: Readable<SystemOverview>;
}

export interface ConnectorStats {
  total: number;
  connected: number;
  disconnected: number;
  error: number;
  healthyPercentage: number;
}

export interface SystemOverview {
  totalConnectors: number;
  activeConnections: number;
  dataPointsPerSecond: number;
  alertCount: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

// ==============================================
// UI STORES
// ==============================================

export interface UIStoreState {
  theme: UITheme;
  layout: UILayout;
  panels: PanelConfig[];
  activePanel: string | null;
  sidebarCollapsed: boolean;
  notifications: NotificationState[];
  modals: ModalState[];
  loading: LoadingState[];
  breadcrumbs: Breadcrumb[];
  shortcuts: KeyboardShortcut[];
  preferences: UIPreferences;
}

export interface NotificationState {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration: number;
  persistent: boolean;
  actions: NotificationAction[];
  timestamp: Date;
  read: boolean;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style: 'primary' | 'secondary' | 'danger';
}

export interface ModalState {
  id: string;
  component: string;
  props: Record<string, unknown>;
  options: ModalOptions;
  result?: unknown;
}

export interface ModalOptions {
  closable: boolean;
  backdrop: boolean;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  centered: boolean;
  scrollable: boolean;
}

export interface LoadingState {
  id: string;
  message: string;
  progress?: number;
  cancellable: boolean;
  timestamp: Date;
}

export interface Breadcrumb {
  label: string;
  href?: string;
  active: boolean;
  icon?: string;
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  context: string;
  enabled: boolean;
}

export interface UIPreferences {
  animations: boolean;
  soundEffects: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: FontSize;
  density: Density;
  autoSave: boolean;
  confirmActions: boolean;
}

export enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

export enum Density {
  COMPACT = 'compact',
  COMFORTABLE = 'comfortable',
  SPACIOUS = 'spacious'
}

export interface UIStoreActions {
  setTheme: (theme: UITheme) => void;
  toggleSidebar: () => void;
  setActivePanel: (panelId: string | null) => void;
  addNotification: (notification: Omit<NotificationState, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;
  openModal: (component: string, props?: Record<string, unknown>, options?: Partial<ModalOptions>) => Promise<unknown>;
  closeModal: (id: string, result?: unknown) => void;
  closeAllModals: () => void;
  startLoading: (message: string, cancellable?: boolean) => string;
  updateLoading: (id: string, message?: string, progress?: number) => void;
  stopLoading: (id: string) => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (key: string, context: string) => void;
  updatePreferences: (preferences: Partial<UIPreferences>) => void;
  resetToDefaults: () => void;
}

export interface UIStoreComputed {
  isDarkTheme: Readable<boolean>;
  hasUnreadNotifications: Readable<boolean>;
  unreadNotificationCount: Readable<number>;
  isLoading: Readable<boolean>;
  activeModals: Readable<ModalState[]>;
  currentBreadcrumb: Readable<string>;
  availableShortcuts: Readable<KeyboardShortcut[]>;
}

// ==============================================
// MESSAGE STORES
// ==============================================

export interface MessageStoreState {
  threads: MessageThread[];
  activeThread: MessageThread | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: SynapseError | null;
  typingUsers: TypingUser[];
  unreadCounts: Map<string, number>;
  filters: MessageFilters;
  searchResults: MessageSearchResult[];
}

export interface TypingUser {
  userId: string;
  username: string;
  threadId: string;
  timestamp: Date;
}

export interface MessageFilters {
  threadId?: string;
  userId?: string;
  type: string[];
  dateRange: DateRange;
  search: string;
  hasAttachments?: boolean;
}

export interface MessageSearchResult {
  message: Message;
  thread: MessageThread;
  score: number;
  highlights: string[];
}

export interface MessageStoreActions {
  loadThreads: () => Promise<void>;
  createThread: (participants: string[], title?: string) => Promise<string>;
  loadMessages: (threadId: string, page?: number) => Promise<void>;
  sendMessage: (threadId: string, content: string, attachments?: MessageAttachment[]) => Promise<string>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  markAsRead: (threadId: string, messageId?: string) => Promise<void>;
  startTyping: (threadId: string) => void;
  stopTyping: (threadId: string) => void;
  searchMessages: (query: string, filters?: Partial<MessageFilters>) => Promise<void>;
  setActiveThread: (thread: MessageThread | null) => void;
  updateFilters: (filters: Partial<MessageFilters>) => void;
  uploadAttachment: (file: File) => Promise<MessageAttachment>;
  clearThread: (threadId: string) => void;
}

export interface MessageStoreComputed {
  unreadThreads: Readable<MessageThread[]>;
  totalUnreadCount: Readable<number>;
  recentMessages: Readable<Message[]>;
  activeThreadMessages: Readable<Message[]>;
  canSendMessage: Readable<boolean>;
  isUserTyping: Readable<boolean>;
}

// ==============================================
// APPLICATION STORES
// ==============================================

export interface AppStoreState {
  config: SynapseHubConfig;
  version: string;
  buildInfo: BuildInfo;
  connectionStatus: ConnectionStatus;
  systemHealth: SystemHealth;
  features: FeatureFlags;
  announcements: Announcement[];
  maintenanceMode: boolean;
  debugMode: boolean;
  analytics: AnalyticsState;
}

export interface BuildInfo {
  version: string;
  buildNumber: string;
  gitCommit: string;
  buildDate: Date;
  environment: string;
}

export interface ConnectionStatus {
  api: ConnectionState;
  websocket: ConnectionState;
  database: ConnectionState;
  connectors: Map<string, ConnectionState>;
}

export interface ConnectionState {
  connected: boolean;
  lastConnected?: Date;
  latency?: number;
  retryCount: number;
  error?: string;
}

export interface SystemHealth {
  overall: HealthStatus;
  components: Map<string, ComponentHealth>;
  lastCheck: Date;
  uptime: number;
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

export interface ComponentHealth {
  status: HealthStatus;
  message?: string;
  metrics: Record<string, number>;
  lastCheck: Date;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface Announcement {
  id: string;
  type: AnnouncementType;
  title: string;
  message: string;
  startDate: Date;
  endDate?: Date;
  dismissible: boolean;
  targetUsers?: string[];
  acknowledged: boolean;
}

export enum AnnouncementType {
  INFO = 'info',
  WARNING = 'warning',
  MAINTENANCE = 'maintenance',
  FEATURE = 'feature',
  DEPRECATED = 'deprecated'
}

export interface AnalyticsState {
  enabled: boolean;
  sessionId: string;
  events: AnalyticsEvent[];
  metrics: AnalyticsMetrics;
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  sent: boolean;
}

export interface AnalyticsMetrics {
  pageViews: number;
  sessionDuration: number;
  actions: Record<string, number>;
}

export interface AppStoreActions {
  loadConfig: () => Promise<void>;
  updateConfig: (config: Partial<SynapseHubConfig>) => Promise<void>;
  checkHealth: () => Promise<void>;
  toggleMaintenanceMode: (enabled: boolean) => Promise<void>;
  toggleDebugMode: (enabled: boolean) => void;
  acknowledgeAnnouncement: (id: string) => Promise<void>;
  dismissAnnouncement: (id: string) => Promise<void>;
  trackEvent: (type: string, properties?: Record<string, unknown>) => void;
  reportError: (error: SynapseError) => Promise<void>;
  exportLogs: (startDate?: Date, endDate?: Date) => Promise<Blob>;
  clearCache: () => Promise<void>;
  restartSystem: () => Promise<void>;
  checkForUpdates: () => Promise<UpdateInfo>;
}

export interface UpdateInfo {
  available: boolean;
  version?: string;
  releaseNotes?: string;
  required?: boolean;
  downloadUrl?: string;
}

export interface AppStoreComputed {
  isOnline: Readable<boolean>;
  systemHealthy: Readable<boolean>;
  hasActiveAnnouncements: Readable<boolean>;
  featureEnabled: (feature: string) => Readable<boolean>;
  connectionQuality: Readable<ConnectionQuality>;
}

export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  OFFLINE = 'offline'
}

// ==============================================
// STORE ORCHESTRATION
// ==============================================

export interface StoreOrchestrator {
  stores: Map<string, StoreInstance>;
  dependencies: Map<string, string[]>;
  middleware: GlobalMiddleware[];
  persistence: PersistenceManager;
  synchronization: SynchronizationManager;
}

export interface StoreInstance {
  name: string;
  store: Writable<unknown> | Readable<unknown>;
  definition: StoreDefinition<unknown>;
  subscribers: Set<string>;
  lastUpdate: Date;
  version: number;
}

export interface GlobalMiddleware {
  name: string;
  handler: (storeName: string, action: string, payload: unknown) => unknown;
  order: number;
  enabled: boolean;
}

export interface PersistenceManager {
  save: (storeName: string, value: unknown) => Promise<void>;
  load: (storeName: string) => Promise<unknown>;
  clear: (storeName: string) => Promise<void>;
  cleanup: () => Promise<void>;
}

export interface SynchronizationManager {
  sync: (storeName: string, value: unknown) => Promise<void>;
  subscribe: (storeName: string, callback: (value: unknown) => void) => string;
  unsubscribe: (subscriptionId: string) => void;
  broadcast: (event: SyncEvent) => Promise<void>;
}

export interface SyncEvent {
  type: SyncEventType;
  storeName: string;
  value: unknown;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export enum SyncEventType {
  UPDATE = 'update',
  DELETE = 'delete',
  RESET = 'reset',
  CONFLICT = 'conflict'
}

// ==============================================
// STATE TRANSITIONS
// ==============================================

export interface StateTransition<T> {
  from: StatePattern<T>;
  to: StatePattern<T>;
  trigger: TransitionTrigger;
  conditions: TransitionCondition<T>[];
  actions: TransitionAction<T>[];
  guard?: TransitionGuard<T>;
}

export interface StatePattern<T> {
  type: PatternType;
  value?: T;
  matcher?: (state: T) => boolean;
}

export enum PatternType {
  EXACT = 'exact',
  PARTIAL = 'partial',
  FUNCTION = 'function',
  ANY = 'any'
}

export interface TransitionTrigger {
  type: TriggerType;
  event?: string;
  timeout?: number;
  condition?: string;
}

export enum TriggerType {
  EVENT = 'event',
  TIMEOUT = 'timeout',
  CONDITION = 'condition',
  MANUAL = 'manual'
}

export interface TransitionCondition<T> {
  name: string;
  condition: (currentState: T, event?: unknown) => boolean;
  required: boolean;
}

export interface TransitionAction<T> {
  name: string;
  action: (currentState: T, event?: unknown) => T | Promise<T>;
  async: boolean;
  rollback?: (state: T) => T;
}

export type TransitionGuard<T> = (currentState: T, event?: unknown) => boolean;

export interface StateMachine<T> {
  name: string;
  initialState: T;
  currentState: T;
  transitions: StateTransition<T>[];
  history: StateHistory<T>[];
  context: StateMachineContext;
}

export interface StateHistory<T> {
  state: T;
  event?: unknown;
  timestamp: Date;
  transition?: string;
}

export interface StateMachineContext {
  variables: Map<string, unknown>;
  timers: Map<string, NodeJS.Timeout>;
  events: Map<string, unknown>;
}

// ==============================================
// STORE FACTORY
// ==============================================

export interface StoreFactory {
  create<T>(definition: StoreDefinition<T>): Writable<T>;
  createDerived<T, U>(stores: Readable<T>[], fn: (values: T[]) => U): Readable<U>;
  createAsync<T>(loader: () => Promise<T>, initial?: T): Readable<T>;
  createComputed<T>(fn: () => T, deps: Readable<unknown>[]): Readable<T>;
  destroy(storeName: string): void;
  reset(storeName: string): void;
  subscribe<T>(storeName: string, callback: (value: T) => void): () => void;
  getStore<T>(name: string): Writable<T> | Readable<T> | null;
  getAllStores(): Map<string, StoreInstance>;
}

export interface AsyncStoreOptions<T> {
  initial?: T;
  cache?: boolean;
  timeout?: number;
  retries?: number;
  onError?: (error: Error) => void;
  onLoading?: (loading: boolean) => void;
}

export interface ComputedStoreOptions {
  debounce?: number;
  throttle?: number;
  equalityFn?: (a: unknown, b: unknown) => boolean;
} 
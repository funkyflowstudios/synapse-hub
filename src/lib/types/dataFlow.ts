// Data flow specifications for Synapse-Hub
// Comprehensive data flow patterns and transformations across all components

import type { 
  UserId, 
  WorkflowId, 
  ConnectorId, 
  TaskId,
  BaseEntity,
  Priority 
} from './common';
import type { User } from './auth';
import type { WorkflowDefinition, WorkflowExecution } from './workflow';
import type { ConnectorInstance } from './connector';

// Core data flow patterns
export interface DataFlow {
  id: string;
  name: string;
  description: string;
  type: DataFlowType;
  source: DataSource;
  destination: DataDestination;
  transformations: DataTransformation[];
  triggers: DataFlowTrigger[];
  conditions: DataFlowCondition[];
  metadata: DataFlowMetadata;
  status: DataFlowStatus;
  metrics: DataFlowMetrics;
}

export enum DataFlowType {
  REAL_TIME = 'real_time',
  BATCH = 'batch',
  STREAMING = 'streaming',
  EVENT_DRIVEN = 'event_driven',
  SCHEDULED = 'scheduled',
  MANUAL = 'manual'
}

export enum DataFlowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

// Data sources and destinations
export interface DataSource {
  id: string;
  type: DataSourceType;
  config: DataSourceConfig;
  schema: DataSchema;
  authentication: DataSourceAuth;
  monitoring: DataSourceMonitoring;
}

export interface DataDestination {
  id: string;
  type: DataDestinationType;
  config: DataDestinationConfig;
  schema: DataSchema;
  authentication: DataDestinationAuth;
  monitoring: DataDestinationMonitoring;
}

export enum DataSourceType {
  // UI Components
  INPUT_CONTROL_NEXUS = 'input_control_nexus',
  CO_CREATION_CANVAS = 'co_creation_canvas',
  ORCHESTRATION_FORESIGHT = 'orchestration_foresight',
  
  // System Components
  DATABASE = 'database',
  API = 'api',
  WEBSOCKET = 'websocket',
  FILE_SYSTEM = 'file_system',
  
  // External Sources
  CONNECTOR = 'connector',
  WEBHOOK = 'webhook',
  EXTERNAL_API = 'external_api',
  MESSAGE_QUEUE = 'message_queue',
  
  // AI Sources
  AI_PROVIDER = 'ai_provider',
  AI_CACHE = 'ai_cache',
  
  // User Sources
  USER_INPUT = 'user_input',
  USER_UPLOAD = 'user_upload',
  USER_INTERACTION = 'user_interaction'
}

export enum DataDestinationType {
  // UI Components
  INPUT_CONTROL_NEXUS = 'input_control_nexus',
  CO_CREATION_CANVAS = 'co_creation_canvas',
  ORCHESTRATION_FORESIGHT = 'orchestration_foresight',
  
  // System Components
  DATABASE = 'database',
  API_RESPONSE = 'api_response',
  WEBSOCKET_BROADCAST = 'websocket_broadcast',
  FILE_SYSTEM = 'file_system',
  
  // External Destinations
  CONNECTOR = 'connector',
  WEBHOOK = 'webhook',
  EXTERNAL_API = 'external_api',
  MESSAGE_QUEUE = 'message_queue',
  
  // AI Destinations
  AI_PROVIDER = 'ai_provider',
  AI_CACHE = 'ai_cache',
  
  // User Destinations
  USER_NOTIFICATION = 'user_notification',
  USER_DOWNLOAD = 'user_download',
  USER_DISPLAY = 'user_display'
}

// Data schemas and validation
export interface DataSchema {
  version: string;
  fields: DataField[];
  constraints: DataConstraint[];
  relationships: DataRelationship[];
  indexes: DataIndex[];
  validation: DataValidation;
}

export interface DataField {
  name: string;
  type: DataFieldType;
  required: boolean;
  nullable: boolean;
  defaultValue?: unknown;
  description: string;
  constraints: FieldConstraint[];
  metadata: Record<string, unknown>;
}

export enum DataFieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  JSON = 'json',
  ARRAY = 'array',
  OBJECT = 'object',
  BINARY = 'binary',
  UUID = 'uuid',
  EMAIL = 'email',
  URL = 'url',
  ENUM = 'enum'
}

export interface FieldConstraint {
  type: ConstraintType;
  value: unknown;
  message: string;
}

export enum ConstraintType {
  MIN_LENGTH = 'min_length',
  MAX_LENGTH = 'max_length',
  MIN_VALUE = 'min_value',
  MAX_VALUE = 'max_value',
  PATTERN = 'pattern',
  ENUM_VALUES = 'enum_values',
  UNIQUE = 'unique',
  FOREIGN_KEY = 'foreign_key',
  CUSTOM = 'custom'
}

export interface DataConstraint {
  name: string;
  type: DataConstraintType;
  fields: string[];
  condition: string;
  message: string;
}

export enum DataConstraintType {
  PRIMARY_KEY = 'primary_key',
  FOREIGN_KEY = 'foreign_key',
  UNIQUE = 'unique',
  CHECK = 'check',
  NOT_NULL = 'not_null',
  DEFAULT = 'default'
}

export interface DataRelationship {
  name: string;
  type: RelationshipType;
  sourceField: string;
  targetEntity: string;
  targetField: string;
  cascadeDelete: boolean;
  cascadeUpdate: boolean;
}

export enum RelationshipType {
  ONE_TO_ONE = 'one_to_one',
  ONE_TO_MANY = 'one_to_many',
  MANY_TO_ONE = 'many_to_one',
  MANY_TO_MANY = 'many_to_many'
}

export interface DataIndex {
  name: string;
  fields: string[];
  unique: boolean;
  type: IndexType;
  condition?: string;
}

export enum IndexType {
  BTREE = 'btree',
  HASH = 'hash',
  GIN = 'gin',
  GIST = 'gist',
  FULLTEXT = 'fulltext'
}

export interface DataValidation {
  enabled: boolean;
  strict: boolean;
  rules: ValidationRule[];
  customValidators: CustomValidator[];
}

export interface ValidationRule {
  field: string;
  type: ValidationType;
  parameters: Record<string, unknown>;
  message: string;
  severity: ValidationSeverity;
}

export enum ValidationType {
  REQUIRED = 'required',
  TYPE = 'type',
  FORMAT = 'format',
  RANGE = 'range',
  LENGTH = 'length',
  PATTERN = 'pattern',
  CUSTOM = 'custom'
}

export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface CustomValidator {
  name: string;
  function: string; // function name or code
  parameters: Record<string, unknown>;
  async: boolean;
}

// Data transformations
export interface DataTransformation {
  id: string;
  name: string;
  type: TransformationType;
  order: number;
  enabled: boolean;
  config: TransformationConfig;
  inputSchema: DataSchema;
  outputSchema: DataSchema;
  conditions: TransformationCondition[];
  errorHandling: TransformationErrorHandling;
}

export enum TransformationType {
  MAP = 'map',
  FILTER = 'filter',
  AGGREGATE = 'aggregate',
  JOIN = 'join',
  SPLIT = 'split',
  MERGE = 'merge',
  VALIDATE = 'validate',
  ENRICH = 'enrich',
  NORMALIZE = 'normalize',
  CUSTOM = 'custom'
}

export interface TransformationConfig {
  function?: string;
  parameters?: Record<string, unknown>;
  mapping?: FieldMapping[];
  conditions?: string[];
  aggregations?: Aggregation[];
  joins?: JoinConfig[];
}

export interface FieldMapping {
  source: string;
  destination: string;
  transformation?: string;
  defaultValue?: unknown;
  required: boolean;
}

export interface Aggregation {
  field: string;
  function: AggregationFunction;
  groupBy?: string[];
  having?: string;
  alias?: string;
}

export enum AggregationFunction {
  COUNT = 'count',
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  FIRST = 'first',
  LAST = 'last',
  DISTINCT = 'distinct'
}

export interface JoinConfig {
  type: JoinType;
  source: string;
  target: string;
  condition: string;
  fields?: string[];
}

export enum JoinType {
  INNER = 'inner',
  LEFT = 'left',
  RIGHT = 'right',
  FULL = 'full',
  CROSS = 'cross'
}

export interface TransformationCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logicalOperator?: LogicalOperator;
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null'
}

export enum LogicalOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not'
}

export interface TransformationErrorHandling {
  strategy: ErrorHandlingStrategy;
  retries: number;
  timeout: number; // milliseconds
  fallback?: unknown;
  skipOnError: boolean;
  logErrors: boolean;
}

export enum ErrorHandlingStrategy {
  FAIL_FAST = 'fail_fast',
  SKIP_RECORD = 'skip_record',
  USE_DEFAULT = 'use_default',
  RETRY = 'retry',
  CUSTOM = 'custom'
}

// Data flow triggers and conditions
export interface DataFlowTrigger {
  id: string;
  type: TriggerType;
  config: TriggerConfig;
  enabled: boolean;
  conditions: TriggerCondition[];
}

export enum TriggerType {
  SCHEDULE = 'schedule',
  EVENT = 'event',
  WEBHOOK = 'webhook',
  FILE_CHANGE = 'file_change',
  DATA_CHANGE = 'data_change',
  USER_ACTION = 'user_action',
  SYSTEM_EVENT = 'system_event',
  MANUAL = 'manual'
}

export interface TriggerConfig {
  schedule?: ScheduleConfig;
  event?: EventConfig;
  webhook?: WebhookConfig;
  fileWatch?: FileWatchConfig;
  dataWatch?: DataWatchConfig;
  userAction?: UserActionConfig;
}

export interface ScheduleConfig {
  cron: string;
  timezone: string;
  startDate?: Date;
  endDate?: Date;
  maxRuns?: number;
}

export interface EventConfig {
  eventType: string;
  source: string;
  filters: EventFilter[];
}

export interface EventFilter {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface WebhookConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  authentication: WebhookAuth;
  validation: WebhookValidation;
}

export interface WebhookAuth {
  type: WebhookAuthType;
  config: Record<string, unknown>;
}

export enum WebhookAuthType {
  NONE = 'none',
  BASIC = 'basic',
  BEARER = 'bearer',
  API_KEY = 'api_key',
  HMAC = 'hmac'
}

export interface WebhookValidation {
  enabled: boolean;
  signature: string;
  timestamp: boolean;
  ipWhitelist: string[];
}

export interface FileWatchConfig {
  path: string;
  pattern: string;
  recursive: boolean;
  events: FileWatchEvent[];
}

export enum FileWatchEvent {
  CREATE = 'create',
  MODIFY = 'modify',
  DELETE = 'delete',
  MOVE = 'move'
}

export interface DataWatchConfig {
  entity: string;
  operations: DataOperation[];
  fields?: string[];
  conditions?: DataWatchCondition[];
}

export enum DataOperation {
  INSERT = 'insert',
  UPDATE = 'update',
  DELETE = 'delete',
  SELECT = 'select'
}

export interface DataWatchCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface UserActionConfig {
  action: UserActionType;
  component?: string;
  permissions?: string[];
}

export enum UserActionType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
  SHARE = 'share',
  CUSTOM = 'custom'
}

export interface TriggerCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  required: boolean;
}

export interface DataFlowCondition {
  id: string;
  name: string;
  expression: string;
  enabled: boolean;
  errorOnFail: boolean;
}

// Data flow metadata and monitoring
export interface DataFlowMetadata {
  created: Date;
  updated: Date;
  createdBy: UserId;
  updatedBy: UserId;
  version: string;
  tags: string[];
  category: string;
  priority: Priority;
  dependencies: DataFlowDependency[];
  documentation: DataFlowDocumentation;
}

export interface DataFlowDependency {
  id: string;
  type: DependencyType;
  required: boolean;
  version?: string;
}

export enum DependencyType {
  DATA_FLOW = 'data_flow',
  CONNECTOR = 'connector',
  WORKFLOW = 'workflow',
  API = 'api',
  SERVICE = 'service'
}

export interface DataFlowDocumentation {
  description: string;
  purpose: string;
  inputs: string;
  outputs: string;
  transformations: string;
  examples: DataFlowExample[];
  troubleshooting: TroubleshootingGuide[];
}

export interface DataFlowExample {
  name: string;
  description: string;
  input: unknown;
  output: unknown;
  config: Record<string, unknown>;
}

export interface TroubleshootingGuide {
  issue: string;
  symptoms: string[];
  causes: string[];
  solutions: string[];
}

export interface DataFlowMetrics {
  executions: ExecutionMetrics;
  performance: PerformanceMetrics;
  errors: ErrorMetrics;
  data: DataMetrics;
}

export interface ExecutionMetrics {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  lastExecution: Date;
  averageExecutionTime: number; // milliseconds
  executionHistory: ExecutionRecord[];
}

export interface ExecutionRecord {
  id: string;
  startTime: Date;
  endTime: Date;
  status: ExecutionStatus;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: ExecutionError[];
  metadata: Record<string, unknown>;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

export interface ExecutionError {
  timestamp: Date;
  stage: string;
  message: string;
  details: Record<string, unknown>;
  recordId?: string;
}

export interface PerformanceMetrics {
  throughput: ThroughputMetrics;
  latency: LatencyMetrics;
  resource: ResourceMetrics;
}

export interface ThroughputMetrics {
  recordsPerSecond: number;
  bytesPerSecond: number;
  peakThroughput: number;
  averageThroughput: number;
}

export interface LatencyMetrics {
  averageLatency: number; // milliseconds
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
}

export interface ResourceMetrics {
  cpuUsage: number; // percentage
  memoryUsage: number; // MB
  diskUsage: number; // MB
  networkUsage: number; // KB/s
}

export interface ErrorMetrics {
  errorRate: number; // percentage
  errorsByType: Record<string, number>;
  errorsByStage: Record<string, number>;
  recentErrors: ExecutionError[];
}

export interface DataMetrics {
  recordsProcessed: number;
  bytesProcessed: number;
  recordsPerExecution: number;
  dataQuality: DataQualityMetrics;
}

export interface DataQualityMetrics {
  completeness: number; // percentage
  accuracy: number; // percentage
  consistency: number; // percentage
  validity: number; // percentage
  uniqueness: number; // percentage
}

// Specific data flow configurations
export interface DataSourceConfig {
  connection: ConnectionConfig;
  query?: QueryConfig;
  polling?: PollingConfig;
  streaming?: StreamingConfig;
  batch?: BatchConfig;
}

export interface DataDestinationConfig {
  connection: ConnectionConfig;
  output?: OutputConfig;
  buffering?: BufferingConfig;
  partitioning?: PartitioningConfig;
}

export interface ConnectionConfig {
  type: ConnectionType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  timeout?: number;
  poolSize?: number;
  retries?: number;
  [key: string]: unknown;
}

export enum ConnectionType {
  DATABASE = 'database',
  HTTP = 'http',
  WEBSOCKET = 'websocket',
  FILE = 'file',
  MEMORY = 'memory',
  QUEUE = 'queue',
  STREAM = 'stream'
}

export interface QueryConfig {
  query: string;
  parameters: Record<string, unknown>;
  timeout: number;
  fetchSize: number;
  cursor: boolean;
}

export interface PollingConfig {
  interval: number; // milliseconds
  maxRecords: number;
  offset: number;
  orderBy: string;
  incremental: boolean;
  watermark?: string;
}

export interface StreamingConfig {
  topic: string;
  partition?: number;
  offset?: string;
  groupId?: string;
  autoCommit: boolean;
  batchSize: number;
}

export interface BatchConfig {
  size: number;
  timeout: number; // milliseconds
  parallel: boolean;
  maxConcurrency: number;
}

export interface OutputConfig {
  format: OutputFormat;
  compression?: CompressionType;
  encoding?: string;
  headers?: boolean;
  delimiter?: string;
  quoteChar?: string;
  escapeChar?: string;
}

export enum OutputFormat {
  JSON = 'json',
  CSV = 'csv',
  XML = 'xml',
  PARQUET = 'parquet',
  AVRO = 'avro',
  BINARY = 'binary',
  TEXT = 'text'
}

export enum CompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  BZIP2 = 'bzip2',
  LZ4 = 'lz4',
  SNAPPY = 'snappy'
}

export interface BufferingConfig {
  enabled: boolean;
  size: number;
  timeout: number; // milliseconds
  flushOnShutdown: boolean;
}

export interface PartitioningConfig {
  enabled: boolean;
  strategy: PartitioningStrategy;
  field: string;
  format?: string;
  maxPartitions?: number;
}

export enum PartitioningStrategy {
  HASH = 'hash',
  RANGE = 'range',
  LIST = 'list',
  TIME = 'time',
  SIZE = 'size'
}

// Authentication configurations
export interface DataSourceAuth {
  type: AuthType;
  config: AuthConfig;
  rotation?: AuthRotationConfig;
}

export interface DataDestinationAuth {
  type: AuthType;
  config: AuthConfig;
  rotation?: AuthRotationConfig;
}

export enum AuthType {
  NONE = 'none',
  BASIC = 'basic',
  BEARER = 'bearer',
  API_KEY = 'api_key',
  OAUTH = 'oauth',
  JWT = 'jwt',
  CERTIFICATE = 'certificate',
  CUSTOM = 'custom'
}

export interface AuthConfig {
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string[];
  tokenUrl?: string;
  certificate?: string;
  privateKey?: string;
  [key: string]: unknown;
}

export interface AuthRotationConfig {
  enabled: boolean;
  interval: number; // hours
  preRotationTime: number; // minutes
  retainOldCredentials: number; // count
}

// Monitoring configurations
export interface DataSourceMonitoring {
  enabled: boolean;
  metrics: MonitoringMetrics;
  alerts: MonitoringAlert[];
  healthCheck: HealthCheckConfig;
}

export interface DataDestinationMonitoring {
  enabled: boolean;
  metrics: MonitoringMetrics;
  alerts: MonitoringAlert[];
  healthCheck: HealthCheckConfig;
}

export interface MonitoringMetrics {
  availability: boolean;
  latency: boolean;
  throughput: boolean;
  errors: boolean;
  dataQuality: boolean;
}

export interface MonitoringAlert {
  name: string;
  condition: string;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  cooldown: number; // minutes
  channels: string[];
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // seconds
  timeout: number; // milliseconds
  retries: number;
  endpoint?: string;
  query?: string;
}

// Component-specific data flows
export interface PanelDataFlow {
  panelId: string;
  panelType: PanelType;
  inputs: PanelInput[];
  outputs: PanelOutput[];
  state: PanelState;
  subscriptions: PanelSubscription[];
}

export enum PanelType {
  INPUT_CONTROL_NEXUS = 'input_control_nexus',
  CO_CREATION_CANVAS = 'co_creation_canvas',
  ORCHESTRATION_FORESIGHT = 'orchestration_foresight'
}

export interface PanelInput {
  source: DataSourceType;
  type: PanelInputType;
  schema: DataSchema;
  validation: DataValidation;
  transformation?: DataTransformation;
}

export enum PanelInputType {
  USER_INPUT = 'user_input',
  SYSTEM_DATA = 'system_data',
  EXTERNAL_DATA = 'external_data',
  REAL_TIME_UPDATE = 'real_time_update'
}

export interface PanelOutput {
  destination: DataDestinationType;
  type: PanelOutputType;
  schema: DataSchema;
  transformation?: DataTransformation;
  conditions?: DataFlowCondition[];
}

export enum PanelOutputType {
  USER_DISPLAY = 'user_display',
  SYSTEM_UPDATE = 'system_update',
  EXTERNAL_SYNC = 'external_sync',
  EVENT_TRIGGER = 'event_trigger'
}

export interface PanelState {
  current: Record<string, unknown>;
  previous: Record<string, unknown>;
  changes: StateChange[];
  version: number;
  lastUpdated: Date;
}

export interface StateChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: Date;
  userId?: UserId;
  source: string;
}

export interface PanelSubscription {
  eventType: string;
  source: string;
  handler: string;
  filters: EventFilter[];
  enabled: boolean;
}

// Workflow data flows
export interface WorkflowDataFlow {
  workflowId: WorkflowId;
  steps: WorkflowStepDataFlow[];
  globalInputs: WorkflowInput[];
  globalOutputs: WorkflowOutput[];
  dataContext: WorkflowDataContext;
}

export interface WorkflowStepDataFlow {
  stepId: string;
  inputs: StepInput[];
  outputs: StepOutput[];
  transformations: DataTransformation[];
  conditions: DataFlowCondition[];
}

export interface StepInput {
  name: string;
  source: StepInputSource;
  type: DataFieldType;
  required: boolean;
  defaultValue?: unknown;
  validation?: DataValidation;
}

export enum StepInputSource {
  WORKFLOW_INPUT = 'workflow_input',
  PREVIOUS_STEP = 'previous_step',
  EXTERNAL_DATA = 'external_data',
  USER_INPUT = 'user_input',
  SYSTEM_DATA = 'system_data'
}

export interface StepOutput {
  name: string;
  destination: StepOutputDestination;
  type: DataFieldType;
  transformation?: DataTransformation;
  conditions?: DataFlowCondition[];
}

export enum StepOutputDestination {
  WORKFLOW_OUTPUT = 'workflow_output',
  NEXT_STEP = 'next_step',
  EXTERNAL_SYSTEM = 'external_system',
  USER_NOTIFICATION = 'user_notification',
  SYSTEM_UPDATE = 'system_update'
}

export interface WorkflowInput {
  name: string;
  type: DataFieldType;
  required: boolean;
  description: string;
  defaultValue?: unknown;
  validation?: DataValidation;
}

export interface WorkflowOutput {
  name: string;
  type: DataFieldType;
  description: string;
  transformation?: DataTransformation;
  conditions?: DataFlowCondition[];
}

export interface WorkflowDataContext {
  variables: WorkflowVariable[];
  constants: WorkflowConstant[];
  secrets: WorkflowSecret[];
  cache: WorkflowCache;
}

export interface WorkflowVariable {
  name: string;
  type: DataFieldType;
  value: unknown;
  scope: VariableScope;
  mutable: boolean;
}

export enum VariableScope {
  GLOBAL = 'global',
  STEP = 'step',
  EXECUTION = 'execution'
}

export interface WorkflowConstant {
  name: string;
  type: DataFieldType;
  value: unknown;
  description: string;
}

export interface WorkflowSecret {
  name: string;
  type: SecretType;
  encrypted: boolean;
  rotatable: boolean;
  expiresAt?: Date;
}

export enum SecretType {
  PASSWORD = 'password',
  API_KEY = 'api_key',
  TOKEN = 'token',
  CERTIFICATE = 'certificate',
  PRIVATE_KEY = 'private_key'
}

export interface WorkflowCache {
  enabled: boolean;
  ttl: number; // seconds
  maxSize: number;
  strategy: CacheStrategy;
  keys: CacheKey[];
}

export enum CacheStrategy {
  LRU = 'lru',
  LFU = 'lfu',
  FIFO = 'fifo',
  TTL = 'ttl'
}

export interface CacheKey {
  name: string;
  pattern: string;
  ttl?: number;
  dependencies: string[];
}

// Connector data flows
export interface ConnectorDataFlow {
  connectorId: ConnectorId;
  protocol: ConnectorProtocol;
  inputs: ConnectorInput[];
  outputs: ConnectorOutput[];
  bidirectional: boolean;
  streaming: boolean;
  buffering: ConnectorBuffering;
}

export enum ConnectorProtocol {
  HTTP = 'http',
  WEBSOCKET = 'websocket',
  MQTT = 'mqtt',
  TCP = 'tcp',
  UDP = 'udp',
  SERIAL = 'serial',
  I2C = 'i2c',
  SPI = 'spi',
  CUSTOM = 'custom'
}

export interface ConnectorInput {
  name: string;
  type: ConnectorInputType;
  schema: DataSchema;
  frequency?: number; // Hz
  buffering?: boolean;
  validation?: DataValidation;
}

export enum ConnectorInputType {
  SENSOR_DATA = 'sensor_data',
  COMMAND = 'command',
  CONFIGURATION = 'configuration',
  STATUS = 'status',
  EVENT = 'event'
}

export interface ConnectorOutput {
  name: string;
  type: ConnectorOutputType;
  schema: DataSchema;
  frequency?: number; // Hz
  buffering?: boolean;
  transformation?: DataTransformation;
}

export enum ConnectorOutputType {
  SENSOR_READING = 'sensor_reading',
  ACTUATOR_CONTROL = 'actuator_control',
  STATUS_UPDATE = 'status_update',
  ALERT = 'alert',
  TELEMETRY = 'telemetry'
}

export interface ConnectorBuffering {
  enabled: boolean;
  size: number;
  timeout: number; // milliseconds
  strategy: BufferingStrategy;
  overflow: OverflowStrategy;
}

export enum BufferingStrategy {
  FIFO = 'fifo',
  LIFO = 'lifo',
  PRIORITY = 'priority',
  TIME_BASED = 'time_based'
}

export enum OverflowStrategy {
  DROP_OLDEST = 'drop_oldest',
  DROP_NEWEST = 'drop_newest',
  BLOCK = 'block',
  ERROR = 'error'
}

// Data flow orchestration
export interface DataFlowOrchestration {
  id: string;
  name: string;
  flows: DataFlow[];
  dependencies: FlowDependency[];
  execution: OrchestrationExecution;
  monitoring: OrchestrationMonitoring;
}

export interface FlowDependency {
  sourceFlow: string;
  targetFlow: string;
  type: DependencyType;
  condition?: string;
  timeout?: number; // milliseconds
}

export interface OrchestrationExecution {
  strategy: ExecutionStrategy;
  parallelism: number;
  timeout: number; // milliseconds
  retries: number;
  errorHandling: OrchestrationErrorHandling;
}

export enum ExecutionStrategy {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  CONDITIONAL = 'conditional',
  EVENT_DRIVEN = 'event_driven'
}

export interface OrchestrationErrorHandling {
  strategy: ErrorHandlingStrategy;
  rollback: boolean;
  compensation: CompensationAction[];
  notification: boolean;
}

export interface CompensationAction {
  flow: string;
  action: string;
  parameters: Record<string, unknown>;
  timeout: number; // milliseconds
}

export interface OrchestrationMonitoring {
  enabled: boolean;
  metrics: OrchestrationMetrics;
  alerts: MonitoringAlert[];
  dashboard: DashboardConfig;
}

export interface OrchestrationMetrics {
  executionTime: boolean;
  throughput: boolean;
  errorRate: boolean;
  resourceUsage: boolean;
  dataQuality: boolean;
}

export interface DashboardConfig {
  enabled: boolean;
  refreshInterval: number; // seconds
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
}

export interface DashboardWidget {
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  position: WidgetPosition;
}

export enum WidgetType {
  METRIC = 'metric',
  CHART = 'chart',
  TABLE = 'table',
  LOG = 'log',
  STATUS = 'status'
}

export interface WidgetConfig {
  metric?: string;
  timeRange?: string;
  aggregation?: AggregationFunction;
  filters?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardFilter {
  name: string;
  type: FilterType;
  values: unknown[];
  defaultValue?: unknown;
}

export enum FilterType {
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  DATE_RANGE = 'date_range',
  TEXT = 'text',
  NUMBER_RANGE = 'number_range'
} 
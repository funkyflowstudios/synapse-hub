// Workflow management types extending the panel workflow types
// These provide detailed workflow orchestration and execution capabilities

import type { BaseEntity, Priority, UserId, WorkflowId, TaskId, ConnectorId } from './common';
import type { WorkflowSummary, WorkflowStep, WorkflowTrigger } from './panels';

// Extended workflow interfaces
export interface WorkflowDefinition extends WorkflowSummary {
  version: string;
  tags: string[];
  category: WorkflowCategory;
  visibility: 'public' | 'private' | 'team';
  template: boolean;
  templateOf?: WorkflowId;
  variables: WorkflowVariable[];
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  permissions: WorkflowPermission[];
  dependencies: WorkflowDependency[];
  validation: WorkflowValidation;
  scheduling: WorkflowScheduling;
  monitoring: WorkflowMonitoring;
  retry: RetryConfiguration;
  timeout: TimeoutConfiguration;
}

export type WorkflowCategory = 
  | 'automation'
  | 'data_processing'
  | 'ai_ml'
  | 'integration'
  | 'testing'
  | 'deployment'
  | 'monitoring'
  | 'custom';

export interface WorkflowVariable {
  name: string;
  type: VariableType;
  defaultValue?: unknown;
  description?: string;
  isRequired: boolean;
  isSecret: boolean;
  validation?: VariableValidation;
}

export type VariableType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'file';

export interface VariableValidation {
  pattern?: string; // regex pattern
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  allowedValues?: unknown[];
  customValidator?: string; // function name
}

export interface WorkflowInput {
  name: string;
  type: VariableType;
  description: string;
  isRequired: boolean;
  defaultValue?: unknown;
  source: InputSource;
  mapping?: string; // JSONPath or expression
}

export type InputSource = 'user' | 'trigger' | 'connector' | 'workflow' | 'environment' | 'constant';

export interface WorkflowOutput {
  name: string;
  type: VariableType;
  description: string;
  destination: OutputDestination;
  mapping?: string;
  format?: OutputFormat;
}

export type OutputDestination = 'return' | 'connector' | 'webhook' | 'file' | 'database' | 'variable';

export interface OutputFormat {
  type: 'json' | 'xml' | 'csv' | 'text' | 'binary';
  encoding?: string;
  compression?: 'gzip' | 'zip';
  encryption?: EncryptionConfig;
}

export interface EncryptionConfig {
  algorithm: 'AES256' | 'RSA';
  keyId?: string;
  enabled: boolean;
}

export interface WorkflowPermission {
  userId?: UserId;
  teamId?: string;
  role?: string;
  permission: WorkflowPermissionType;
  grantedBy: UserId;
  grantedAt: Date;
  expiresAt?: Date;
}

export type WorkflowPermissionType = 'view' | 'edit' | 'execute' | 'manage' | 'admin';

export interface WorkflowDependency {
  type: DependencyType;
  identifier: string;
  version?: string;
  isRequired: boolean;
  fallback?: WorkflowFallback;
}

export type DependencyType = 'workflow' | 'connector' | 'service' | 'file' | 'environment';

export interface WorkflowFallback {
  action: 'skip' | 'default' | 'error' | 'retry';
  value?: unknown;
  workflowId?: WorkflowId;
}

export interface WorkflowValidation {
  syntax: ValidationRule[];
  semantic: ValidationRule[];
  runtime: ValidationRule[];
  custom: CustomValidation[];
}

export interface ValidationRule {
  id: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  pattern?: string;
  condition?: string;
  enabled: boolean;
}

export interface CustomValidation {
  name: string;
  script: string;
  language: 'javascript' | 'python';
  timeout: number;
  enabled: boolean;
}

export interface WorkflowScheduling {
  enabled: boolean;
  timezone: string;
  schedule?: CronSchedule | IntervalSchedule | DateSchedule;
  concurrency: ConcurrencyConfig;
  queue: QueueConfig;
}

export interface CronSchedule {
  type: 'cron';
  expression: string;
  description?: string;
}

export interface IntervalSchedule {
  type: 'interval';
  value: number;
  unit: 'minutes' | 'hours' | 'days';
  startAt?: Date;
  endAt?: Date;
}

export interface DateSchedule {
  type: 'date';
  runAt: Date;
  repeat?: boolean;
  repeatInterval?: number;
  repeatUnit?: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
}

export interface ConcurrencyConfig {
  maxConcurrent: number;
  queueingStrategy: 'fifo' | 'lifo' | 'priority';
  allowOverlap: boolean;
  skipIfRunning: boolean;
}

export interface QueueConfig {
  name: string;
  priority: number;
  maxRetries: number;
  retryDelay: number;
  deadLetterQueue?: string;
}

export interface WorkflowMonitoring {
  enabled: boolean;
  metrics: MonitoringMetric[];
  alerts: MonitoringAlert[];
  logging: LoggingConfig;
  tracing: TracingConfig;
}

export interface MonitoringMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  description: string;
  labels: string[];
  enabled: boolean;
}

export interface MonitoringAlert {
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: AlertChannel[];
  enabled: boolean;
  cooldown: number; // minutes
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  configuration: Record<string, unknown>;
  enabled: boolean;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  includeContext: boolean;
  includeStackTrace: boolean;
  destination: 'console' | 'file' | 'database' | 'external';
  format: 'json' | 'text';
  retention: number; // days
}

export interface TracingConfig {
  enabled: boolean;
  samplingRate: number; // 0-1
  includeInputs: boolean;
  includeOutputs: boolean;
  exporter: 'jaeger' | 'zipkin' | 'otlp';
  endpoint?: string;
}

export interface RetryConfiguration {
  enabled: boolean;
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  multiplier: number;
  retryableErrors: string[];
  nonRetryableErrors: string[];
}

export interface TimeoutConfiguration {
  enabled: boolean;
  workflowTimeout: number; // seconds
  stepTimeout: number; // seconds
  connectorTimeout: number; // seconds
  onTimeout: 'fail' | 'retry' | 'skip' | 'default';
}

// Enhanced step types
export interface WorkflowStepDefinition extends WorkflowStep {
  description?: string;
  icon?: string;
  category: StepCategory;
  connector?: ConnectorReference;
  inputMapping: StepInputMapping;
  outputMapping: StepOutputMapping;
  errorHandling: StepErrorHandling;
  conditions: StepCondition[];
  loops: LoopConfiguration;
  parallel: ParallelConfiguration;
  subworkflow?: SubworkflowConfiguration;
  human: HumanTaskConfiguration;
  validation: StepValidation;
}

export type StepCategory = 
  | 'data'
  | 'logic'
  | 'integration'
  | 'ai'
  | 'notification'
  | 'file'
  | 'database'
  | 'http'
  | 'custom';

export interface ConnectorReference {
  connectorId: ConnectorId;
  operation: string;
  configuration: Record<string, unknown>;
  timeout?: number;
  retries?: number;
}

export interface StepInputMapping {
  [inputName: string]: {
    source: 'workflow' | 'step' | 'trigger' | 'constant' | 'expression';
    value: unknown;
    expression?: string;
    validation?: VariableValidation;
  };
}

export interface StepOutputMapping {
  [outputName: string]: {
    destination: 'workflow' | 'step' | 'return';
    path?: string;
    transform?: string;
  };
}

export interface StepErrorHandling {
  strategy: 'fail' | 'continue' | 'retry' | 'fallback';
  retries?: number;
  retryDelay?: number;
  fallbackStep?: string;
  fallbackValue?: unknown;
  continueOnError: boolean;
  logErrors: boolean;
}

export interface StepCondition {
  id: string;
  expression: string;
  description?: string;
  enabled: boolean;
  action: 'run' | 'skip' | 'goto';
  target?: string; // step ID for goto
}

export interface LoopConfiguration {
  enabled: boolean;
  type: 'for' | 'while' | 'foreach';
  condition?: string;
  items?: string; // array expression
  variable?: string; // loop variable name
  maxIterations: number;
  continueOnError: boolean;
  parallel: boolean;
  batchSize?: number;
}

export interface ParallelConfiguration {
  enabled: boolean;
  branches: ParallelBranch[];
  strategy: 'all' | 'any' | 'first' | 'majority';
  timeout?: number;
  failFast: boolean;
  collectResults: boolean;
}

export interface ParallelBranch {
  id: string;
  name: string;
  steps: string[]; // step IDs
  condition?: string;
  weight?: number; // for load balancing
}

export interface SubworkflowConfiguration {
  workflowId: WorkflowId;
  version?: string;
  inputMapping: Record<string, unknown>;
  outputMapping: Record<string, string>;
  async: boolean;
  timeout?: number;
}

export interface HumanTaskConfiguration {
  enabled: boolean;
  assignee?: UserId;
  role?: string;
  title: string;
  description: string;
  form?: FormConfiguration;
  priority: Priority;
  dueDate?: Date;
  escalation?: EscalationConfiguration;
}

export interface FormConfiguration {
  fields: FormField[];
  layout: 'vertical' | 'horizontal' | 'grid';
  validation: FormValidation;
  styling?: FormStyling;
}

export interface FormField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'file';
  label: string;
  placeholder?: string;
  defaultValue?: unknown;
  required: boolean;
  readonly: boolean;
  validation?: FieldValidation;
  options?: FormFieldOption[];
  conditionalDisplay?: ConditionalDisplay;
}

export interface FormFieldOption {
  label: string;
  value: unknown;
  disabled?: boolean;
  group?: string;
}

export interface ConditionalDisplay {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  customValidator?: string;
  errorMessage?: string;
}

export interface FormValidation {
  validateOnChange: boolean;
  validateOnSubmit: boolean;
  customValidators: string[];
}

export interface FormStyling {
  theme: 'default' | 'compact' | 'spacious';
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
}

export interface EscalationConfiguration {
  enabled: boolean;
  levels: EscalationLevel[];
  autoEscalate: boolean;
  escalationDelay: number; // minutes
}

export interface EscalationLevel {
  level: number;
  assignee?: UserId;
  role?: string;
  notificationChannels: string[];
  deadline: number; // minutes from previous level
}

export interface StepValidation {
  preConditions: ValidationRule[];
  postConditions: ValidationRule[];
  dataValidation: DataValidationRule[];
}

export interface DataValidationRule {
  field: string;
  type: VariableType;
  validation: VariableValidation;
  required: boolean;
  sanitization?: SanitizationRule;
}

export interface SanitizationRule {
  trim: boolean;
  toLowerCase: boolean;
  removeHtml: boolean;
  escapeHtml: boolean;
  customSanitizer?: string;
}

// Workflow execution context
export interface WorkflowExecutionContext {
  executionId: string;
  workflowId: WorkflowId;
  userId: UserId;
  variables: Record<string, unknown>;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  stepResults: Record<string, unknown>;
  environment: ExecutionEnvironment;
  state: ExecutionState;
  history: ExecutionEvent[];
  metrics: ExecutionMetrics;
  trace: ExecutionTrace;
}

export interface ExecutionEnvironment {
  platform: string;
  region: string;
  instance: string;
  version: string;
  resources: ResourceLimits;
  secrets: Record<string, string>;
  configuration: Record<string, unknown>;
}

export interface ResourceLimits {
  maxMemory: number; // MB
  maxCpu: number; // cores
  maxExecutionTime: number; // seconds
  maxConcurrentSteps: number;
  maxDataSize: number; // bytes
}

export interface ExecutionState {
  phase: 'initializing' | 'running' | 'waiting' | 'completing' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  pausedAt?: string;
  resumeAt?: Date;
  progress: number; // 0-100
  errors: ExecutionError[];
  warnings: ExecutionWarning[];
}

export interface ExecutionError {
  stepId?: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  fatal: boolean;
  retry: boolean;
}

export interface ExecutionWarning {
  stepId?: string;
  code: string;
  message: string;
  timestamp: Date;
}

export interface ExecutionEvent {
  id: string;
  type: ExecutionEventType;
  stepId?: string;
  timestamp: Date;
  data?: Record<string, unknown>;
  duration?: number;
}

export type ExecutionEventType =
  | 'workflow_started'
  | 'workflow_completed'
  | 'workflow_failed'
  | 'workflow_cancelled'
  | 'workflow_paused'
  | 'workflow_resumed'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'step_skipped'
  | 'step_retried'
  | 'condition_evaluated'
  | 'loop_iteration'
  | 'parallel_branch_completed'
  | 'human_task_created'
  | 'human_task_completed'
  | 'connector_called'
  | 'error_occurred'
  | 'warning_raised';

export interface ExecutionMetrics {
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  stepsExecuted: number;
  stepsSkipped: number;
  stepsFailed: number;
  retriesAttempted: number;
  memoryUsed: number; // bytes
  cpuUsed: number; // percentage
  dataProcessed: number; // bytes
  connectorsUsed: string[];
  cost?: ExecutionCost;
}

export interface ExecutionCost {
  compute: number;
  storage: number;
  network: number;
  connectors: number;
  total: number;
  currency: string;
}

export interface ExecutionTrace {
  traceId: string;
  spans: TraceSpan[];
  samplingRate: number;
  baggage: Record<string, string>;
}

export interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tags: Record<string, unknown>;
  logs: TraceLog[];
  status: 'ok' | 'error' | 'timeout';
}

export interface TraceLog {
  timestamp: Date;
  fields: Record<string, unknown>;
  level: 'debug' | 'info' | 'warn' | 'error';
}

// Workflow templates and patterns
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  tags: string[];
  version: string;
  author: UserId;
  definition: Partial<WorkflowDefinition>;
  parameters: TemplateParameter[];
  examples: TemplateExample[];
  documentation: string;
  rating: number;
  downloads: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateParameter {
  name: string;
  type: VariableType;
  description: string;
  defaultValue?: unknown;
  required: boolean;
  validation?: VariableValidation;
  group?: string;
}

export interface TemplateExample {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  expectedOutput?: Record<string, unknown>;
}

export interface WorkflowPattern {
  id: string;
  name: string;
  type: PatternType;
  description: string;
  structure: PatternStructure;
  applicability: PatternApplicability;
  benefits: string[];
  tradeoffs: string[];
  examples: string[];
}

export type PatternType = 
  | 'creational'
  | 'structural'
  | 'behavioral'
  | 'integration'
  | 'error_handling'
  | 'performance';

export interface PatternStructure {
  components: PatternComponent[];
  relationships: PatternRelationship[];
  constraints: PatternConstraint[];
}

export interface PatternComponent {
  name: string;
  type: 'step' | 'group' | 'condition' | 'loop' | 'connector';
  role: string;
  properties: Record<string, unknown>;
}

export interface PatternRelationship {
  from: string;
  to: string;
  type: 'sequence' | 'parallel' | 'conditional' | 'loop' | 'data_flow';
  properties?: Record<string, unknown>;
}

export interface PatternConstraint {
  type: 'ordering' | 'cardinality' | 'dependency' | 'resource';
  description: string;
  rule: string;
}

export interface PatternApplicability {
  scenarios: string[];
  requirements: string[];
  antipatterns: string[];
  alternatives: string[];
} 
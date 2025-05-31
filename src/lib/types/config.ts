// Configuration schema types for Synapse-Hub
// Comprehensive configuration management for all components

import type { UserId } from './common';

// Main application configuration
export interface SynapseHubConfig {
  app: AppConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  api: ApiConfig;
  websocket: WebSocketConfig;
  connectors: ConnectorConfig;
  ai: AIConfig;
  storage: StorageConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
  features: FeatureFlags;
  deployment: DeploymentConfig;
  integrations: IntegrationsConfig;
}

// Application configuration
export interface AppConfig {
  name: string;
  version: string;
  environment: Environment;
  debug: boolean;
  logLevel: LogLevel;
  baseUrl: string;
  port: number;
  host: string;
  timezone: string;
  locale: string;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  session: SessionConfig;
}

export type Environment = 'development' | 'staging' | 'production' | 'test';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface CorsConfig {
  enabled: boolean;
  origins: string[];
  methods: string[];
  headers: string[];
  credentials: boolean;
  maxAge: number;
}

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator?: string; // function name
  onLimitReached?: string; // function name
}

export interface SessionConfig {
  secret: string;
  name: string;
  maxAge: number; // milliseconds
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  rolling: boolean;
  saveUninitialized: boolean;
  resave: boolean;
}

// Database configuration
export interface DatabaseConfig {
  type: DatabaseType;
  url: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl: boolean;
  pool: PoolConfig;
  migrations: MigrationConfig;
  backup: BackupConfig;
  monitoring: DatabaseMonitoringConfig;
}

export type DatabaseType = 'sqlite' | 'postgresql' | 'mysql' | 'mongodb';

export interface PoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

export interface MigrationConfig {
  enabled: boolean;
  directory: string;
  tableName: string;
  schemaName?: string;
  disableTransactions: boolean;
}

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // cron expression
  retention: number; // days
  destination: string;
  compression: boolean;
  encryption: boolean;
}

export interface DatabaseMonitoringConfig {
  enabled: boolean;
  slowQueryThreshold: number; // milliseconds
  logQueries: boolean;
  logSlowQueries: boolean;
  metricsCollection: boolean;
}

// Authentication configuration
export interface AuthConfig {
  providers: AuthProviderConfig[];
  jwt: JwtConfig;
  oauth: OAuthConfig;
  mfa: MfaConfig;
  password: PasswordConfig;
  session: AuthSessionConfig;
  security: AuthSecurityConfig;
}

export interface AuthProviderConfig {
  name: string;
  type: AuthProviderType;
  enabled: boolean;
  config: Record<string, unknown>;
  priority: number;
}

export type AuthProviderType = 'local' | 'oauth' | 'saml' | 'ldap' | 'openid';

export interface JwtConfig {
  secret: string;
  algorithm: JwtAlgorithm;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
  clockTolerance: number;
}

export type JwtAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';

export interface OAuthConfig {
  providers: OAuthProviderConfig[];
  callbackUrl: string;
  successRedirect: string;
  failureRedirect: string;
}

export interface OAuthProviderConfig {
  name: string;
  clientId: string;
  clientSecret: string;
  scope: string[];
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  enabled: boolean;
}

export interface MfaConfig {
  enabled: boolean;
  required: boolean;
  providers: MfaProviderConfig[];
  backupCodes: BackupCodesConfig;
}

export interface MfaProviderConfig {
  type: MfaProviderType;
  enabled: boolean;
  config: Record<string, unknown>;
}

export type MfaProviderType = 'totp' | 'sms' | 'email' | 'hardware';

export interface BackupCodesConfig {
  enabled: boolean;
  count: number;
  length: number;
  regenerateOnUse: boolean;
}

export interface PasswordConfig {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  forbiddenPasswords: string[];
  hashRounds: number;
  resetTokenExpiry: number; // minutes
}

export interface AuthSessionConfig {
  maxConcurrentSessions: number;
  sessionTimeout: number; // minutes
  rememberMeDuration: number; // days
  lockoutThreshold: number;
  lockoutDuration: number; // minutes
}

export interface AuthSecurityConfig {
  bruteForceProtection: boolean;
  ipWhitelist: string[];
  ipBlacklist: string[];
  requireEmailVerification: boolean;
  allowPasswordReset: boolean;
  auditLogging: boolean;
}

// API configuration
export interface ApiConfig {
  version: string;
  prefix: string;
  documentation: ApiDocumentationConfig;
  validation: ApiValidationConfig;
  serialization: SerializationConfig;
  pagination: PaginationConfig;
  versioning: VersioningConfig;
}

export interface ApiDocumentationConfig {
  enabled: boolean;
  title: string;
  description: string;
  version: string;
  contact: ContactInfo;
  license: LicenseInfo;
  servers: ServerInfo[];
}

export interface ContactInfo {
  name: string;
  email: string;
  url: string;
}

export interface LicenseInfo {
  name: string;
  url: string;
}

export interface ServerInfo {
  url: string;
  description: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  default: string;
  description?: string;
  enum?: string[];
}

export interface ApiValidationConfig {
  enabled: boolean;
  strictMode: boolean;
  coerceTypes: boolean;
  removeAdditional: boolean;
  useDefaults: boolean;
  allErrors: boolean;
}

export interface SerializationConfig {
  dateFormat: string;
  numberFormat: string;
  booleanFormat: string;
  nullFormat: string;
  prettyPrint: boolean;
}

export interface PaginationConfig {
  defaultLimit: number;
  maxLimit: number;
  limitParam: string;
  offsetParam: string;
  pageParam: string;
  sizeParam: string;
}

export interface VersioningConfig {
  strategy: VersioningStrategy;
  headerName: string;
  paramName: string;
  defaultVersion: string;
  supportedVersions: string[];
}

export type VersioningStrategy = 'header' | 'query' | 'path' | 'accept';

// WebSocket configuration
export interface WebSocketConfig {
  enabled: boolean;
  port: number;
  path: string;
  cors: CorsConfig;
  heartbeat: HeartbeatConfig;
  compression: CompressionConfig;
  limits: WebSocketLimitsConfig;
  authentication: WebSocketAuthConfig;
}

export interface HeartbeatConfig {
  enabled: boolean;
  interval: number; // milliseconds
  timeout: number; // milliseconds
}

export interface CompressionConfig {
  enabled: boolean;
  threshold: number; // bytes
  level: number; // 1-9
}

export interface WebSocketLimitsConfig {
  maxConnections: number;
  maxConnectionsPerIp: number;
  maxMessageSize: number; // bytes
  maxMessagesPerSecond: number;
  connectionTimeout: number; // milliseconds
}

export interface WebSocketAuthConfig {
  required: boolean;
  tokenParam: string;
  cookieAuth: boolean;
  headerAuth: boolean;
}

// Connector configuration
export interface ConnectorConfig {
  enabled: boolean;
  discovery: ConnectorDiscoveryConfig;
  registry: ConnectorRegistryConfig;
  execution: ConnectorExecutionConfig;
  monitoring: ConnectorMonitoringConfig;
  security: ConnectorSecurityConfig;
}

export interface ConnectorDiscoveryConfig {
  enabled: boolean;
  interval: number; // seconds
  timeout: number; // seconds
  retries: number;
  sources: DiscoverySource[];
}

export interface DiscoverySource {
  type: DiscoverySourceType;
  config: Record<string, unknown>;
  enabled: boolean;
}

export type DiscoverySourceType = 'filesystem' | 'registry' | 'network' | 'database';

export interface ConnectorRegistryConfig {
  url: string;
  authentication: RegistryAuthConfig;
  caching: CachingConfig;
  verification: VerificationConfig;
}

export interface RegistryAuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth';
  credentials: Record<string, string>;
}

export interface CachingConfig {
  enabled: boolean;
  ttl: number; // seconds
  maxSize: number;
  strategy: CacheStrategy;
}

export type CacheStrategy = 'lru' | 'lfu' | 'fifo' | 'ttl';

export interface VerificationConfig {
  enabled: boolean;
  requireSignature: boolean;
  trustedPublishers: string[];
  allowedSources: string[];
}

export interface ConnectorExecutionConfig {
  timeout: number; // seconds
  retries: number;
  concurrency: number;
  isolation: IsolationConfig;
  resources: ResourceLimitsConfig;
}

export interface IsolationConfig {
  enabled: boolean;
  type: IsolationType;
  config: Record<string, unknown>;
}

export type IsolationType = 'process' | 'container' | 'vm' | 'sandbox';

export interface ResourceLimitsConfig {
  memory: number; // MB
  cpu: number; // percentage
  disk: number; // MB
  network: number; // KB/s
  processes: number;
  fileDescriptors: number;
}

export interface ConnectorMonitoringConfig {
  enabled: boolean;
  metrics: boolean;
  logging: boolean;
  tracing: boolean;
  healthChecks: boolean;
  alerting: boolean;
}

export interface ConnectorSecurityConfig {
  sandboxing: boolean;
  networkAccess: NetworkAccessConfig;
  fileSystemAccess: FileSystemAccessConfig;
  environmentVariables: EnvironmentVariablesConfig;
}

export interface NetworkAccessConfig {
  enabled: boolean;
  allowedHosts: string[];
  blockedHosts: string[];
  allowedPorts: number[];
  blockedPorts: number[];
}

export interface FileSystemAccessConfig {
  enabled: boolean;
  allowedPaths: string[];
  blockedPaths: string[];
  readOnly: boolean;
}

export interface EnvironmentVariablesConfig {
  allowed: string[];
  blocked: string[];
  passthrough: boolean;
}

// AI configuration
export interface AIConfig {
  providers: AIProviderConfig[];
  defaultProvider: string;
  fallbackProvider: string;
  routing: AIRoutingConfig;
  caching: AICachingConfig;
  monitoring: AIMonitoringConfig;
  safety: AISafetyConfig;
}

export interface AIProviderConfig {
  name: string;
  type: AIProviderType;
  enabled: boolean;
  config: AIProviderSpecificConfig;
  limits: AIProviderLimits;
  priority: number;
}

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'azure' | 'local' | 'custom';

export interface AIProviderSpecificConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
  [key: string]: unknown;
}

export interface AIProviderLimits {
  requestsPerMinute: number;
  requestsPerDay: number;
  tokensPerMinute: number;
  tokensPerDay: number;
  maxConcurrentRequests: number;
}

export interface AIRoutingConfig {
  strategy: AIRoutingStrategy;
  loadBalancing: LoadBalancingConfig;
  failover: FailoverConfig;
}

export type AIRoutingStrategy = 'round_robin' | 'weighted' | 'least_connections' | 'response_time' | 'cost';

export interface LoadBalancingConfig {
  weights: Record<string, number>;
  healthCheckInterval: number; // seconds
  unhealthyThreshold: number;
  healthyThreshold: number;
}

export interface FailoverConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number; // milliseconds
  circuitBreaker: CircuitBreakerConfig;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number; // milliseconds
  halfOpenMaxCalls: number;
}

export interface AICachingConfig {
  enabled: boolean;
  ttl: number; // seconds
  maxSize: number;
  keyStrategy: CacheKeyStrategy;
  invalidation: CacheInvalidationConfig;
}

export type CacheKeyStrategy = 'full' | 'semantic' | 'hash' | 'custom';

export interface CacheInvalidationConfig {
  strategy: InvalidationStrategy;
  maxAge: number; // seconds
  triggers: string[];
}

export type InvalidationStrategy = 'ttl' | 'lru' | 'manual' | 'event';

export interface AIMonitoringConfig {
  enabled: boolean;
  metrics: AIMetricsConfig;
  logging: AILoggingConfig;
  alerting: AIAlertingConfig;
}

export interface AIMetricsConfig {
  responseTime: boolean;
  tokenUsage: boolean;
  errorRate: boolean;
  costTracking: boolean;
  qualityScoring: boolean;
}

export interface AILoggingConfig {
  requests: boolean;
  responses: boolean;
  errors: boolean;
  sanitization: boolean;
  retention: number; // days
}

export interface AIAlertingConfig {
  enabled: boolean;
  thresholds: AIAlertThresholds;
  channels: string[];
}

export interface AIAlertThresholds {
  responseTime: number; // milliseconds
  errorRate: number; // percentage
  tokenUsage: number; // per hour
  cost: number; // per hour
}

export interface AISafetyConfig {
  contentFiltering: ContentFilteringConfig;
  outputValidation: OutputValidationConfig;
  biasDetection: BiasDetectionConfig;
  privacyProtection: PrivacyProtectionConfig;
}

export interface ContentFilteringConfig {
  enabled: boolean;
  filters: ContentFilter[];
  action: FilterAction;
}

export interface ContentFilter {
  type: FilterType;
  severity: FilterSeverity;
  enabled: boolean;
  config: Record<string, unknown>;
}

export type FilterType = 'profanity' | 'violence' | 'sexual' | 'hate' | 'self_harm' | 'illegal' | 'custom';
export type FilterSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FilterAction = 'block' | 'warn' | 'sanitize' | 'log';

export interface OutputValidationConfig {
  enabled: boolean;
  maxLength: number;
  allowedFormats: string[];
  sanitization: boolean;
  structureValidation: boolean;
}

export interface BiasDetectionConfig {
  enabled: boolean;
  categories: BiasCategory[];
  threshold: number;
  action: BiasAction;
}

export type BiasCategory = 'gender' | 'race' | 'age' | 'religion' | 'political' | 'cultural';
export type BiasAction = 'block' | 'warn' | 'correct' | 'log';

export interface PrivacyProtectionConfig {
  enabled: boolean;
  piiDetection: boolean;
  dataMinimization: boolean;
  anonymization: boolean;
  retention: number; // days
}

// Storage configuration
export interface StorageConfig {
  providers: StorageProviderConfig[];
  defaultProvider: string;
  encryption: StorageEncryptionConfig;
  backup: StorageBackupConfig;
  cleanup: StorageCleanupConfig;
}

export interface StorageProviderConfig {
  name: string;
  type: StorageProviderType;
  enabled: boolean;
  config: StorageProviderSpecificConfig;
  limits: StorageProviderLimits;
}

export type StorageProviderType = 'local' | 's3' | 'gcs' | 'azure' | 'ftp' | 'sftp';

export interface StorageProviderSpecificConfig {
  path?: string;
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  endpoint?: string;
  [key: string]: unknown;
}

export interface StorageProviderLimits {
  maxFileSize: number; // bytes
  maxTotalSize: number; // bytes
  allowedTypes: string[];
  blockedTypes: string[];
}

export interface StorageEncryptionConfig {
  enabled: boolean;
  algorithm: EncryptionAlgorithm;
  keyRotation: KeyRotationConfig;
}

export type EncryptionAlgorithm = 'AES256' | 'AES128' | 'ChaCha20';

export interface KeyRotationConfig {
  enabled: boolean;
  interval: number; // days
  retainOldKeys: number;
}

export interface StorageBackupConfig {
  enabled: boolean;
  schedule: string; // cron expression
  retention: number; // days
  compression: boolean;
  encryption: boolean;
  destinations: string[];
}

export interface StorageCleanupConfig {
  enabled: boolean;
  schedule: string; // cron expression
  rules: CleanupRule[];
}

export interface CleanupRule {
  name: string;
  pattern: string;
  maxAge: number; // days
  maxSize: number; // bytes
  enabled: boolean;
}

// Monitoring configuration
export interface MonitoringConfig {
  enabled: boolean;
  metrics: MetricsConfig;
  logging: LoggingConfig;
  tracing: TracingConfig;
  alerting: AlertingConfig;
  health: HealthConfig;
}

export interface MetricsConfig {
  enabled: boolean;
  provider: MetricsProvider;
  config: MetricsProviderConfig;
  collection: MetricsCollectionConfig;
  retention: MetricsRetentionConfig;
}

export type MetricsProvider = 'prometheus' | 'datadog' | 'newrelic' | 'custom';

export interface MetricsProviderConfig {
  endpoint?: string;
  apiKey?: string;
  namespace?: string;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export interface MetricsCollectionConfig {
  interval: number; // seconds
  batchSize: number;
  timeout: number; // milliseconds
  retries: number;
}

export interface MetricsRetentionConfig {
  raw: number; // days
  aggregated: number; // days
  compressed: number; // days
}

export interface LoggingConfig {
  enabled: boolean;
  level: LogLevel;
  format: LogFormat;
  destinations: LogDestination[];
  rotation: LogRotationConfig;
  filtering: LogFilteringConfig;
}

export type LogFormat = 'json' | 'text' | 'structured';

export interface LogDestination {
  type: LogDestinationType;
  config: LogDestinationConfig;
  enabled: boolean;
}

export type LogDestinationType = 'console' | 'file' | 'syslog' | 'elasticsearch' | 'splunk';

export interface LogDestinationConfig {
  path?: string;
  host?: string;
  port?: number;
  index?: string;
  [key: string]: unknown;
}

export interface LogRotationConfig {
  enabled: boolean;
  maxSize: number; // MB
  maxFiles: number;
  maxAge: number; // days
  compress: boolean;
}

export interface LogFilteringConfig {
  enabled: boolean;
  rules: LogFilterRule[];
  sampling: LogSamplingConfig;
}

export interface LogFilterRule {
  level: LogLevel;
  component: string;
  message: string;
  action: LogFilterAction;
}

export type LogFilterAction = 'include' | 'exclude' | 'sample';

export interface LogSamplingConfig {
  enabled: boolean;
  rate: number; // 0-1
  strategy: SamplingStrategy;
}

export type SamplingStrategy = 'random' | 'deterministic' | 'adaptive';

export interface TracingConfig {
  enabled: boolean;
  provider: TracingProvider;
  config: TracingProviderConfig;
  sampling: TracingSamplingConfig;
  export: TracingExportConfig;
}

export type TracingProvider = 'jaeger' | 'zipkin' | 'datadog' | 'newrelic';

export interface TracingProviderConfig {
  endpoint?: string;
  apiKey?: string;
  serviceName?: string;
  [key: string]: unknown;
}

export interface TracingSamplingConfig {
  strategy: TracingSamplingStrategy;
  rate: number; // 0-1
  maxTracesPerSecond: number;
}

export type TracingSamplingStrategy = 'constant' | 'probabilistic' | 'rate_limiting' | 'adaptive';

export interface TracingExportConfig {
  batchSize: number;
  timeout: number; // milliseconds
  retries: number;
  compression: boolean;
}

export interface AlertingConfig {
  enabled: boolean;
  providers: AlertingProviderConfig[];
  rules: AlertingRule[];
  escalation: AlertingEscalationConfig;
}

export interface AlertingProviderConfig {
  name: string;
  type: AlertingProviderType;
  enabled: boolean;
  config: AlertingProviderSpecificConfig;
}

export type AlertingProviderType = 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty';

export interface AlertingProviderSpecificConfig {
  webhook?: string;
  token?: string;
  channel?: string;
  [key: string]: unknown;
}

export interface AlertingRule {
  name: string;
  condition: string;
  severity: AlertSeverity;
  enabled: boolean;
  cooldown: number; // minutes
  providers: string[];
}

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AlertingEscalationConfig {
  enabled: boolean;
  levels: EscalationLevel[];
  timeout: number; // minutes
}

export interface EscalationLevel {
  level: number;
  delay: number; // minutes
  providers: string[];
  assignees: UserId[];
}

export interface HealthConfig {
  enabled: boolean;
  endpoint: string;
  checks: HealthCheck[];
  timeout: number; // milliseconds
  interval: number; // seconds
}

export interface HealthCheck {
  name: string;
  type: HealthCheckType;
  config: HealthCheckConfig;
  enabled: boolean;
  timeout: number; // milliseconds
}

export type HealthCheckType = 'database' | 'redis' | 'http' | 'tcp' | 'custom';

export interface HealthCheckConfig {
  url?: string;
  host?: string;
  port?: number;
  query?: string;
  [key: string]: unknown;
}

// Security configuration
export interface SecurityConfig {
  encryption: EncryptionConfig;
  certificates: CertificateConfig;
  firewall: FirewallConfig;
  audit: AuditConfig;
  compliance: ComplianceConfig;
}

export interface EncryptionConfig {
  atRest: EncryptionAtRestConfig;
  inTransit: EncryptionInTransitConfig;
  keyManagement: KeyManagementConfig;
}

export interface EncryptionAtRestConfig {
  enabled: boolean;
  algorithm: EncryptionAlgorithm;
  keySize: number;
  provider: EncryptionProvider;
}

export type EncryptionProvider = 'local' | 'aws_kms' | 'azure_kv' | 'gcp_kms' | 'hashicorp_vault';

export interface EncryptionInTransitConfig {
  enabled: boolean;
  tlsVersion: TlsVersion;
  cipherSuites: string[];
  certificateValidation: boolean;
}

export type TlsVersion = '1.2' | '1.3';

export interface KeyManagementConfig {
  provider: KeyManagementProvider;
  rotation: KeyRotationConfig;
  backup: KeyBackupConfig;
}

export type KeyManagementProvider = 'local' | 'aws_kms' | 'azure_kv' | 'gcp_kms' | 'vault';

export interface KeyBackupConfig {
  enabled: boolean;
  schedule: string; // cron expression
  encryption: boolean;
  destinations: string[];
}

export interface CertificateConfig {
  ssl: SslConfig;
  ca: CaConfig;
  client: ClientCertConfig;
}

export interface SslConfig {
  enabled: boolean;
  certificate: string;
  privateKey: string;
  certificateChain?: string;
  autoRenewal: AutoRenewalConfig;
}

export interface AutoRenewalConfig {
  enabled: boolean;
  provider: CertificateProvider;
  daysBeforeExpiry: number;
  config: Record<string, unknown>;
}

export type CertificateProvider = 'letsencrypt' | 'custom' | 'manual';

export interface CaConfig {
  enabled: boolean;
  certificates: string[];
  verification: CaVerificationConfig;
}

export interface CaVerificationConfig {
  enabled: boolean;
  strict: boolean;
  allowSelfSigned: boolean;
}

export interface ClientCertConfig {
  enabled: boolean;
  required: boolean;
  certificates: string[];
}

export interface FirewallConfig {
  enabled: boolean;
  rules: FirewallRule[];
  defaultAction: FirewallAction;
  logging: boolean;
}

export interface FirewallRule {
  name: string;
  source: string;
  destination: string;
  port: number | string;
  protocol: FirewallProtocol;
  action: FirewallAction;
  enabled: boolean;
}

export type FirewallProtocol = 'tcp' | 'udp' | 'icmp' | 'any';
export type FirewallAction = 'allow' | 'deny' | 'log';

export interface AuditConfig {
  enabled: boolean;
  events: AuditEvent[];
  storage: AuditStorageConfig;
  retention: AuditRetentionConfig;
  alerting: AuditAlertingConfig;
}

export interface AuditEvent {
  type: AuditEventType;
  enabled: boolean;
  details: AuditEventDetails;
}

export type AuditEventType = 'auth' | 'data' | 'admin' | 'system' | 'api' | 'workflow';

export interface AuditEventDetails {
  includeRequest: boolean;
  includeResponse: boolean;
  includeUser: boolean;
  includeTimestamp: boolean;
  includeIpAddress: boolean;
  includeUserAgent: boolean;
}

export interface AuditStorageConfig {
  type: AuditStorageType;
  config: AuditStorageSpecificConfig;
  encryption: boolean;
  compression: boolean;
}

export type AuditStorageType = 'database' | 'file' | 'syslog' | 'elasticsearch';

export interface AuditStorageSpecificConfig {
  path?: string;
  table?: string;
  index?: string;
  [key: string]: unknown;
}

export interface AuditRetentionConfig {
  enabled: boolean;
  period: number; // days
  archival: AuditArchivalConfig;
}

export interface AuditArchivalConfig {
  enabled: boolean;
  destination: string;
  compression: boolean;
  encryption: boolean;
}

export interface AuditAlertingConfig {
  enabled: boolean;
  rules: AuditAlertRule[];
  providers: string[];
}

export interface AuditAlertRule {
  name: string;
  condition: string;
  severity: AlertSeverity;
  enabled: boolean;
  cooldown: number; // minutes
}

export interface ComplianceConfig {
  frameworks: ComplianceFramework[];
  reporting: ComplianceReportingConfig;
  controls: ComplianceControl[];
}

export interface ComplianceFramework {
  name: ComplianceFrameworkType;
  enabled: boolean;
  version: string;
  config: Record<string, unknown>;
}

export type ComplianceFrameworkType = 'gdpr' | 'hipaa' | 'sox' | 'pci_dss' | 'iso27001';

export interface ComplianceReportingConfig {
  enabled: boolean;
  schedule: string; // cron expression
  format: ReportFormat;
  recipients: string[];
  retention: number; // days
}

export type ReportFormat = 'pdf' | 'html' | 'json' | 'csv';

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  framework: ComplianceFrameworkType;
  enabled: boolean;
  automated: boolean;
  config: Record<string, unknown>;
}

// Feature flags
export interface FeatureFlags {
  [key: string]: FeatureFlag;
}

export interface FeatureFlag {
  enabled: boolean;
  rollout: RolloutConfig;
  conditions: FeatureFlagCondition[];
  metadata: FeatureFlagMetadata;
}

export interface RolloutConfig {
  percentage: number; // 0-100
  strategy: RolloutStrategy;
  groups: string[];
  users: UserId[];
}

export type RolloutStrategy = 'percentage' | 'groups' | 'users' | 'gradual';

export interface FeatureFlagCondition {
  type: ConditionType;
  operator: ConditionOperator;
  value: unknown;
  enabled: boolean;
}

export type ConditionType = 'user_id' | 'user_role' | 'user_group' | 'environment' | 'date' | 'custom';
export type ConditionOperator = 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';

export interface FeatureFlagMetadata {
  description: string;
  owner: string;
  created: Date;
  updated: Date;
  tags: string[];
}

// Deployment configuration
export interface DeploymentConfig {
  environment: Environment;
  region: string;
  cluster: ClusterConfig;
  scaling: ScalingConfig;
  networking: NetworkingConfig;
  storage: DeploymentStorageConfig;
}

export interface ClusterConfig {
  name: string;
  type: ClusterType;
  nodes: NodeConfig[];
  loadBalancer: LoadBalancerConfig;
}

export type ClusterType = 'kubernetes' | 'docker_swarm' | 'nomad' | 'standalone';

export interface NodeConfig {
  name: string;
  type: NodeType;
  resources: NodeResources;
  labels: Record<string, string>;
}

export type NodeType = 'master' | 'worker' | 'edge';

export interface NodeResources {
  cpu: number; // cores
  memory: number; // GB
  disk: number; // GB
  network: number; // Gbps
}

export interface LoadBalancerConfig {
  enabled: boolean;
  type: LoadBalancerType;
  algorithm: LoadBalancingAlgorithm;
  healthCheck: LoadBalancerHealthCheck;
}

export type LoadBalancerType = 'nginx' | 'haproxy' | 'aws_alb' | 'gcp_lb' | 'azure_lb';
export type LoadBalancingAlgorithm = 'round_robin' | 'least_connections' | 'ip_hash' | 'weighted';

export interface LoadBalancerHealthCheck {
  enabled: boolean;
  path: string;
  interval: number; // seconds
  timeout: number; // seconds
  retries: number;
}

export interface ScalingConfig {
  horizontal: HorizontalScalingConfig;
  vertical: VerticalScalingConfig;
  auto: AutoScalingConfig;
}

export interface HorizontalScalingConfig {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCpuUtilization: number; // percentage
  targetMemoryUtilization: number; // percentage
}

export interface VerticalScalingConfig {
  enabled: boolean;
  minCpu: number; // cores
  maxCpu: number; // cores
  minMemory: number; // GB
  maxMemory: number; // GB
}

export interface AutoScalingConfig {
  enabled: boolean;
  metrics: ScalingMetric[];
  cooldown: ScalingCooldown;
}

export interface ScalingMetric {
  name: string;
  type: MetricType;
  threshold: number;
  operator: ComparisonOperator;
}

export type MetricType = 'cpu' | 'memory' | 'disk' | 'network' | 'requests' | 'custom';
export type ComparisonOperator = 'greater_than' | 'less_than' | 'equals';

export interface ScalingCooldown {
  scaleUp: number; // seconds
  scaleDown: number; // seconds
}

export interface NetworkingConfig {
  vpc: VpcConfig;
  subnets: SubnetConfig[];
  security: NetworkSecurityConfig;
}

export interface VpcConfig {
  cidr: string;
  enableDnsHostnames: boolean;
  enableDnsSupport: boolean;
  tags: Record<string, string>;
}

export interface SubnetConfig {
  name: string;
  cidr: string;
  availabilityZone: string;
  public: boolean;
  tags: Record<string, string>;
}

export interface NetworkSecurityConfig {
  securityGroups: SecurityGroup[];
  networkAcls: NetworkAcl[];
}

export interface SecurityGroup {
  name: string;
  description: string;
  rules: SecurityGroupRule[];
  tags: Record<string, string>;
}

export interface SecurityGroupRule {
  type: RuleType;
  protocol: string;
  port: number | string;
  source: string;
  description: string;
}

export type RuleType = 'ingress' | 'egress';

export interface NetworkAcl {
  name: string;
  rules: NetworkAclRule[];
  tags: Record<string, string>;
}

export interface NetworkAclRule {
  number: number;
  protocol: string;
  action: AclAction;
  cidr: string;
  port?: number | string;
}

export type AclAction = 'allow' | 'deny';

export interface DeploymentStorageConfig {
  persistent: PersistentStorageConfig[];
  temporary: TemporaryStorageConfig;
}

export interface PersistentStorageConfig {
  name: string;
  type: StorageType;
  size: number; // GB
  iops?: number;
  encrypted: boolean;
  backup: boolean;
}

export type StorageType = 'ssd' | 'hdd' | 'nvme' | 'network';

export interface TemporaryStorageConfig {
  size: number; // GB
  type: StorageType;
  mountPath: string;
}

// Integrations configuration
export interface IntegrationsConfig {
  external: ExternalIntegrationConfig[];
  webhooks: WebhookConfig;
  apis: ApiIntegrationConfig[];
}

export interface ExternalIntegrationConfig {
  name: string;
  type: IntegrationType;
  enabled: boolean;
  config: IntegrationSpecificConfig;
  authentication: IntegrationAuthConfig;
  limits: IntegrationLimits;
}

export type IntegrationType = 'github' | 'slack' | 'discord' | 'jira' | 'confluence' | 'custom';

export interface IntegrationSpecificConfig {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retries?: number;
  [key: string]: unknown;
}

export interface IntegrationAuthConfig {
  type: IntegrationAuthType;
  credentials: Record<string, string>;
  refreshToken?: string;
  expiresAt?: Date;
}

export type IntegrationAuthType = 'none' | 'api_key' | 'oauth' | 'basic' | 'bearer';

export interface IntegrationLimits {
  requestsPerMinute: number;
  requestsPerDay: number;
  maxConcurrentRequests: number;
  maxRetries: number;
}

export interface WebhookConfig {
  enabled: boolean;
  endpoints: WebhookEndpoint[];
  security: WebhookSecurityConfig;
  retry: WebhookRetryConfig;
}

export interface WebhookEndpoint {
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  headers: Record<string, string>;
  authentication: WebhookAuthConfig;
}

export interface WebhookAuthConfig {
  type: WebhookAuthType;
  secret?: string;
  username?: string;
  password?: string;
}

export type WebhookAuthType = 'none' | 'hmac' | 'basic' | 'bearer';

export interface WebhookSecurityConfig {
  validateSsl: boolean;
  allowedIps: string[];
  signatureHeader: string;
  timestampHeader: string;
  timestampTolerance: number; // seconds
}

export interface WebhookRetryConfig {
  enabled: boolean;
  maxAttempts: number;
  backoffStrategy: BackoffStrategy;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
}

export type BackoffStrategy = 'linear' | 'exponential' | 'fixed';

export interface ApiIntegrationConfig {
  name: string;
  baseUrl: string;
  version: string;
  enabled: boolean;
  authentication: ApiIntegrationAuthConfig;
  timeout: number; // milliseconds
  retries: number;
  circuitBreaker: CircuitBreakerConfig;
}

export interface ApiIntegrationAuthConfig {
  type: ApiAuthType;
  config: ApiAuthSpecificConfig;
}

export type ApiAuthType = 'none' | 'api_key' | 'oauth2' | 'jwt' | 'basic';

export interface ApiAuthSpecificConfig {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  scope?: string[];
  username?: string;
  password?: string;
  [key: string]: unknown;
}

// Configuration validation and utilities
export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
}

export interface ConfigValidationError {
  path: string;
  message: string;
  value: unknown;
  constraint: string;
}

export interface ConfigValidationWarning {
  path: string;
  message: string;
  value: unknown;
  suggestion: string;
}

// Environment variable mappings
export interface EnvironmentVariables {
  // App
  NODE_ENV: Environment;
  PORT: number;
  HOST: string;
  BASE_URL: string;
  
  // Database
  DATABASE_URL: string;
  DATABASE_SSL: boolean;
  DATABASE_POOL_MIN: number;
  DATABASE_POOL_MAX: number;
  
  // Auth
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  SESSION_SECRET: string;
  
  // AI
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  GOOGLE_AI_API_KEY: string;
  
  // Storage
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_S3_BUCKET: string;
  
  // Monitoring
  SENTRY_DSN: string;
  DATADOG_API_KEY: string;
  
  // Integrations
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SLACK_BOT_TOKEN: string;
  DISCORD_BOT_TOKEN: string;
  
  // Security
  ENCRYPTION_KEY: string;
  SSL_CERT_PATH: string;
  SSL_KEY_PATH: string;
  
  // Feature Flags
  FEATURE_AI_ENABLED: boolean;
  FEATURE_WEBHOOKS_ENABLED: boolean;
  FEATURE_ANALYTICS_ENABLED: boolean;
} 
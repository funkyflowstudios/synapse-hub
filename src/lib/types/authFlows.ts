// Authentication and Authorization Flow Specifications
// Complete auth flow definitions and security patterns

import type { UserId, Priority } from './common';
import type { User, UserRole, Permission } from './auth';

// ==============================================
// AUTHENTICATION FLOWS
// ==============================================

export interface AuthenticationFlow {
  id: string;
  name: string;
  type: AuthFlowType;
  steps: AuthStep[];
  configuration: AuthFlowConfig;
  security: SecuritySettings;
  metadata: FlowMetadata;
}

export enum AuthFlowType {
  LOCAL_LOGIN = 'local_login',
  OAUTH = 'oauth',
  SAML = 'saml',
  LDAP = 'ldap',
  API_KEY = 'api_key',
  JWT = 'jwt',
  REFRESH_TOKEN = 'refresh_token',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  TWO_FACTOR = 'two_factor',
  BIOMETRIC = 'biometric',
  SSO = 'sso',
  REGISTRATION = 'registration',
  IMPERSONATION = 'impersonation'
}

export interface AuthStep {
  id: string;
  name: string;
  type: StepType;
  required: boolean;
  order: number;
  condition?: StepCondition;
  validation: StepValidation;
  security: StepSecurity;
  ui: StepUIConfig;
  error: ErrorConfig;
  timeout: number; // milliseconds
}

export enum StepType {
  // Input Steps
  USERNAME_INPUT = 'username_input',
  PASSWORD_INPUT = 'password_input',
  EMAIL_INPUT = 'email_input',
  PHONE_INPUT = 'phone_input',
  
  // Verification Steps
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  CAPTCHA = 'captcha',
  
  // Multi-Factor Authentication
  TOTP = 'totp',
  SMS_CODE = 'sms_code',
  EMAIL_CODE = 'email_code',
  BACKUP_CODE = 'backup_code',
  BIOMETRIC = 'biometric',
  HARDWARE_KEY = 'hardware_key',
  
  // External Authentication
  OAUTH_REDIRECT = 'oauth_redirect',
  OAUTH_CALLBACK = 'oauth_callback',
  SAML_REQUEST = 'saml_request',
  SAML_RESPONSE = 'saml_response',
  LDAP_BIND = 'ldap_bind',
  
  // System Steps
  USER_LOOKUP = 'user_lookup',
  PASSWORD_VERIFICATION = 'password_verification',
  SESSION_CREATION = 'session_creation',
  TOKEN_GENERATION = 'token_generation',
  AUDIT_LOG = 'audit_log',
  
  // Decision Points
  CONDITIONAL_BRANCH = 'conditional_branch',
  RISK_ASSESSMENT = 'risk_assessment',
  DEVICE_TRUST = 'device_trust'
}

export interface StepCondition {
  type: ConditionType;
  expression: string;
  parameters: Record<string, unknown>;
}

export enum ConditionType {
  USER_PROPERTY = 'user_property',
  DEVICE_PROPERTY = 'device_property',
  SECURITY_POLICY = 'security_policy',
  RISK_SCORE = 'risk_score',
  TIME_BASED = 'time_based',
  LOCATION_BASED = 'location_based',
  CUSTOM = 'custom'
}

export interface StepValidation {
  rules: ValidationRule[];
  sanitization: SanitizationRule[];
  customValidators: CustomValidator[];
}

export interface ValidationRule {
  field: string;
  type: ValidationType;
  parameters: Record<string, unknown>;
  message: string;
  severity: 'error' | 'warning';
}

export enum ValidationType {
  REQUIRED = 'required',
  MIN_LENGTH = 'min_length',
  MAX_LENGTH = 'max_length',
  PATTERN = 'pattern',
  EMAIL = 'email',
  PHONE = 'phone',
  STRENGTH = 'strength',
  BLACKLIST = 'blacklist',
  CUSTOM = 'custom'
}

export interface SanitizationRule {
  field: string;
  type: SanitizationType;
  parameters: Record<string, unknown>;
}

export enum SanitizationType {
  TRIM = 'trim',
  LOWERCASE = 'lowercase',
  UPPERCASE = 'uppercase',
  NORMALIZE = 'normalize',
  ESCAPE = 'escape',
  CUSTOM = 'custom'
}

export interface CustomValidator {
  name: string;
  function: string;
  async: boolean;
  parameters: Record<string, unknown>;
}

export interface StepSecurity {
  rateLimiting: RateLimitConfig;
  encryption: EncryptionConfig;
  logging: LoggingConfig;
  monitoring: MonitoringConfig;
}

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxAttempts: number;
  blockDuration: number; // milliseconds
  key: string; // ip, user, session
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: string;
  keyId?: string;
  saltRounds?: number;
}

export interface LoggingConfig {
  enabled: boolean;
  level: LogLevel;
  includeData: boolean;
  sanitizeData: boolean;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerts: AlertConfig[];
}

export interface AlertConfig {
  condition: string;
  threshold: number;
  action: AlertAction;
}

export enum AlertAction {
  LOG = 'log',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  BLOCK = 'block'
}

export interface StepUIConfig {
  component: string;
  props: Record<string, unknown>;
  validation: UIValidationConfig;
  accessibility: AccessibilityConfig;
}

export interface UIValidationConfig {
  realTime: boolean;
  showStrength: boolean;
  showSuggestions: boolean;
  debounceMs: number;
}

export interface AccessibilityConfig {
  screenReader: boolean;
  highContrast: boolean;
  keyboardNavigation: boolean;
  focus: FocusConfig;
}

export interface FocusConfig {
  autoFocus: boolean;
  trapFocus: boolean;
  restoreFocus: boolean;
}

export interface ErrorConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  escalation: EscalationConfig;
  recovery: RecoveryConfig;
}

export interface EscalationConfig {
  enabled: boolean;
  threshold: number;
  action: EscalationAction;
}

export enum EscalationAction {
  BLOCK_USER = 'block_user',
  REQUIRE_ADMIN = 'require_admin',
  SEND_ALERT = 'send_alert',
  TERMINATE_SESSION = 'terminate_session'
}

export interface RecoveryConfig {
  enabled: boolean;
  options: RecoveryOption[];
}

export interface RecoveryOption {
  type: RecoveryType;
  label: string;
  action: string;
  security: SecurityLevel;
}

export enum RecoveryType {
  EMAIL_RESET = 'email_reset',
  PHONE_RESET = 'phone_reset',
  SECURITY_QUESTIONS = 'security_questions',
  ADMIN_RESET = 'admin_reset',
  BACKUP_CODES = 'backup_codes'
}

export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ==============================================
// AUTHORIZATION FLOWS
// ==============================================

export interface AuthorizationFlow {
  id: string;
  name: string;
  type: AuthzFlowType;
  model: AccessControlModel;
  policies: AuthorizationPolicy[];
  rules: AuthorizationRule[];
  context: AuthorizationContext;
  evaluation: PolicyEvaluation;
  enforcement: PolicyEnforcement;
}

export enum AuthzFlowType {
  RBAC = 'rbac', // Role-Based Access Control
  ABAC = 'abac', // Attribute-Based Access Control
  PBAC = 'pbac', // Policy-Based Access Control
  DAC = 'dac',   // Discretionary Access Control
  MAC = 'mac',   // Mandatory Access Control
  HYBRID = 'hybrid'
}

export enum AccessControlModel {
  ROLE_BASED = 'role_based',
  ATTRIBUTE_BASED = 'attribute_based',
  RESOURCE_BASED = 'resource_based',
  PERMISSION_BASED = 'permission_based',
  HIERARCHICAL = 'hierarchical',
  CONTEXT_AWARE = 'context_aware'
}

export interface AuthorizationPolicy {
  id: string;
  name: string;
  description: string;
  version: string;
  effect: PolicyEffect;
  subjects: SubjectMatcher[];
  resources: ResourceMatcher[];
  actions: ActionMatcher[];
  conditions: ConditionMatcher[];
  metadata: PolicyMetadata;
}

export enum PolicyEffect {
  ALLOW = 'allow',
  DENY = 'deny',
  CONDITIONAL = 'conditional'
}

export interface SubjectMatcher {
  type: SubjectType;
  pattern: string;
  attributes: AttributeMatcher[];
}

export enum SubjectType {
  USER = 'user',
  ROLE = 'role',
  GROUP = 'group',
  SERVICE = 'service',
  API_KEY = 'api_key'
}

export interface ResourceMatcher {
  type: ResourceType;
  pattern: string;
  attributes: AttributeMatcher[];
  hierarchy: HierarchyMatcher[];
}

export enum ResourceType {
  WORKFLOW = 'workflow',
  CONNECTOR = 'connector',
  MESSAGE = 'message',
  FILE = 'file',
  USER_DATA = 'user_data',
  SYSTEM = 'system',
  API_ENDPOINT = 'api_endpoint'
}

export interface ActionMatcher {
  type: ActionType;
  pattern: string;
  scope: ActionScope;
}

export enum ActionType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  EXECUTE = 'execute',
  ADMIN = 'admin',
  SHARE = 'share',
  EXPORT = 'export',
  IMPORT = 'import'
}

export enum ActionScope {
  SELF = 'self',
  OWNED = 'owned',
  SHARED = 'shared',
  PUBLIC = 'public',
  ALL = 'all'
}

export interface ConditionMatcher {
  type: ConditionType;
  operator: ConditionOperator;
  value: unknown;
  context: string[];
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  IN = 'in',
  NOT_IN = 'not_in',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null'
}

export interface AttributeMatcher {
  name: string;
  operator: ConditionOperator;
  value: unknown;
  required: boolean;
}

export interface HierarchyMatcher {
  level: number;
  pattern: string;
  inherit: boolean;
}

export interface PolicyMetadata {
  created: Date;
  updated: Date;
  createdBy: UserId;
  version: string;
  tags: string[];
  priority: Priority;
  enabled: boolean;
}

export interface AuthorizationRule {
  id: string;
  name: string;
  condition: string; // expression
  action: RuleAction;
  priority: number;
  enabled: boolean;
}

export enum RuleAction {
  GRANT = 'grant',
  DENY = 'deny',
  REQUIRE_APPROVAL = 'require_approval',
  LOG_ONLY = 'log_only',
  CHALLENGE = 'challenge'
}

export interface AuthorizationContext {
  user: UserContext;
  device: DeviceContext;
  session: SessionContext;
  request: RequestContext;
  environment: EnvironmentContext;
  risk: RiskContext;
}

export interface UserContext {
  id: UserId;
  roles: UserRole[];
  groups: string[];
  attributes: Record<string, unknown>;
  permissions: Permission[];
  lastLogin: Date;
  trustScore: number;
}

export interface DeviceContext {
  id: string;
  type: DeviceType;
  trusted: boolean;
  fingerprint: string;
  location: GeoLocation;
  attributes: Record<string, unknown>;
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  API_CLIENT = 'api_client',
  IOT_DEVICE = 'iot_device',
  UNKNOWN = 'unknown'
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface SessionContext {
  id: string;
  created: Date;
  lastActivity: Date;
  duration: number; // milliseconds
  activities: ActivityRecord[];
  risk: number; // 0-1
}

export interface ActivityRecord {
  action: string;
  resource: string;
  timestamp: Date;
  result: ActivityResult;
}

export enum ActivityResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  DENIED = 'denied',
  ERROR = 'error'
}

export interface RequestContext {
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  parameters: Record<string, unknown>;
  body?: unknown;
  timestamp: Date;
  source: RequestSource;
}

export enum RequestSource {
  WEB_UI = 'web_ui',
  API = 'api',
  WEBHOOK = 'webhook',
  INTERNAL = 'internal',
  SYSTEM = 'system'
}

export interface EnvironmentContext {
  environment: string;
  region: string;
  network: NetworkContext;
  time: TimeContext;
}

export interface NetworkContext {
  ipAddress: string;
  userAgent: string;
  protocol: string;
  encrypted: boolean;
  proxy: boolean;
}

export interface TimeContext {
  timestamp: Date;
  timezone: string;
  businessHours: boolean;
  dayOfWeek: number;
  holiday: boolean;
}

export interface RiskContext {
  score: number; // 0-1
  factors: RiskFactor[];
  mitigations: RiskMitigation[];
  threshold: number;
}

export interface RiskFactor {
  type: RiskFactorType;
  weight: number;
  value: number;
  description: string;
}

export enum RiskFactorType {
  LOCATION_ANOMALY = 'location_anomaly',
  TIME_ANOMALY = 'time_anomaly',
  DEVICE_ANOMALY = 'device_anomaly',
  BEHAVIOR_ANOMALY = 'behavior_anomaly',
  VELOCITY_ANOMALY = 'velocity_anomaly',
  REPUTATION = 'reputation',
  THREAT_INTELLIGENCE = 'threat_intelligence'
}

export interface RiskMitigation {
  type: MitigationType;
  action: string;
  threshold: number;
  enabled: boolean;
}

export enum MitigationType {
  ADDITIONAL_AUTH = 'additional_auth',
  RATE_LIMITING = 'rate_limiting',
  MONITORING = 'monitoring',
  CHALLENGE = 'challenge',
  BLOCK = 'block'
}

export interface PolicyEvaluation {
  engine: EvaluationEngine;
  strategy: EvaluationStrategy;
  caching: EvaluationCaching;
  audit: EvaluationAudit;
}

export enum EvaluationEngine {
  CEDAR = 'cedar',
  OPA = 'opa',
  CASBIN = 'casbin',
  CUSTOM = 'custom'
}

export enum EvaluationStrategy {
  FAIL_SAFE = 'fail_safe',    // Deny if uncertain
  FAIL_OPEN = 'fail_open',    // Allow if uncertain
  EXPLICIT = 'explicit',      // Require explicit decision
  PRECEDENCE = 'precedence'   // Use priority-based decision
}

export interface EvaluationCaching {
  enabled: boolean;
  ttl: number; // seconds
  strategy: CacheStrategy;
  invalidation: CacheInvalidation;
}

export enum CacheStrategy {
  USER_BASED = 'user_based',
  RESOURCE_BASED = 'resource_based',
  POLICY_BASED = 'policy_based',
  COMPOSITE = 'composite'
}

export interface CacheInvalidation {
  onPolicyChange: boolean;
  onUserChange: boolean;
  onRoleChange: boolean;
  manual: boolean;
}

export interface EvaluationAudit {
  enabled: boolean;
  level: AuditLevel;
  storage: AuditStorage;
  retention: AuditRetention;
}

export enum AuditLevel {
  MINIMAL = 'minimal',      // Decisions only
  STANDARD = 'standard',    // Decisions + context
  DETAILED = 'detailed',    // Everything
  DEBUG = 'debug'           // Full trace
}

export interface AuditStorage {
  type: StorageType;
  config: StorageConfig;
  encryption: boolean;
}

export enum StorageType {
  DATABASE = 'database',
  FILE = 'file',
  EXTERNAL = 'external',
  STREAM = 'stream'
}

export interface StorageConfig {
  location: string;
  format: string;
  compression: boolean;
  partitioning: PartitioningConfig;
}

export interface PartitioningConfig {
  enabled: boolean;
  strategy: PartitionStrategy;
  size: string;
}

export enum PartitionStrategy {
  TIME_BASED = 'time_based',
  SIZE_BASED = 'size_based',
  USER_BASED = 'user_based'
}

export interface AuditRetention {
  duration: number; // days
  archival: ArchivalConfig;
  deletion: DeletionConfig;
}

export interface ArchivalConfig {
  enabled: boolean;
  destination: string;
  compression: boolean;
  encryption: boolean;
}

export interface DeletionConfig {
  enabled: boolean;
  schedule: string; // cron
  confirmation: boolean;
}

export interface PolicyEnforcement {
  points: EnforcementPoint[];
  interceptors: Interceptor[];
  handlers: EnforcementHandler[];
}

export interface EnforcementPoint {
  id: string;
  name: string;
  type: EnforcementType;
  location: string;
  policies: string[];
  enabled: boolean;
}

export enum EnforcementType {
  API_GATEWAY = 'api_gateway',
  MIDDLEWARE = 'middleware',
  COMPONENT = 'component',
  DATABASE = 'database',
  FIELD_LEVEL = 'field_level'
}

export interface Interceptor {
  id: string;
  name: string;
  type: InterceptorType;
  order: number;
  config: InterceptorConfig;
}

export enum InterceptorType {
  PRE_AUTH = 'pre_auth',
  POST_AUTH = 'post_auth',
  PRE_AUTHORIZATION = 'pre_authorization',
  POST_AUTHORIZATION = 'post_authorization',
  ERROR = 'error'
}

export interface InterceptorConfig {
  enabled: boolean;
  handler: string;
  parameters: Record<string, unknown>;
  timeout: number;
}

export interface EnforcementHandler {
  id: string;
  decision: PolicyDecision;
  action: EnforcementAction;
  config: HandlerConfig;
}

export enum PolicyDecision {
  ALLOW = 'allow',
  DENY = 'deny',
  CHALLENGE = 'challenge',
  PARTIAL = 'partial'
}

export enum EnforcementAction {
  CONTINUE = 'continue',
  BLOCK = 'block',
  REDIRECT = 'redirect',
  CHALLENGE = 'challenge',
  LOG = 'log',
  MODIFY = 'modify'
}

export interface HandlerConfig {
  redirect?: RedirectConfig;
  challenge?: ChallengeConfig;
  modification?: ModificationConfig;
  logging?: LoggingConfig;
}

export interface RedirectConfig {
  url: string;
  method: string;
  preserveQuery: boolean;
  message?: string;
}

export interface ChallengeConfig {
  type: ChallengeType;
  prompt: string;
  timeout: number;
  retries: number;
}

export enum ChallengeType {
  PASSWORD = 'password',
  MFA = 'mfa',
  CAPTCHA = 'captcha',
  SECURITY_QUESTION = 'security_question',
  BIOMETRIC = 'biometric'
}

export interface ModificationConfig {
  type: ModificationType;
  rules: ModificationRule[];
}

export enum ModificationType {
  FILTER_FIELDS = 'filter_fields',
  MASK_DATA = 'mask_data',
  SANITIZE = 'sanitize',
  TRANSFORM = 'transform'
}

export interface ModificationRule {
  field: string;
  action: ModificationAction;
  config: Record<string, unknown>;
}

export enum ModificationAction {
  REMOVE = 'remove',
  MASK = 'mask',
  HASH = 'hash',
  ENCRYPT = 'encrypt',
  REDACT = 'redact'
}

// ==============================================
// SECURITY FLOWS
// ==============================================

export interface SecurityFlow {
  id: string;
  name: string;
  type: SecurityFlowType;
  triggers: SecurityTrigger[];
  actions: SecurityAction[];
  escalation: SecurityEscalation;
  recovery: SecurityRecovery;
}

export enum SecurityFlowType {
  THREAT_DETECTION = 'threat_detection',
  INCIDENT_RESPONSE = 'incident_response',
  COMPLIANCE_CHECK = 'compliance_check',
  VULNERABILITY_SCAN = 'vulnerability_scan',
  PENETRATION_TEST = 'penetration_test',
  SECURITY_AUDIT = 'security_audit'
}

export interface SecurityTrigger {
  type: TriggerType;
  condition: string;
  threshold: number;
  window: number; // milliseconds
}

export enum TriggerType {
  FAILED_LOGIN_ATTEMPTS = 'failed_login_attempts',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  ANOMALOUS_BEHAVIOR = 'anomalous_behavior',
  POLICY_VIOLATION = 'policy_violation'
}

export interface SecurityAction {
  type: SecurityActionType;
  target: ActionTarget;
  parameters: Record<string, unknown>;
  automatic: boolean;
}

export enum SecurityActionType {
  BLOCK_USER = 'block_user',
  BLOCK_IP = 'block_ip',
  REQUIRE_MFA = 'require_mfa',
  FORCE_LOGOUT = 'force_logout',
  ALERT_ADMIN = 'alert_admin',
  LOG_INCIDENT = 'log_incident',
  QUARANTINE = 'quarantine'
}

export interface ActionTarget {
  type: TargetType;
  id: string;
  scope: TargetScope;
}

export enum TargetType {
  USER = 'user',
  SESSION = 'session',
  DEVICE = 'device',
  IP_ADDRESS = 'ip_address',
  RESOURCE = 'resource'
}

export enum TargetScope {
  IMMEDIATE = 'immediate',
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
  CONDITIONAL = 'conditional'
}

export interface SecurityEscalation {
  enabled: boolean;
  levels: EscalationLevel[];
  automation: EscalationAutomation;
}

export interface EscalationLevel {
  level: number;
  threshold: number;
  delay: number; // minutes
  actions: SecurityAction[];
  notificationChannels: string[];
}

export interface EscalationAutomation {
  enabled: boolean;
  maxLevel: number;
  approvalRequired: boolean;
  overrideCode: string;
}

export interface SecurityRecovery {
  enabled: boolean;
  strategies: RecoveryStrategy[];
  automation: RecoveryAutomation;
}

export interface RecoveryStrategy {
  type: RecoveryStrategyType;
  condition: string;
  actions: SecurityAction[];
  verification: RecoveryVerification;
}

export enum RecoveryStrategyType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  APPROVAL_BASED = 'approval_based',
  TIME_BASED = 'time_based'
}

export interface RecoveryVerification {
  required: boolean;
  methods: VerificationMethod[];
  timeout: number; // minutes
}

export interface VerificationMethod {
  type: VerificationType;
  provider: string;
  config: Record<string, unknown>;
}

export enum VerificationType {
  EMAIL = 'email',
  PHONE = 'phone',
  ADMIN_APPROVAL = 'admin_approval',
  IDENTITY_VERIFICATION = 'identity_verification',
  DOCUMENT_UPLOAD = 'document_upload'
}

export interface RecoveryAutomation {
  enabled: boolean;
  conditions: AutomationCondition[];
  safeguards: AutomationSafeguard[];
}

export interface AutomationCondition {
  type: string;
  expression: string;
  threshold: number;
}

export interface AutomationSafeguard {
  type: SafeguardType;
  config: Record<string, unknown>;
  override: SafeguardOverride;
}

export enum SafeguardType {
  HUMAN_APPROVAL = 'human_approval',
  TIME_DELAY = 'time_delay',
  VERIFICATION = 'verification',
  LIMIT_SCOPE = 'limit_scope'
}

export interface SafeguardOverride {
  allowed: boolean;
  requiredRole: UserRole;
  justification: boolean;
  logging: boolean;
}

// ==============================================
// FLOW CONFIGURATION
// ==============================================

export interface AuthFlowConfig {
  timeout: number; // milliseconds
  retries: number;
  fallback: FallbackConfig;
  customization: CustomizationConfig;
  integration: IntegrationConfig;
}

export interface FallbackConfig {
  enabled: boolean;
  flows: string[]; // fallback flow IDs
  conditions: FallbackCondition[];
}

export interface FallbackCondition {
  trigger: string;
  action: FallbackAction;
  delay: number; // milliseconds
}

export enum FallbackAction {
  SWITCH_FLOW = 'switch_flow',
  SKIP_STEP = 'skip_step',
  USE_DEFAULT = 'use_default',
  FAIL = 'fail'
}

export interface CustomizationConfig {
  branding: BrandingConfig;
  theming: ThemingConfig;
  localization: LocalizationConfig;
}

export interface BrandingConfig {
  logo: string;
  colors: ColorScheme;
  fonts: FontConfig;
  messaging: MessagingConfig;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  error: string;
  success: string;
  warning: string;
}

export interface FontConfig {
  family: string;
  sizes: Record<string, string>;
  weights: Record<string, number>;
}

export interface MessagingConfig {
  title: string;
  subtitle: string;
  instructions: Record<string, string>;
  errors: Record<string, string>;
  success: Record<string, string>;
}

export interface ThemingConfig {
  mode: ThemeMode;
  components: ComponentTheme[];
  responsive: ResponsiveConfig;
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
  CUSTOM = 'custom'
}

export interface ComponentTheme {
  component: string;
  styles: Record<string, string>;
  variants: Record<string, Record<string, string>>;
}

export interface ResponsiveConfig {
  breakpoints: Record<string, number>;
  layouts: Record<string, LayoutConfig>;
}

export interface LayoutConfig {
  columns: number;
  spacing: string;
  alignment: string;
}

export interface LocalizationConfig {
  defaultLocale: string;
  supportedLocales: string[];
  messages: Record<string, Record<string, string>>;
  dateFormats: Record<string, string>;
  numberFormats: Record<string, Intl.NumberFormatOptions>;
}

export interface IntegrationConfig {
  apis: APIIntegration[];
  webhooks: WebhookIntegration[];
  external: ExternalIntegration[];
}

export interface APIIntegration {
  name: string;
  baseUrl: string;
  authentication: AuthenticationConfig;
  endpoints: EndpointConfig[];
  retry: RetryConfig;
}

export interface AuthenticationConfig {
  type: AuthenticationType;
  credentials: CredentialConfig;
  refresh: RefreshConfig;
}

export enum AuthenticationType {
  NONE = 'none',
  BASIC = 'basic',
  BEARER = 'bearer',
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  MUTUAL_TLS = 'mutual_tls'
}

export interface CredentialConfig {
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  certificate?: string;
  privateKey?: string;
}

export interface RefreshConfig {
  enabled: boolean;
  endpoint: string;
  method: string;
  interval: number; // minutes
}

export interface EndpointConfig {
  name: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  timeout: number; // milliseconds
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffFactor: number;
}

export interface WebhookIntegration {
  name: string;
  url: string;
  events: string[];
  authentication: WebhookAuth;
  retry: RetryConfig;
}

export interface WebhookAuth {
  type: WebhookAuthType;
  secret: string;
  headers: Record<string, string>;
}

export enum WebhookAuthType {
  NONE = 'none',
  SIGNATURE = 'signature',
  BASIC = 'basic',
  BEARER = 'bearer'
}

export interface ExternalIntegration {
  name: string;
  type: ExternalIntegrationType;
  config: ExternalIntegrationConfig;
  mapping: DataMapping;
}

export enum ExternalIntegrationType {
  ACTIVE_DIRECTORY = 'active_directory',
  LDAP = 'ldap',
  SAML_IDP = 'saml_idp',
  OAUTH_PROVIDER = 'oauth_provider',
  CUSTOM = 'custom'
}

export interface ExternalIntegrationConfig {
  host: string;
  port: number;
  ssl: boolean;
  baseDn?: string;
  bindDn?: string;
  bindPassword?: string;
  searchFilter?: string;
  attributes?: string[];
  [key: string]: unknown;
}

export interface DataMapping {
  userAttributes: AttributeMapping[];
  roleMapping: RoleMapping[];
  groupMapping: GroupMapping[];
}

export interface AttributeMapping {
  source: string;
  target: string;
  transform?: string;
  required: boolean;
}

export interface RoleMapping {
  sourceRole: string;
  targetRole: UserRole;
  conditions?: MappingCondition[];
}

export interface GroupMapping {
  sourceGroup: string;
  targetGroup: string;
  conditions?: MappingCondition[];
}

export interface MappingCondition {
  attribute: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface SecuritySettings {
  encryption: boolean;
  signing: boolean;
  audit: boolean;
  monitoring: boolean;
  threatDetection: boolean;
  complianceMode: ComplianceMode;
}

export enum ComplianceMode {
  NONE = 'none',
  GDPR = 'gdpr',
  HIPAA = 'hipaa',
  SOX = 'sox',
  PCI_DSS = 'pci_dss',
  CUSTOM = 'custom'
}

export interface FlowMetadata {
  created: Date;
  updated: Date;
  version: string;
  author: string;
  description: string;
  tags: string[];
  status: FlowStatus;
}

export enum FlowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived'
} 
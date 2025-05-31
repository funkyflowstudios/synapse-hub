// Authentication and authorization types
// Extended from existing auth system with comprehensive auth flow support

import type { BaseEntity, UserId, SessionId } from './common';

// User authentication types (extending existing schema)
export interface User extends BaseEntity {
  id: UserId;
  username: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  preferences: UserPreferences;
  lastLoginAt?: Date;
  isActive: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

// Session types (extending existing schema)
export interface Session extends BaseEntity {
  id: SessionId;
  userId: UserId;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  lastActiveAt: Date;
  deviceInfo: DeviceInfo;
  location?: Location;
  isActive: boolean;
}

// Device information for session tracking
export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  ipAddress: string;
  country?: string;
}

// Location for security tracking
interface Location {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

// User roles and permissions
export type UserRole = 'admin' | 'developer' | 'user' | 'guest' | 'connector';

export interface Permission {
  resource: AuthResource;
  actions: AuthAction[];
  conditions?: PermissionCondition[];
}

export type AuthResource = 
  | 'user'
  | 'session'
  | 'workflow'
  | 'connector'
  | 'project'
  | 'system'
  | 'analytics'
  | 'integrations';

export type AuthAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'execute'
  | 'manage'
  | 'admin';

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: unknown;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  accessibility: AccessibilityPreferences;
  privacy: PrivacyPreferences;
  ui: UIPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  workflow: boolean;
  security: boolean;
  system: boolean;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export interface PrivacyPreferences {
  analytics: boolean;
  errorReporting: boolean;
  locationTracking: boolean;
  sessionTracking: boolean;
}

export interface UIPreferences {
  compactMode: boolean;
  sidebarCollapsed: boolean;
  panelLayout: 'horizontal' | 'vertical' | 'auto';
  showTooltips: boolean;
}

// Authentication requests and responses
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: Partial<DeviceInfo>;
}

export interface LoginResponse {
  user: User;
  session: Session;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  requiresTwoFactor?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  acceptTerms: boolean;
}

export interface RegisterResponse {
  user: Omit<User, 'role' | 'permissions'>;
  requiresEmailVerification: boolean;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface TwoFactorSetupRequest {
  method: '2fa_app' | 'sms' | 'email';
  phoneNumber?: string;
}

export interface TwoFactorVerificationRequest {
  code: string;
  method: '2fa_app' | 'sms' | 'email';
}

// Session validation result (already exists in auth.ts)
export interface SessionValidationResult {
  session: Session | null;
  user: User | null;
}

// Security events
export interface SecurityEvent {
  id: string;
  userId: UserId;
  sessionId?: SessionId;
  type: SecurityEventType;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, unknown>;
  resolvedAt?: Date;
  createdAt: Date;
}

export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'password_change'
  | 'permission_escalation'
  | 'unusual_activity'
  | 'session_hijack_attempt'
  | 'brute_force_attempt'
  | 'account_lockout'; 
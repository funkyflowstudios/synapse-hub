// User management types extending the auth system
// These types focus on user profiles, settings, and extended functionality

import type { BaseEntity, UserId, Priority } from './common';
import type { User as AuthUser, UserPreferences } from './auth';

// Extended user profile interface
export interface UserProfile extends AuthUser {
  bio?: string;
  website?: string;
  company?: string;
  location?: string;
  socialLinks: SocialLinks;
  skills: UserSkill[];
  experience: WorkExperience[];
  achievements: Achievement[];
  statistics: UserStatistics;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  discord?: string;
  custom?: CustomSocialLink[];
}

export interface CustomSocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface UserSkill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  endorsements: number;
  isVerified: boolean;
  lastUsed?: Date;
}

export type SkillCategory = 
  | 'programming'
  | 'frameworks'
  | 'tools'
  | 'languages'
  | 'soft_skills'
  | 'domains'
  | 'certifications';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  skills: string[];
  achievements?: string[];
}

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  progress?: number; // 0-100 for progressive achievements
  metadata?: Record<string, unknown>;
}

export type AchievementType =
  | 'workflow_completion'
  | 'code_quality'
  | 'collaboration'
  | 'learning'
  | 'contribution'
  | 'milestone'
  | 'special_event';

export interface UserStatistics {
  totalWorkflows: number;
  completedWorkflows: number;
  totalCodeLines: number;
  contributionScore: number;
  collaborationHours: number;
  menteeCount: number;
  helpfulVotes: number;
  streakDays: number;
  joinedDate: Date;
  lastActiveDate: Date;
  weeklyActivity: WeeklyActivity[];
}

export interface WeeklyActivity {
  week: Date;
  workflowsCreated: number;
  workflowsCompleted: number;
  messagesPosted: number;
  codeCommitted: number;
  hoursActive: number;
}

// User team and collaboration types
export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  isPrivate: boolean;
  members: TeamMember[];
  projects: string[]; // Project IDs
  createdBy: UserId;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: UserId;
  role: TeamRole;
  joinedAt: Date;
  permissions: TeamPermission[];
  isActive: boolean;
}

export type TeamRole = 'owner' | 'admin' | 'member' | 'guest';

export interface TeamPermission {
  resource: 'projects' | 'workflows' | 'members' | 'settings';
  actions: ('read' | 'write' | 'delete' | 'invite' | 'manage')[];
}

// User activity and presence
export interface UserActivity {
  id: string;
  userId: UserId;
  type: ActivityType;
  description: string;
  entityType?: 'workflow' | 'project' | 'message' | 'file' | 'team';
  entityId?: string;
  metadata?: Record<string, unknown>;
  isPublic: boolean;
  timestamp: Date;
}

export type ActivityType =
  | 'workflow_created'
  | 'workflow_completed'
  | 'project_joined'
  | 'achievement_unlocked'
  | 'skill_added'
  | 'team_joined'
  | 'file_uploaded'
  | 'message_posted'
  | 'code_committed'
  | 'review_completed';

export interface UserPresence {
  userId: UserId;
  status: PresenceStatus;
  statusMessage?: string;
  lastSeen: Date;
  currentLocation?: string; // Current page/panel
  isAvailable: boolean;
  timezone: string;
}

export type PresenceStatus = 'online' | 'away' | 'busy' | 'invisible' | 'offline';

// User notifications and communication
export interface UserNotification {
  id: string;
  userId: UserId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: Priority;
  actionUrl?: string;
  actionLabel?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  createdAt: Date;
}

export type NotificationType =
  | 'workflow_assigned'
  | 'workflow_completed'
  | 'team_invitation'
  | 'mention'
  | 'system_alert'
  | 'achievement'
  | 'reminder'
  | 'security'
  | 'update';

// User settings and customization
export interface UserSettings extends UserPreferences {
  development: DevelopmentSettings;
  collaboration: CollaborationSettings;
  privacy: ExtendedPrivacySettings;
  integrations: IntegrationSettings;
}

export interface DevelopmentSettings {
  defaultEditor: 'vscode' | 'cursor' | 'vim' | 'emacs' | 'other';
  codeStyle: CodeStyleSettings;
  autoSave: boolean;
  autoFormat: boolean;
  showLineNumbers: boolean;
  wordWrap: boolean;
  minimap: boolean;
  bracketPairColorization: boolean;
  indentGuides: boolean;
}

export interface CodeStyleSettings {
  tabSize: number;
  insertSpaces: boolean;
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
  detectIndentation: boolean;
}

export interface CollaborationSettings {
  allowDirectMessages: boolean;
  allowTeamInvitations: boolean;
  sharePresence: boolean;
  shareActivity: boolean;
  mentorMode: boolean;
  autoJoinWorkflows: boolean;
  notificationFrequency: 'immediate' | 'batched' | 'digest';
}

export interface ExtendedPrivacySettings {
  profileVisibility: 'public' | 'team_only' | 'private';
  activityVisibility: 'public' | 'team_only' | 'private';
  skillsVisibility: 'public' | 'team_only' | 'private';
  experienceVisibility: 'public' | 'team_only' | 'private';
  allowAnalytics: boolean;
  allowTelemetry: boolean;
  shareUsageData: boolean;
  allowCookies: boolean;
}

export interface IntegrationSettings {
  github: GitHubIntegration;
  slack: SlackIntegration;
  discord: DiscordIntegration;
  calendar: CalendarIntegration;
  customIntegrations: CustomIntegration[];
}

export interface GitHubIntegration {
  enabled: boolean;
  token?: string;
  username?: string;
  syncRepositories: boolean;
  syncIssues: boolean;
  syncPullRequests: boolean;
  webhookUrl?: string;
}

export interface SlackIntegration {
  enabled: boolean;
  token?: string;
  workspaceId?: string;
  channelId?: string;
  notifyWorkflowUpdates: boolean;
  notifyMentions: boolean;
}

export interface DiscordIntegration {
  enabled: boolean;
  token?: string;
  guildId?: string;
  channelId?: string;
  notifyWorkflowUpdates: boolean;
  notifyMentions: boolean;
}

export interface CalendarIntegration {
  enabled: boolean;
  provider: 'google' | 'outlook' | 'apple' | 'other';
  token?: string;
  syncEvents: boolean;
  createWorkflowEvents: boolean;
  reminderTime: number; // minutes before
}

export interface CustomIntegration {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'oauth';
  enabled: boolean;
  configuration: Record<string, unknown>;
  createdAt: Date;
  lastUsed?: Date;
}

// User onboarding and help
export interface UserOnboarding {
  userId: UserId;
  currentStep: number;
  totalSteps: number;
  completedSteps: OnboardingStep[];
  isCompleted: boolean;
  startedAt: Date;
  completedAt?: Date;
  skippedSteps: number[];
}

export interface OnboardingStep {
  id: number;
  name: string;
  description: string;
  isRequired: boolean;
  completedAt?: Date;
  data?: Record<string, unknown>;
}

export interface UserHelp {
  userId: UserId;
  preferredHelpFormat: 'tooltip' | 'modal' | 'sidebar' | 'inline';
  showGettingStarted: boolean;
  showKeyboardShortcuts: boolean;
  showFeatureTours: boolean;
  completedTours: string[];
  helpTopicsViewed: string[];
  feedbackSubmitted: UserFeedback[];
}

export interface UserFeedback {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'question';
  title: string;
  description: string;
  priority: Priority;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachments?: string[];
  submittedAt: Date;
  respondedAt?: Date;
}

// User API keys and tokens
export interface UserApiKey {
  id: string;
  userId: UserId;
  name: string;
  description?: string;
  keyPrefix: string; // Only show first few characters
  permissions: ApiKeyPermission[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsed?: Date;
  usageCount: number;
  createdAt: Date;
}

export interface ApiKeyPermission {
  resource: string;
  actions: string[];
  conditions?: Record<string, unknown>;
}

// User subscription and billing (if applicable)
export interface UserSubscription {
  userId: UserId;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  usage: SubscriptionUsage;
  features: SubscriptionFeature[];
}

export type SubscriptionPlan = 'free' | 'pro' | 'team' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';

export interface SubscriptionUsage {
  workflows: { used: number; limit: number };
  storage: { used: number; limit: number }; // bytes
  apiCalls: { used: number; limit: number };
  teamMembers: { used: number; limit: number };
}

export interface SubscriptionFeature {
  name: string;
  enabled: boolean;
  limit?: number;
  description?: string;
} 
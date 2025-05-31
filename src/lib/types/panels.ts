// Panel system types for the three-panel Synapse-Hub interface
// Based on InputControlNexus, CoCreationCanvas, and OrchestrationForesightDeck

import type { BaseEntity, Health, Priority, UIState } from './common';

// Main panel types
export type PanelType = 'input' | 'creation' | 'orchestration';
export type PanelLayout = 'horizontal' | 'vertical' | 'stacked';

// Panel state management
export interface PanelState {
  isCollapsed: boolean;
  width?: number;
  height?: number;
  isResizing: boolean;
  isDragging: boolean;
  zIndex: number;
}

export interface PanelConfiguration {
  id: string;
  type: PanelType;
  title: string;
  isResizable: boolean;
  isCollapsible: boolean;
  isDraggable: boolean;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  defaultState: PanelState;
}

// Input Control Nexus (Left Panel) Types
export interface InputControlNexusState {
  activeTab: 'code' | 'tools' | 'resources' | 'projects';
  expandedSections: {
    codeGeneration: boolean;
    codeQuality: boolean;
    api: boolean;
    knowledge: boolean;
    projectContext: boolean;
    codeMetrics: boolean;
    learningResources: boolean;
    documentation: boolean;
  };
  selectedPlatforms: Set<'windows' | 'apple' | 'linux' | 'web'>;
  apiSearchQuery: string;
  showKnowledgeDialog: boolean;
  selectedText: string;
}

export interface QuickAction {
  id: string;
  label: string;
  category: 'generate' | 'quality' | 'tools' | 'resources';
  icon?: string;
  shortcut?: string;
  description?: string;
}

export interface ExtendedAction {
  id: string;
  label: string;
  description: string;
  icon?: string;
  category: string;
  isEnabled: boolean;
}

export interface ProjectContext {
  currentFile: {
    name: string;
    path: string;
    language: string;
    lines: number;
    size: number;
    lastModified: Date;
  };
  vcs: {
    branch: string;
    status: 'clean' | 'modified' | 'staged' | 'conflicted';
    uncommittedChanges: number;
    lastCommit: string;
    remoteStatus: 'up-to-date' | 'ahead' | 'behind' | 'diverged';
  };
  activeTask?: {
    id: string;
    title: string;
    description?: string;
    priority: Priority;
    assignee?: string;
    dueDate?: Date;
  };
}

export interface CodeMetrics {
  summary: {
    health: Health;
    todos: number;
    testsPassed: number;
    testsTotal: number;
    buildStatus: 'passing' | 'failing' | 'pending' | 'unknown';
    coverage: number;
    complexity: number;
  };
  details: {
    todos: TodoItem[];
    issues: CodeIssue[];
    dependencies: DependencyInfo[];
    performance: PerformanceMetric[];
  };
}

export interface TodoItem {
  id: string;
  file: string;
  line: number;
  text: string;
  priority: Priority;
  assignee?: string;
  createdAt: Date;
}

export interface CodeIssue {
  id: string;
  file: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  rule?: string;
  source: 'eslint' | 'typescript' | 'custom';
}

export interface DependencyInfo {
  name: string;
  version: string;
  latestVersion: string;
  isOutdated: boolean;
  vulnerabilities: number;
  license: string;
  size: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
}

export interface LearningResource {
  id: string;
  title: string;
  url: string;
  type: 'docs' | 'tutorial' | 'video' | 'article' | 'course' | 'guide';
  priority: Priority;
  category: string;
  tags: string[];
  estimatedTime?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isBookmarked: boolean;
  lastAccessed?: Date;
}

export interface DocumentationCategory {
  id: string;
  label: string;
  count: number;
  icon?: string;
  description?: string;
  subcategories?: DocumentationCategory[];
}

// Co-Creation Canvas (Center Panel) Types
export interface CoCreationCanvasState {
  activeMode: 'chat' | 'code' | 'design' | 'analysis';
  conversationHistory: Message[];
  currentContext: ConversationContext;
  codeEditor: CodeEditorState;
  designCanvas: DesignCanvasState;
  analysisView: AnalysisViewState;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    temperature?: number;
    context?: string[];
  };
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
}

export interface MessageAttachment {
  id: string;
  type: 'file' | 'image' | 'code' | 'link' | 'data';
  name: string;
  url?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface ConversationContext {
  projectId?: string;
  sessionId: string;
  userId: string;
  activeFiles: string[];
  currentWorkflow?: string;
  sharedState: Record<string, unknown>;
}

export interface CodeEditorState {
  files: EditorFile[];
  activeFileId?: string;
  language: string;
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: number;
  showLineNumbers: boolean;
  showMinimap: boolean;
  wordWrap: boolean;
  tabSize: number;
  autoSave: boolean;
}

export interface EditorFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified: boolean;
  isReadOnly: boolean;
  cursor: EditorPosition;
  selection?: EditorRange;
}

export interface EditorPosition {
  line: number;
  column: number;
}

export interface EditorRange {
  start: EditorPosition;
  end: EditorPosition;
}

export interface DesignCanvasState {
  mode: 'wireframe' | 'mockup' | 'prototype';
  elements: DesignElement[];
  selectedElements: string[];
  canvasSize: { width: number; height: number };
  zoom: number;
  grid: { enabled: boolean; size: number };
  layers: DesignLayer[];
}

export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'input' | 'container' | 'shape';
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: Record<string, unknown>;
  style: DesignElementStyle;
  layerId: string;
}

export interface DesignElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
}

export interface DesignLayer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  opacity: number;
  order: number;
}

export interface AnalysisViewState {
  activeAnalysis: 'performance' | 'security' | 'accessibility' | 'seo' | 'metrics';
  results: AnalysisResult[];
  filters: AnalysisFilter[];
  selectedTimeRange: TimeRange;
}

export interface AnalysisResult {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  score?: number;
  suggestions: AnalysisSuggestion[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface AnalysisSuggestion {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

export interface AnalysisFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
  isActive: boolean;
}

export interface TimeRange {
  start: Date;
  end: Date;
  preset?: 'last_hour' | 'last_day' | 'last_week' | 'last_month' | 'custom';
}

// Orchestration Foresight Deck (Right Panel) Types
export interface OrchestrationForesightState {
  activeView: 'workflow' | 'monitoring' | 'integrations' | 'automation';
  workflows: WorkflowSummary[];
  monitoring: MonitoringDashboard;
  integrations: IntegrationStatus[];
  automation: AutomationRule[];
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'draft';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'parallel' | 'delay';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  order: number;
  duration?: number;
  output?: unknown;
  error?: string;
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'schedule' | 'event' | 'webhook' | 'file' | 'api';
  configuration: Record<string, unknown>;
  isActive: boolean;
  lastTriggered?: Date;
  nextTrigger?: Date;
}

export interface MonitoringDashboard {
  metrics: MetricWidget[];
  alerts: Alert[];
  logs: LogEntry[];
  systemHealth: SystemHealthIndicator[];
}

export interface MetricWidget {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'gauge' | 'counter' | 'pie';
  value: number | number[];
  unit: string;
  trend: 'up' | 'down' | 'stable';
  threshold?: number;
  timeRange: TimeRange;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  source: string;
  createdAt: Date;
  updatedAt: Date;
  assignee?: string;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  type: 'acknowledge' | 'resolve' | 'escalate' | 'custom';
  url?: string;
  confirmation?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface SystemHealthIndicator {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  value: number;
  unit: string;
  threshold: number;
  description: string;
  lastChecked: Date;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  type: 'api' | 'database' | 'file' | 'webhook' | 'service';
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  health: Health;
  lastSync?: Date;
  errorCount: number;
  configuration: IntegrationConfiguration;
  metrics: IntegrationMetrics;
}

export interface IntegrationConfiguration {
  endpoint?: string;
  apiKey?: string;
  webhookUrl?: string;
  syncInterval?: number;
  retryAttempts?: number;
  timeout?: number;
  customSettings?: Record<string, unknown>;
}

export interface IntegrationMetrics {
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  dataTransferred: number;
  lastError?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  executionCount: number;
  lastExecuted?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface AutomationTrigger {
  type: 'schedule' | 'event' | 'webhook' | 'manual' | 'condition';
  configuration: Record<string, unknown>;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
  logicalOperator?: 'and' | 'or';
}

export interface AutomationAction {
  type: 'notify' | 'execute' | 'create' | 'update' | 'delete' | 'webhook';
  configuration: Record<string, unknown>;
  order: number;
}

// Panel event types
export interface PanelEvent {
  type: PanelEventType;
  panelId: string;
  timestamp: Date;
  data?: unknown;
}

export type PanelEventType =
  | 'resize'
  | 'collapse'
  | 'expand'
  | 'tab_change'
  | 'section_toggle'
  | 'action_trigger'
  | 'state_update'
  | 'error'; 
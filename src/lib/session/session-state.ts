// Session State Persistence System
// Save and restore development context between AI sessions

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface SessionState {
  id: string;
  timestamp: string;
  lastActive: string;
  context: DevelopmentContext;
  progress: ProgressState;
  decisions: DecisionRecord[];
  nextSteps: NextStep[];
  metadata: SessionMetadata;
}

export interface DevelopmentContext {
  currentPhase: string;
  activeFeatures: string[];
  openFiles: OpenFile[];
  recentActions: RecentAction[];
  codebaseChanges: CodebaseChange[];
  environmentState: EnvironmentState;
  aiContext: AIContext;
}

export interface OpenFile {
  path: string;
  cursorPosition: { line: number; column: number };
  selections: Array<{ start: { line: number; column: number }; end: { line: number; column: number } }>;
  lastModified: string;
  isModified: boolean;
  content?: string; // For critical files
}

export interface RecentAction {
  id: string;
  timestamp: string;
  type: 'file_edit' | 'file_create' | 'file_delete' | 'command_run' | 'test_run' | 'build' | 'debug';
  description: string;
  files: string[];
  command?: string;
  result?: 'success' | 'failure' | 'partial';
  metadata: Record<string, any>;
}

export interface CodebaseChange {
  id: string;
  timestamp: string;
  files: string[];
  description: string;
  type: 'feature' | 'bugfix' | 'refactor' | 'test' | 'config' | 'documentation';
  impact: 'minor' | 'moderate' | 'major';
  relatedFeatures: string[];
  dependencies: string[];
}

export interface EnvironmentState {
  nodeVersion: string;
  npmPackages: string[];
  dockerContainers: string[];
  services: Array<{ name: string; status: 'running' | 'stopped' | 'error' }>;
  environmentVariables: Record<string, string>;
  debugConfiguration: string;
}

export interface AIContext {
  conversationId?: string;
  lastPrompt?: string;
  activeInstructions: string[];
  codePatterns: string[];
  constraints: string[];
  preferences: Record<string, any>;
  learnings: Array<{ topic: string; insight: string; timestamp: string }>;
}

export interface ProgressState {
  currentPhase: string;
  completedItems: string[];
  inProgressItems: string[];
  blockedItems: Array<{ item: string; reason: string; since: string }>;
  totalProgress: number;
  phaseProgress: Record<string, number>;
  estimatedCompletion: string;
  velocity: number; // Items per session
}

export interface DecisionRecord {
  id: string;
  timestamp: string;
  category: 'architecture' | 'technology' | 'pattern' | 'implementation' | 'testing' | 'deployment';
  title: string;
  description: string;
  options: Array<{ name: string; pros: string[]; cons: string[]; selected: boolean }>;
  rationale: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  reversible: boolean;
  relatedDecisions: string[];
  implementedIn: string[];
}

export interface NextStep {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'implementation' | 'testing' | 'documentation' | 'refactor' | 'research';
  title: string;
  description: string;
  estimatedTime: number; // minutes
  dependencies: string[];
  blockers: string[];
  context: string[];
  files: string[];
  commands: string[];
  success_criteria: string[];
  created: string;
  assignedSession?: string;
}

export interface SessionMetadata {
  version: string;
  sessionDuration: number;
  aiModel: string;
  userObjectives: string[];
  sessionType: 'feature_development' | 'bug_fixing' | 'refactoring' | 'testing' | 'setup' | 'planning';
  collaborators: string[];
  tags: string[];
}

class SessionManager {
  private static instance: SessionManager;
  private currentSession: SessionState | null = null;
  private storageKey = 'synapse-hub-session-state';
  private autoSaveInterval: number | null = null;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  constructor() {
    if (browser) {
      this.initializeSession();
      this.startAutoSave();
    }
  }

  private initializeSession(): void {
    // Try to restore from localStorage
    const savedSession = this.loadFromStorage();
    
    if (savedSession && this.isSessionValid(savedSession)) {
      this.currentSession = {
        ...savedSession,
        lastActive: new Date().toISOString()
      };
      console.log('📂 Restored session:', this.currentSession.id);
    } else {
      this.createNewSession();
    }
  }

  private createNewSession(): void {
    this.currentSession = {
      id: this.generateSessionId(),
      timestamp: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      context: {
        currentPhase: 'Phase 6: Session Management & Context Optimization',
        activeFeatures: [],
        openFiles: [],
        recentActions: [],
        codebaseChanges: [],
        environmentState: {
          nodeVersion: '',
          npmPackages: [],
          dockerContainers: [],
          services: [],
          environmentVariables: {},
          debugConfiguration: ''
        },
        aiContext: {
          activeInstructions: [],
          codePatterns: [],
          constraints: [],
          preferences: {},
          learnings: []
        }
      },
      progress: {
        currentPhase: 'Phase 6',
        completedItems: [],
        inProgressItems: [],
        blockedItems: [],
        totalProgress: 64, // Current progress from checklist
        phaseProgress: {
          'Phase 0': 92, // 11/12
          'Phase 1': 100,
          'Phase 2': 100,
          'Phase 3': 100,
          'Phase 4': 100,
          'Phase 5': 100,
          'Phase 6': 0
        },
        estimatedCompletion: '',
        velocity: 0
      },
      decisions: [],
      nextSteps: [],
      metadata: {
        version: '1.0.0',
        sessionDuration: 0,
        aiModel: 'Claude Sonnet',
        userObjectives: ['Complete Phase 6: Session Management & Context Optimization'],
        sessionType: 'feature_development',
        collaborators: ['AI Assistant'],
        tags: ['phase-6', 'session-management', 'context-optimization']
      }
    };

    console.log('🆕 Created new session:', this.currentSession.id);
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `session_${timestamp}_${random}`;
  }

  private isSessionValid(session: SessionState): boolean {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const sessionAge = Date.now() - new Date(session.timestamp).getTime();
    return sessionAge < maxAge && session.context && session.progress;
  }

  private startAutoSave(): void {
    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      this.saveSession();
    }, 30000);

    // Save on beforeunload
    window.addEventListener('beforeunload', () => {
      this.saveSession();
    });
  }

  private loadFromStorage(): SessionState | null {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load session from storage:', error);
      return null;
    }
  }

  private saveToStorage(session: SessionState): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session to storage:', error);
    }
  }

  // Public API
  getCurrentSession(): SessionState | null {
    return this.currentSession;
  }

  saveSession(): void {
    if (!this.currentSession) return;

    this.currentSession.lastActive = new Date().toISOString();
    this.currentSession.metadata.sessionDuration = 
      Date.now() - new Date(this.currentSession.timestamp).getTime();

    this.saveToStorage(this.currentSession);
  }

  updateContext(updates: Partial<DevelopmentContext>): void {
    if (!this.currentSession) return;

    this.currentSession.context = {
      ...this.currentSession.context,
      ...updates
    };

    this.addRecentAction({
      type: 'file_edit',
      description: 'Context updated',
      files: [],
      result: 'success',
      metadata: { updates: Object.keys(updates) }
    });
  }

  addOpenFile(file: OpenFile): void {
    if (!this.currentSession) return;

    const existingIndex = this.currentSession.context.openFiles
      .findIndex(f => f.path === file.path);

    if (existingIndex >= 0) {
      this.currentSession.context.openFiles[existingIndex] = file;
    } else {
      this.currentSession.context.openFiles.push(file);
    }
  }

  removeOpenFile(path: string): void {
    if (!this.currentSession) return;

    this.currentSession.context.openFiles = 
      this.currentSession.context.openFiles.filter(f => f.path !== path);
  }

  addRecentAction(action: Omit<RecentAction, 'id' | 'timestamp'>): void {
    if (!this.currentSession) return;

    const fullAction: RecentAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...action
    };

    this.currentSession.context.recentActions.unshift(fullAction);
    
    // Keep only the last 50 actions
    this.currentSession.context.recentActions = 
      this.currentSession.context.recentActions.slice(0, 50);
  }

  addCodebaseChange(change: Omit<CodebaseChange, 'id' | 'timestamp'>): void {
    if (!this.currentSession) return;

    const fullChange: CodebaseChange = {
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...change
    };

    this.currentSession.context.codebaseChanges.unshift(fullChange);
    
    // Keep only the last 100 changes
    this.currentSession.context.codebaseChanges = 
      this.currentSession.context.codebaseChanges.slice(0, 100);

    this.addRecentAction({
      type: 'file_edit',
      description: change.description,
      files: change.files,
      result: 'success',
      metadata: { changeType: change.type, impact: change.impact }
    });
  }

  addDecision(decision: Omit<DecisionRecord, 'id' | 'timestamp'>): void {
    if (!this.currentSession) return;

    const fullDecision: DecisionRecord = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...decision
    };

    this.currentSession.decisions.push(fullDecision);
  }

  addNextStep(step: Omit<NextStep, 'id' | 'created'>): void {
    if (!this.currentSession) return;

    const fullStep: NextStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      created: new Date().toISOString(),
      ...step
    };

    this.currentSession.nextSteps.push(fullStep);
    
    // Sort by priority
    this.currentSession.nextSteps.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  completeNextStep(stepId: string): void {
    if (!this.currentSession) return;

    this.currentSession.nextSteps = 
      this.currentSession.nextSteps.filter(step => step.id !== stepId);

    this.addRecentAction({
      type: 'file_edit',
      description: 'Completed next step',
      files: [],
      result: 'success',
      metadata: { stepId }
    });
  }

  updateProgress(updates: Partial<ProgressState>): void {
    if (!this.currentSession) return;

    this.currentSession.progress = {
      ...this.currentSession.progress,
      ...updates
    };
  }

  exportSession(): string {
    if (!this.currentSession) return '';
    return JSON.stringify(this.currentSession, null, 2);
  }

  importSession(sessionData: string): boolean {
    try {
      const session = JSON.parse(sessionData) as SessionState;
      if (this.isSessionValid(session)) {
        this.currentSession = session;
        this.saveToStorage(session);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import session:', error);
      return false;
    }
  }

  getSessionSummary(): {
    duration: number;
    actionsCount: number;
    changesCount: number;
    decisionsCount: number;
    nextStepsCount: number;
    progress: number;
  } {
    if (!this.currentSession) {
      return {
        duration: 0,
        actionsCount: 0,
        changesCount: 0,
        decisionsCount: 0,
        nextStepsCount: 0,
        progress: 0
      };
    }

    return {
      duration: this.currentSession.metadata.sessionDuration,
      actionsCount: this.currentSession.context.recentActions.length,
      changesCount: this.currentSession.context.codebaseChanges.length,
      decisionsCount: this.currentSession.decisions.length,
      nextStepsCount: this.currentSession.nextSteps.length,
      progress: this.currentSession.progress.totalProgress
    };
  }

  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.saveSession();
  }
}

// Global session manager
export const sessionManager = SessionManager.getInstance();

// Svelte stores for reactive updates
export const sessionState = writable<SessionState | null>(null);
export const sessionProgress = writable<ProgressState | null>(null);
export const nextSteps = writable<NextStep[]>([]);

// Initialize stores
if (browser) {
  const session = sessionManager.getCurrentSession();
  sessionState.set(session);
  sessionProgress.set(session?.progress || null);
  nextSteps.set(session?.nextSteps || []);

  // Update stores when session changes
  setInterval(() => {
    const currentSession = sessionManager.getCurrentSession();
    sessionState.set(currentSession);
    sessionProgress.set(currentSession?.progress || null);
    nextSteps.set(currentSession?.nextSteps || []);
  }, 5000);
}

export default sessionManager; 
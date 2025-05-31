// Centralized Session Management System
// Export all session-related functionality for easy integration

// Core session management
export {
  sessionManager,
  sessionState,
  sessionProgress,
  nextSteps,
  type SessionState,
  type DevelopmentContext,
  type ProgressState,
  type NextStep,
  type DecisionRecord,
  type SessionMetadata
} from './session-state.js';

// Implementation timeline tracking
export {
  implementationTimeline,
  timelineEntries,
  timelineStats,
  addImplementation,
  type ImplementationEntry,
  type FileChange,
  type Challenge,
  type ImpactAssessment,
  type ImplementationMetrics,
  type TimelineFilter,
  type TimelineStats
} from './implementation-timeline.js';

// Decision logging system
export {
  decisionLogger,
  decisions,
  decisionMetrics,
  pendingDecisions,
  addDecision,
  type DecisionEntry,
  type DecisionCategory,
  type DecisionContext,
  type DecisionOption,
  type DecisionImpact,
  type DecisionStatus,
  type DecisionFilter,
  type DecisionMetrics
} from './decision-log.js';

// Next steps management
export {
  nextStepsManager,
  nextStepsContext,
  stepRecommendations,
  stepSequences,
  urgentSteps,
  getNextSteps,
  addNextStep,
  completeNextStep,
  createStepSequence,
  type NextStepTemplate,
  type StepSequence,
  type NextStepsContext,
  type StepRecommendation
} from './next-steps.js';

// Context loading optimization
export {
  contextLoader,
  contextLoadingProgress,
  contextFiles,
  contextConfig,
  criticalFiles,
  isContextLoading,
  loadOptimizedContext,
  updateContextConfig,
  invalidateContextCache,
  getContextStats,
  type ContextFile,
  type ContextLoadingConfig,
  type LoadingProgress,
  type ContextCache,
  type SmartFilter
} from './context-loader.js';

// Utility functions for common session operations
import { sessionManager } from './session-state.js';
import { implementationTimeline } from './implementation-timeline.js';
import { decisionLogger } from './decision-log.js';
import { nextStepsManager } from './next-steps.js';
import { contextLoader } from './context-loader.js';

/**
 * Initialize session management system
 * Call this once at application startup
 */
export function initializeSessionManagement(): void {
  console.log('🚀 Initializing Session Management System...');
  
  // Session manager initializes automatically
  const session = sessionManager.getCurrentSession();
  console.log(`📂 Session: ${session?.id || 'New session will be created'}`);
  
  // Preload context for faster startup
  contextLoader.preloadContext();
  
  console.log('✅ Session Management System initialized');
}

/**
 * Start a new development session with context
 */
export async function startDevelopmentSession(options: {
  objectives?: string[];
  sessionType?: 'feature_development' | 'bug_fixing' | 'refactoring' | 'testing' | 'setup' | 'planning';
  phase?: string;
  activeFeatures?: string[];
} = {}): Promise<void> {
  console.log('🎯 Starting new development session...');
  
  // Update session context
  sessionManager.updateContext({
    currentPhase: options.phase || 'Phase 6: Session Management & Context Optimization',
    activeFeatures: options.activeFeatures || []
  });
  
  // Update session metadata
  const session = sessionManager.getCurrentSession();
  if (session) {
    session.metadata.userObjectives = options.objectives || session.metadata.userObjectives;
    session.metadata.sessionType = options.sessionType || session.metadata.sessionType;
  }
  
  // Load optimized context
  await contextLoader.getOptimizedContext();
  
  // Get next step recommendations
  const recommendations = nextStepsManager.getRecommendations(5);
  console.log(`📋 Found ${recommendations.length} recommended next steps`);
  
  // Add urgent recommendations to session
  recommendations
    .filter(rec => rec.urgency === 'immediate')
    .forEach(rec => nextStepsManager.acceptRecommendation(rec));
  
  console.log('✅ Development session started');
}

/**
 * Complete current session and prepare handoff
 */
export function completeSession(summary: {
  accomplishments: string[];
  challenges?: string[];
  learnings?: string[];
  nextSteps?: string[];
  blockers?: string[];
}): void {
  console.log('🏁 Completing development session...');
  
  const session = sessionManager.getCurrentSession();
  if (!session) return;
  
  // Add session summary as recent action
  sessionManager.addRecentAction({
    type: 'build',
    description: 'Session completed',
    files: [],
    result: 'success',
    metadata: {
      accomplishments: summary.accomplishments,
      challenges: summary.challenges || [],
      learnings: summary.learnings || [],
      duration: session.metadata.sessionDuration
    }
  });
  
  // Add any blockers
  if (summary.blockers?.length) {
    summary.blockers.forEach(blocker => {
      session.progress.blockedItems.push({
        item: blocker,
        reason: 'Session completion blocker',
        since: new Date().toISOString()
      });
    });
  }
  
  // Add next steps for continuation
  if (summary.nextSteps?.length) {
    summary.nextSteps.forEach(step => {
      sessionManager.addNextStep({
        priority: 'high',
        category: 'implementation',
        title: step,
        description: `Continue from previous session: ${step}`,
        estimatedTime: 60,
        dependencies: [],
        blockers: [],
        context: [session.context.currentPhase],
        files: [],
        commands: [],
        success_criteria: [`${step} completed successfully`]
      });
    });
  }
  
  // Save session state
  sessionManager.saveSession();
  
  console.log('✅ Session completed and saved');
}

/**
 * Record a significant implementation milestone
 */
export function recordMilestone(
  title: string,
  description: string,
  type: 'feature' | 'bugfix' | 'refactor' | 'test' | 'config' | 'documentation' | 'setup',
  files: string[],
  metadata: {
    timeSpent?: number;
    challenges?: string[];
    learnings?: string[];
    impact?: 'minor' | 'moderate' | 'major';
  } = {}
): void {
  // Add to implementation timeline
  implementationTimeline.addEntry({
    title,
    description,
    type,
    motivation: 'Development milestone',
    approach: 'Standard implementation approach',
    files: files.map(path => ({
      path,
      action: 'modified' as const,
      linesAdded: 0,
      linesRemoved: 0,
      complexity: 'medium' as const,
      purpose: 'Implementation milestone'
    })),
    dependencies: [],
    challenges: (metadata.challenges || []).map(desc => ({
      description: desc,
      solution: 'Resolved during implementation',
      timeImpact: 0,
      learningValue: 'medium' as const,
      category: 'technical' as const
    })),
    learnings: metadata.learnings || [],
    impact: {
      codeQuality: 'improved',
      performance: 'neutral',
      maintainability: 'improved',
      testability: 'neutral',
      userExperience: 'not_applicable',
      developerExperience: 'improved',
      technicalDebt: 'neutral',
      riskLevel: 'low'
    },
    timeSpent: metadata.timeSpent || 60,
    author: 'AI Assistant',
    reviewers: [],
    status: 'completed',
    tags: ['milestone', type],
    relatedEntries: [],
    metrics: {
      linesOfCode: 0,
      filesChanged: files.length,
      testsAdded: 0,
      documentationUpdated: true,
      codeReviewComments: 0,
      iterationsRequired: 1,
      blockerCount: 0,
      velocityScore: 8
    }
  });
  
  // Add to session codebase changes
  sessionManager.addCodebaseChange({
    files,
    description: title,
    type,
    impact: metadata.impact || 'moderate',
    relatedFeatures: [],
    dependencies: []
  });
  
  console.log(`📝 Recorded milestone: ${title}`);
}

/**
 * Make and record a development decision
 */
export function recordDecision(
  title: string,
  description: string,
  category: 'architecture' | 'technology' | 'pattern' | 'implementation' | 'testing' | 'deployment',
  options: Array<{
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    selected?: boolean;
  }>,
  rationale: string,
  metadata: {
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    reversibility?: 'easy' | 'moderate' | 'difficult' | 'irreversible';
    confidence?: number;
    tags?: string[];
  } = {}
): void {
  const selectedOption = options.find(opt => opt.selected)?.name || options[0].name;
  
  decisionLogger.addDecision({
    title,
    description,
    category,
    context: {
      problem: description,
      goals: [],
      businessRequirements: [],
      technicalRequirements: [],
      existingConstraints: [],
      timeframe: 'immediate',
      riskTolerance: 'medium'
    },
    options: options.map((opt, index) => ({
      id: `option_${index}`,
      name: opt.name,
      description: opt.description,
      pros: opt.pros,
      cons: opt.cons,
      effort: 'medium',
      risk: 'medium',
      timeToImplement: 60,
      dependencies: [],
      technicalDebt: 'neutral',
      maintainability: 'neutral',
      scalability: 'neutral',
      selected: opt.selected || opt.name === selectedOption
    })),
    selectedOption,
    rationale,
    consequences: [],
    tradeoffs: [],
    assumptions: [],
    constraints: [],
    stakeholders: [],
    impact: {
      scope: 'component',
      affectedComponents: [],
      affectedStakeholders: [],
      changeComplexity: 'medium',
      riskLevel: 'medium',
      businessImpact: 'moderate',
      technicalImpact: 'moderate'
    },
    urgency: metadata.urgency || 'medium',
    reversibility: metadata.reversibility || 'moderate',
    confidenceLevel: metadata.confidence || 7,
    status: 'approved',
    outcomes: [],
    lessons: [],
    relatedDecisions: [],
    tags: metadata.tags || [],
    attachments: []
  });
  
  console.log(`🎯 Recorded decision: ${title}`);
}

/**
 * Generate comprehensive session report
 */
export function generateSessionReport(): string {
  const session = sessionManager.getCurrentSession();
  const timelineStats = implementationTimeline.getStats();
  const decisionStats = decisionLogger.getMetrics();
  const contextStats = contextLoader.getCacheStats();
  
  if (!session) {
    return 'No active session found.';
  }
  
  const sessionSummary = sessionManager.getSessionSummary();
  
  return `# Session Report

Generated: ${new Date().toLocaleString()}
Session ID: ${session.id}

## Session Overview
- **Duration**: ${Math.round(sessionSummary.duration / (1000 * 60))} minutes
- **Phase**: ${session.context.currentPhase}
- **Type**: ${session.metadata.sessionType}
- **Progress**: ${sessionSummary.progress}%

## Accomplishments
- **Actions Performed**: ${sessionSummary.actionsCount}
- **Codebase Changes**: ${sessionSummary.changesCount}
- **Decisions Made**: ${sessionSummary.decisionsCount}
- **Next Steps Defined**: ${sessionSummary.nextStepsCount}

## Implementation Activity
- **Total Implementations**: ${timelineStats.totalEntries}
- **Completed**: ${timelineStats.completedEntries}
- **Time Spent**: ${Math.round(timelineStats.totalTimeSpent / 60)} hours
- **Average Velocity**: ${timelineStats.velocityTrend.slice(-1)[0]?.velocity.toFixed(1) || 0}

## Decisions & Planning
- **Decisions Made**: ${decisionStats.totalDecisions}
- **Decision Velocity**: ${decisionStats.decisionVelocity.toFixed(1)} per week
- **Average Confidence**: ${decisionStats.averageConfidence.toFixed(1)}/10

## Context & Performance
- **Files in Context**: ${contextStats.totalFiles}
- **Context Size**: ${(contextStats.totalSize / 1024).toFixed(1)}KB
- **Cache Hit Rate**: ${contextStats.hitRate.toFixed(1)}%

## Active Features
${session.context.activeFeatures.length > 0 ? 
  session.context.activeFeatures.map(f => `- ${f}`).join('\n') : 
  'No active features'}

## Recent Actions
${session.context.recentActions.slice(0, 5).map(action => 
  `- **${action.type}**: ${action.description} (${new Date(action.timestamp).toLocaleString()})`
).join('\n')}

## Next Steps
${session.nextSteps.slice(0, 5).map(step => 
  `- **${step.title}** (${step.priority}) - ${step.estimatedTime}min`
).join('\n')}

## Blockers
${session.progress.blockedItems.length > 0 ?
  session.progress.blockedItems.map(item => `- ${item.item}: ${item.reason}`).join('\n') :
  'No current blockers'}

---
*Generated by Synapse Hub Session Management*
`;
}

/**
 * Health check for session management system
 */
export function healthCheck(): {
  status: 'healthy' | 'warning' | 'error';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
  }>;
} {
  const checks = [];
  let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';
  
  // Check session manager
  try {
    const session = sessionManager.getCurrentSession();
    checks.push({
      name: 'Session Manager',
      status: session ? 'pass' : 'warning',
      message: session ? `Active session: ${session.id}` : 'No active session'
    });
  } catch (error) {
    checks.push({
      name: 'Session Manager',
      status: 'fail',
      message: `Error: ${error}`
    });
    overallStatus = 'error';
  }
  
  // Check context loader
  try {
    const stats = contextLoader.getCacheStats();
    checks.push({
      name: 'Context Loader',
      status: stats.totalFiles > 0 ? 'pass' : 'warning',
      message: `${stats.totalFiles} files cached, ${stats.hitRate.toFixed(1)}% hit rate`
    });
  } catch (error) {
    checks.push({
      name: 'Context Loader',
      status: 'fail',
      message: `Error: ${error}`
    });
    overallStatus = 'error';
  }
  
  // Check timeline
  try {
    const stats = implementationTimeline.getStats();
    checks.push({
      name: 'Implementation Timeline',
      status: 'pass',
      message: `${stats.totalEntries} entries, ${stats.completedEntries} completed`
    });
  } catch (error) {
    checks.push({
      name: 'Implementation Timeline',
      status: 'fail',
      message: `Error: ${error}`
    });
    overallStatus = 'error';
  }
  
  // Check decision logger
  try {
    const stats = decisionLogger.getMetrics();
    checks.push({
      name: 'Decision Logger',
      status: 'pass',
      message: `${stats.totalDecisions} decisions, ${stats.averageConfidence.toFixed(1)} avg confidence`
    });
  } catch (error) {
    checks.push({
      name: 'Decision Logger',
      status: 'fail',
      message: `Error: ${error}`
    });
    overallStatus = 'error';
  }
  
  // Check next steps manager
  try {
    const recommendations = nextStepsManager.getRecommendations(1);
    checks.push({
      name: 'Next Steps Manager',
      status: 'pass',
      message: `${recommendations.length} recommendations available`
    });
  } catch (error) {
    checks.push({
      name: 'Next Steps Manager',
      status: 'fail',
      message: `Error: ${error}`
    });
    overallStatus = 'error';
  }
  
  // Determine overall status
  if (checks.some(c => c.status === 'fail')) {
    overallStatus = 'error';
  } else if (checks.some(c => c.status === 'warning')) {
    overallStatus = 'warning';
  }
  
  return { status: overallStatus, checks };
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initializeSessionManagement();
} 
// Next Steps Documentation System
// Clear next actions for continuation with smart prioritization

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { sessionManager } from './session-state.js';
import type { NextStep } from './session-state.js';

export interface NextStepTemplate {
  id: string;
  title: string;
  description: string;
  category: NextStep['category'];
  estimatedTime: number;
  dependencies: string[];
  context: string[];
  files: string[];
  commands: string[];
  success_criteria: string[];
  priority: NextStep['priority'];
  tags: string[];
}

export interface StepSequence {
  id: string;
  name: string;
  description: string;
  steps: NextStep[];
  estimatedTotalTime: number;
  dependencies: string[];
  outcomes: string[];
  category: 'feature' | 'bugfix' | 'refactor' | 'setup' | 'optimization';
}

export interface NextStepsContext {
  currentPhase: string;
  completedItems: string[];
  blockedItems: string[];
  activeFeatures: string[];
  technicalDebt: string[];
  upcomingMilestones: string[];
  environmentStatus: Record<string, 'ready' | 'needs_setup' | 'error'>;
  teamAvailability: Record<string, number>; // hours available
}

export interface StepRecommendation {
  step: NextStep;
  reason: string;
  urgency: 'immediate' | 'today' | 'this_week' | 'next_week';
  confidence: number; // 1-10
  alternatives: NextStep[];
}

class NextStepsManager {
  private static instance: NextStepsManager;
  private templates: NextStepTemplate[] = [];
  private sequences: StepSequence[] = [];
  private storageKey = 'synapse-hub-next-steps';

  static getInstance(): NextStepsManager {
    if (!NextStepsManager.instance) {
      NextStepsManager.instance = new NextStepsManager();
    }
    return NextStepsManager.instance;
  }

  constructor() {
    if (browser) {
      this.loadFromStorage();
      this.initializeDefaultTemplates();
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.templates = data.templates || [];
        this.sequences = data.sequences || [];
        console.log(`📋 Loaded ${this.templates.length} step templates and ${this.sequences.length} sequences`);
      }
    } catch (error) {
      console.warn('Failed to load next steps from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        templates: this.templates,
        sequences: this.sequences
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save next steps to storage:', error);
    }
  }

  private initializeDefaultTemplates(): void {
    if (this.templates.length === 0) {
      this.templates = [
        // Phase 6 specific templates
        {
          id: 'cursor-integration',
          title: 'Set up Custom Cursor Integration',
          description: 'Configure project-specific code snippets and shortcuts for Cursor AI',
          category: 'implementation',
          estimatedTime: 120,
          dependencies: [],
          context: ['Phase 6', 'AI Development Optimization'],
          files: ['.cursor/snippets.json', '.cursor/settings.json'],
          commands: ['cursor --install-extension', 'npm run dev'],
          success_criteria: [
            'Custom snippets are available in Cursor',
            'Project-specific shortcuts work',
            'AI context loading is optimized'
          ],
          priority: 'high',
          tags: ['phase-6', 'cursor', 'ai-optimization']
        },
        {
          id: 'implementation-sequences',
          title: 'Define Implementation Sequences',
          description: 'Create optimal order guides for AI-driven development',
          category: 'documentation',
          estimatedTime: 90,
          dependencies: ['cursor-integration'],
          context: ['Phase 6', 'Development Workflow'],
          files: ['docs/implementation-sequences.md', 'src/lib/session/sequences.ts'],
          commands: [],
          success_criteria: [
            'Development sequences documented',
            'AI workflow optimized',
            'Order dependencies identified'
          ],
          priority: 'high',
          tags: ['phase-6', 'sequences', 'workflow']
        },
        {
          id: 'atomic-features',
          title: 'Break Down Features Atomically',
          description: 'Decompose features into single-session units',
          category: 'research',
          estimatedTime: 60,
          dependencies: [],
          context: ['Phase 6', 'Feature Planning'],
          files: ['docs/atomic-features.md'],
          commands: [],
          success_criteria: [
            'Features broken into atomic units',
            'Session boundaries defined',
            'Dependencies mapped'
          ],
          priority: 'medium',
          tags: ['phase-6', 'atomic', 'planning']
        },
        {
          id: 'context-optimization',
          title: 'Optimize Context Loading',
          description: 'Implement faster session startup with relevant context',
          category: 'implementation',
          estimatedTime: 150,
          dependencies: ['implementation-sequences'],
          context: ['Phase 6', 'Performance'],
          files: ['src/lib/session/context-loader.ts', 'src/lib/session/index.ts'],
          commands: ['npm test', 'npm run build'],
          success_criteria: [
            'Context loads under 2 seconds',
            'Relevant context prioritized',
            'Memory usage optimized'
          ],
          priority: 'high',
          tags: ['phase-6', 'performance', 'context']
        },
        // General development templates
        {
          id: 'create-component',
          title: 'Create New Svelte Component',
          description: 'Scaffold a new Svelte component with proper structure',
          category: 'implementation',
          estimatedTime: 30,
          dependencies: [],
          context: ['Component Development'],
          files: ['src/components/**/*.svelte'],
          commands: ['npm run check', 'npm test'],
          success_criteria: [
            'Component renders correctly',
            'Props are properly typed',
            'Accessibility standards met'
          ],
          priority: 'medium',
          tags: ['component', 'svelte', 'development']
        },
        {
          id: 'add-tests',
          title: 'Add Unit Tests',
          description: 'Create comprehensive unit tests for new functionality',
          category: 'testing',
          estimatedTime: 45,
          dependencies: [],
          context: ['Quality Assurance'],
          files: ['**/*.test.ts', '**/*.spec.ts'],
          commands: ['npm test', 'npm run test:coverage'],
          success_criteria: [
            'Test coverage above 80%',
            'All edge cases covered',
            'Tests pass consistently'
          ],
          priority: 'high',
          tags: ['testing', 'quality', 'coverage']
        }
      ];
      this.saveToStorage();
    }
  }

  // Get current context for step recommendations
  getCurrentContext(): NextStepsContext {
    const session = sessionManager.getCurrentSession();
    
    return {
      currentPhase: session?.context.currentPhase || 'Unknown',
      completedItems: session?.progress.completedItems || [],
      blockedItems: session?.progress.blockedItems.map(item => item.item) || [],
      activeFeatures: session?.context.activeFeatures || [],
      technicalDebt: [], // TODO: extract from codebase analysis
      upcomingMilestones: [], // TODO: extract from project planning
      environmentStatus: {
        'docker': 'ready',
        'database': 'ready',
        'tests': 'ready',
        'build': 'ready'
      },
      teamAvailability: {
        'AI Assistant': 24, // Always available
        'Developer': 8 // 8 hours per day
      }
    };
  }

  // Get recommended next steps based on current context
  getRecommendations(limit: number = 5): StepRecommendation[] {
    const context = this.getCurrentContext();
    const session = sessionManager.getCurrentSession();
    const existingSteps = session?.nextSteps || [];
    
    const recommendations: StepRecommendation[] = [];

    // Priority 1: Phase 6 specific steps
    if (context.currentPhase.includes('Phase 6')) {
      const phase6Templates = this.templates.filter(t => 
        t.tags.includes('phase-6') && 
        !existingSteps.some(s => s.title === t.title)
      );
      
      for (const template of phase6Templates) {
        const step = this.templateToStep(template);
        recommendations.push({
          step,
          reason: 'Required for Phase 6 completion',
          urgency: 'immediate',
          confidence: 9,
          alternatives: []
        });
      }
    }

    // Priority 2: Blocked items resolution
    for (const blockedItem of context.blockedItems) {
      const unblockingStep: NextStep = {
        id: `unblock_${Date.now()}`,
        priority: 'critical',
        category: 'implementation',
        title: `Resolve blocker: ${blockedItem}`,
        description: `Address the blocking issue: ${blockedItem}`,
        estimatedTime: 60,
        dependencies: [],
        blockers: [],
        context: [context.currentPhase],
        files: [],
        commands: [],
        success_criteria: [`${blockedItem} is no longer blocking progress`],
        created: new Date().toISOString()
      };

      recommendations.push({
        step: unblockingStep,
        reason: 'Critical blocker needs resolution',
        urgency: 'immediate',
        confidence: 10,
        alternatives: []
      });
    }

    // Priority 3: Technical debt reduction
    const debtStep: NextStep = {
      id: `tech_debt_${Date.now()}`,
      priority: 'medium',
      category: 'refactor',
      title: 'Address Technical Debt',
      description: 'Refactor code to reduce technical debt and improve maintainability',
      estimatedTime: 90,
      dependencies: [],
      blockers: [],
      context: [context.currentPhase],
      files: [],
      commands: ['npm run lint', 'npm run check'],
      success_criteria: [
        'Code quality metrics improved',
        'Technical debt reduced',
        'Maintainability increased'
      ],
      created: new Date().toISOString()
    };

    recommendations.push({
      step: debtStep,
      reason: 'Proactive technical debt management',
      urgency: 'this_week',
      confidence: 7,
      alternatives: []
    });

    // Priority 4: Testing improvements
    if (!context.completedItems.includes('comprehensive-testing')) {
      const testStep: NextStep = {
        id: `improve_tests_${Date.now()}`,
        priority: 'high',
        category: 'testing',
        title: 'Improve Test Coverage',
        description: 'Add comprehensive tests for new functionality',
        estimatedTime: 120,
        dependencies: [],
        blockers: [],
        context: [context.currentPhase],
        files: ['src/**/*.test.ts'],
        commands: ['npm test', 'npm run test:coverage'],
        success_criteria: [
          'Test coverage above 85%',
          'All critical paths tested',
          'Integration tests added'
        ],
        created: new Date().toISOString()
      };

      recommendations.push({
        step: testStep,
        reason: 'Maintain high code quality',
        urgency: 'today',
        confidence: 8,
        alternatives: []
      });
    }

    // Sort by urgency and confidence
    const urgencyOrder = { immediate: 4, today: 3, this_week: 2, next_week: 1 };
    recommendations.sort((a, b) => {
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.confidence - a.confidence;
    });

    return recommendations.slice(0, limit);
  }

  private templateToStep(template: NextStepTemplate): NextStep {
    return {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      priority: template.priority,
      category: template.category,
      title: template.title,
      description: template.description,
      estimatedTime: template.estimatedTime,
      dependencies: template.dependencies,
      blockers: [],
      context: template.context,
      files: template.files,
      commands: template.commands,
      success_criteria: template.success_criteria,
      created: new Date().toISOString()
    };
  }

  // Create a step sequence for complex features
  createSequence(
    name: string,
    description: string,
    category: StepSequence['category'],
    stepTemplateIds: string[]
  ): StepSequence {
    const steps = stepTemplateIds
      .map(id => this.templates.find(t => t.id === id))
      .filter(Boolean)
      .map(template => this.templateToStep(template!));

    const sequence: StepSequence = {
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      description,
      steps,
      estimatedTotalTime: steps.reduce((sum, step) => sum + step.estimatedTime, 0),
      dependencies: [],
      outcomes: [],
      category
    };

    this.sequences.push(sequence);
    this.saveToStorage();

    return sequence;
  }

  // Get step sequences
  getSequences(category?: StepSequence['category']): StepSequence[] {
    if (category) {
      return this.sequences.filter(seq => seq.category === category);
    }
    return [...this.sequences];
  }

  // Add steps from recommendation to session
  acceptRecommendation(recommendation: StepRecommendation): void {
    sessionManager.addNextStep(recommendation.step);
  }

  // Add multiple steps from a sequence
  addSequenceSteps(sequenceId: string): boolean {
    const sequence = this.sequences.find(seq => seq.id === sequenceId);
    if (!sequence) return false;

    sequence.steps.forEach(step => {
      sessionManager.addNextStep(step);
    });

    return true;
  }

  // Mark step as completed
  completeStep(stepId: string): void {
    sessionManager.completeNextStep(stepId);
  }

  // Add custom template
  addTemplate(template: Omit<NextStepTemplate, 'id'>): NextStepTemplate {
    const fullTemplate: NextStepTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...template
    };

    this.templates.push(fullTemplate);
    this.saveToStorage();

    return fullTemplate;
  }

  // Get templates
  getTemplates(category?: NextStep['category']): NextStepTemplate[] {
    if (category) {
      return this.templates.filter(template => template.category === category);
    }
    return [...this.templates];
  }

  // Generate next steps report
  generateReport(): string {
    const context = this.getCurrentContext();
    const recommendations = this.getRecommendations(10);
    const session = sessionManager.getCurrentSession();
    
    return `# Next Steps Report

Generated: ${new Date().toLocaleString()}

## Current Context
- **Phase**: ${context.currentPhase}
- **Completed Items**: ${context.completedItems.length}
- **Blocked Items**: ${context.blockedItems.length}
- **Active Features**: ${context.activeFeatures.length}

## Immediate Recommendations

${recommendations
  .filter(rec => rec.urgency === 'immediate')
  .map(rec => `### ${rec.step.title}
**Priority**: ${rec.step.priority}
**Estimated Time**: ${rec.step.estimatedTime} minutes
**Reason**: ${rec.reason}
**Confidence**: ${rec.confidence}/10

${rec.step.description}

**Success Criteria**:
${rec.step.success_criteria.map(criteria => `- ${criteria}`).join('\n')}
`)
  .join('\n')}

## Today's Tasks

${recommendations
  .filter(rec => rec.urgency === 'today')
  .map(rec => `- **${rec.step.title}** (${rec.step.estimatedTime}min) - ${rec.reason}`)
  .join('\n')}

## This Week

${recommendations
  .filter(rec => rec.urgency === 'this_week')
  .map(rec => `- **${rec.step.title}** (${rec.step.estimatedTime}min) - ${rec.reason}`)
  .join('\n')}

## Current Session Next Steps

${session?.nextSteps
  .slice(0, 5)
  .map(step => `- **${step.title}** (${step.priority}) - ${step.estimatedTime}min`)
  .join('\n') || 'None defined'}

## Available Sequences

${this.sequences
  .map(seq => `- **${seq.name}** (${seq.category}) - ${seq.estimatedTotalTime}min total
  ${seq.description}`)
  .join('\n')}

---
*Generated by Synapse Hub Next Steps Manager*
`;
  }
}

// Global next steps manager
export const nextStepsManager = NextStepsManager.getInstance();

// Svelte stores for reactive updates
export const nextStepsContext = writable<NextStepsContext | null>(null);
export const stepRecommendations = writable<StepRecommendation[]>([]);
export const stepSequences = writable<StepSequence[]>([]);

// Derived store for urgent steps
export const urgentSteps = derived(stepRecommendations, $recommendations => 
  $recommendations.filter(rec => rec.urgency === 'immediate')
);

// Initialize stores
if (browser) {
  nextStepsContext.set(nextStepsManager.getCurrentContext());
  stepRecommendations.set(nextStepsManager.getRecommendations());
  stepSequences.set(nextStepsManager.getSequences());

  // Update stores periodically
  setInterval(() => {
    nextStepsContext.set(nextStepsManager.getCurrentContext());
    stepRecommendations.set(nextStepsManager.getRecommendations());
    stepSequences.set(nextStepsManager.getSequences());
  }, 60000); // Every minute
}

// Utility functions for easy integration
export const getNextSteps = (limit?: number) => {
  return nextStepsManager.getRecommendations(limit);
};

export const addNextStep = (step: Omit<NextStep, 'id' | 'created'>) => {
  sessionManager.addNextStep(step);
};

export const completeNextStep = (stepId: string) => {
  nextStepsManager.completeStep(stepId);
};

export const createStepSequence = (
  name: string,
  description: string,
  category: StepSequence['category'],
  stepTemplateIds: string[]
) => {
  return nextStepsManager.createSequence(name, description, category, stepTemplateIds);
};

export default nextStepsManager; 
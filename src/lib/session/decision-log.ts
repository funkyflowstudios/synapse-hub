// Decision Log System
// Record of all major implementation decisions with detailed reasoning

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { sessionManager } from './session-state.js';

export interface DecisionEntry {
  id: string;
  timestamp: string;
  sessionId: string;
  category: DecisionCategory;
  title: string;
  description: string;
  context: DecisionContext;
  options: DecisionOption[];
  selectedOption: string;
  rationale: string;
  consequences: Consequence[];
  tradeoffs: Tradeoff[];
  assumptions: string[];
  constraints: string[];
  stakeholders: Stakeholder[];
  impact: DecisionImpact;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reversibility: 'easy' | 'moderate' | 'difficult' | 'irreversible';
  confidenceLevel: number; // 1-10
  implementationDate?: string;
  reviewDate?: string;
  status: DecisionStatus;
  outcomes: Outcome[];
  lessons: string[];
  relatedDecisions: string[];
  tags: string[];
  attachments: DecisionAttachment[];
}

export type DecisionCategory = 
  | 'architecture'
  | 'technology'
  | 'pattern'
  | 'implementation'
  | 'testing'
  | 'deployment'
  | 'security'
  | 'performance'
  | 'ui_ux'
  | 'data_modeling'
  | 'integration'
  | 'tooling'
  | 'process';

export interface DecisionContext {
  problem: string;
  goals: string[];
  businessRequirements: string[];
  technicalRequirements: string[];
  existingConstraints: string[];
  timeframe: string;
  budget?: string;
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  cost?: string;
  timeToImplement: number; // hours
  dependencies: string[];
  technicalDebt: 'reduces' | 'neutral' | 'increases';
  maintainability: 'improves' | 'neutral' | 'degrades';
  scalability: 'improves' | 'neutral' | 'degrades';
  selected: boolean;
}

export interface Consequence {
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  mitigation?: string;
}

export interface Tradeoff {
  aspect: string;
  gained: string;
  lost: string;
  significance: 'low' | 'medium' | 'high';
}

export interface Stakeholder {
  name: string;
  role: string;
  impact: 'low' | 'medium' | 'high';
  influence: 'low' | 'medium' | 'high';
  position: 'supportive' | 'neutral' | 'opposed' | 'unknown';
  concerns: string[];
}

export interface DecisionImpact {
  scope: 'component' | 'module' | 'system' | 'architecture' | 'organization';
  affectedComponents: string[];
  affectedStakeholders: string[];
  changeComplexity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  businessImpact: 'minimal' | 'moderate' | 'significant' | 'major';
  technicalImpact: 'minimal' | 'moderate' | 'significant' | 'major';
}

export type DecisionStatus = 
  | 'proposed'
  | 'under_review'
  | 'approved'
  | 'implemented'
  | 'validated'
  | 'rejected'
  | 'deferred'
  | 'superseded';

export interface Outcome {
  timestamp: string;
  description: string;
  type: 'expected' | 'unexpected';
  impact: 'positive' | 'negative' | 'neutral';
  measurable: boolean;
  metrics?: Record<string, any>;
}

export interface DecisionAttachment {
  id: string;
  type: 'diagram' | 'document' | 'code' | 'link' | 'image';
  title: string;
  description: string;
  url?: string;
  content?: string;
  metadata: Record<string, any>;
}

export interface DecisionFilter {
  categories?: DecisionCategory[];
  status?: DecisionStatus[];
  urgency?: Array<'low' | 'medium' | 'high' | 'critical'>;
  dateRange?: { start: string; end: string };
  tags?: string[];
  stakeholders?: string[];
  impact?: Array<'minimal' | 'moderate' | 'significant' | 'major'>;
  reversibility?: Array<'easy' | 'moderate' | 'difficult' | 'irreversible'>;
}

export interface DecisionMetrics {
  totalDecisions: number;
  decisionsByCategory: Record<DecisionCategory, number>;
  decisionsByStatus: Record<DecisionStatus, number>;
  averageImplementationTime: number;
  decisionVelocity: number; // decisions per week
  reversibilityDistribution: Record<string, number>;
  impactDistribution: Record<string, number>;
  successRate: number; // percentage of decisions with positive outcomes
  averageConfidence: number;
  topTags: Array<{ tag: string; count: number }>;
  recentTrends: Array<{ week: string; count: number }>;
}

class DecisionLogger {
  private static instance: DecisionLogger;
  private decisions: DecisionEntry[] = [];
  private storageKey = 'synapse-hub-decision-log';

  static getInstance(): DecisionLogger {
    if (!DecisionLogger.instance) {
      DecisionLogger.instance = new DecisionLogger();
    }
    return DecisionLogger.instance;
  }

  constructor() {
    if (browser) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.decisions = JSON.parse(saved);
        console.log(`📋 Loaded ${this.decisions.length} decision entries`);
      }
    } catch (error) {
      console.warn('Failed to load decisions from storage:', error);
      this.decisions = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.decisions));
    } catch (error) {
      console.error('Failed to save decisions to storage:', error);
    }
  }

  private generateDecisionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `decision_${timestamp}_${random}`;
  }

  // Add a new decision
  addDecision(decision: Omit<DecisionEntry, 'id' | 'timestamp' | 'sessionId'>): DecisionEntry {
    const session = sessionManager.getCurrentSession();
    
    const fullDecision: DecisionEntry = {
      id: this.generateDecisionId(),
      timestamp: new Date().toISOString(),
      sessionId: session?.id || 'unknown',
      ...decision
    };

    this.decisions.unshift(fullDecision);
    this.saveToStorage();

    // Add to session decisions
    if (session) {
      sessionManager.addDecision({
        category: fullDecision.category,
        title: fullDecision.title,
        description: fullDecision.description,
        options: fullDecision.options.map(opt => ({
          name: opt.name,
          pros: opt.pros,
          cons: opt.cons,
          selected: opt.selected
        })),
        rationale: fullDecision.rationale,
        impact: fullDecision.impact.riskLevel,
        reversible: fullDecision.reversibility === 'easy',
        relatedDecisions: fullDecision.relatedDecisions,
        implementedIn: fullDecision.impact.affectedComponents
      });
    }

    console.log('🎯 Added decision:', fullDecision.title);
    return fullDecision;
  }

  // Update an existing decision
  updateDecision(id: string, updates: Partial<DecisionEntry>): boolean {
    const index = this.decisions.findIndex(decision => decision.id === id);
    if (index === -1) return false;

    this.decisions[index] = { ...this.decisions[index], ...updates };
    this.saveToStorage();
    return true;
  }

  // Get all decisions with optional filtering
  getDecisions(filter?: DecisionFilter): DecisionEntry[] {
    let filtered = [...this.decisions];

    if (!filter) return filtered;

    if (filter.categories?.length) {
      filtered = filtered.filter(decision => filter.categories!.includes(decision.category));
    }

    if (filter.status?.length) {
      filtered = filtered.filter(decision => filter.status!.includes(decision.status));
    }

    if (filter.urgency?.length) {
      filtered = filtered.filter(decision => filter.urgency!.includes(decision.urgency));
    }

    if (filter.dateRange) {
      const start = new Date(filter.dateRange.start);
      const end = new Date(filter.dateRange.end);
      filtered = filtered.filter(decision => {
        const decisionDate = new Date(decision.timestamp);
        return decisionDate >= start && decisionDate <= end;
      });
    }

    if (filter.tags?.length) {
      filtered = filtered.filter(decision => 
        filter.tags!.some(tag => decision.tags.includes(tag))
      );
    }

    if (filter.reversibility?.length) {
      filtered = filtered.filter(decision => filter.reversibility!.includes(decision.reversibility));
    }

    return filtered;
  }

  // Get a specific decision
  getDecision(id: string): DecisionEntry | undefined {
    return this.decisions.find(decision => decision.id === id);
  }

  // Get decision metrics
  getMetrics(filter?: DecisionFilter): DecisionMetrics {
    const decisions = this.getDecisions(filter);
    
    const metrics: DecisionMetrics = {
      totalDecisions: decisions.length,
      decisionsByCategory: {} as Record<DecisionCategory, number>,
      decisionsByStatus: {} as Record<DecisionStatus, number>,
      averageImplementationTime: 0,
      decisionVelocity: 0,
      reversibilityDistribution: {},
      impactDistribution: {},
      successRate: 0,
      averageConfidence: 0,
      topTags: [],
      recentTrends: []
    };

    if (decisions.length === 0) return metrics;

    // Initialize category counts
    const categories: DecisionCategory[] = [
      'architecture', 'technology', 'pattern', 'implementation', 'testing',
      'deployment', 'security', 'performance', 'ui_ux', 'data_modeling',
      'integration', 'tooling', 'process'
    ];
    categories.forEach(cat => metrics.decisionsByCategory[cat] = 0);

    // Initialize status counts
    const statuses: DecisionStatus[] = [
      'proposed', 'under_review', 'approved', 'implemented', 'validated',
      'rejected', 'deferred', 'superseded'
    ];
    statuses.forEach(status => metrics.decisionsByStatus[status] = 0);

    // Calculate metrics
    let totalImplementationTime = 0;
    let implementedCount = 0;
    let positiveOutcomes = 0;
    let totalConfidence = 0;
    const tagCounts = new Map<string, number>();

    decisions.forEach(decision => {
      // Count by category and status
      metrics.decisionsByCategory[decision.category]++;
      metrics.decisionsByStatus[decision.status]++;

      // Implementation time
      if (decision.implementationDate && decision.timestamp) {
        const implTime = new Date(decision.implementationDate).getTime() - 
                        new Date(decision.timestamp).getTime();
        totalImplementationTime += implTime;
        implementedCount++;
      }

      // Reversibility distribution
      const rev = decision.reversibility;
      metrics.reversibilityDistribution[rev] = (metrics.reversibilityDistribution[rev] || 0) + 1;

      // Impact distribution
      const impact = decision.impact.businessImpact;
      metrics.impactDistribution[impact] = (metrics.impactDistribution[impact] || 0) + 1;

      // Success rate (positive outcomes)
      const hasPositiveOutcome = decision.outcomes.some(outcome => outcome.impact === 'positive');
      if (hasPositiveOutcome) positiveOutcomes++;

      // Confidence
      totalConfidence += decision.confidenceLevel;

      // Tags
      decision.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Calculate averages
    metrics.averageImplementationTime = implementedCount > 0 ? 
      totalImplementationTime / implementedCount / (1000 * 60 * 60 * 24) : 0; // days
    metrics.successRate = decisions.length > 0 ? (positiveOutcomes / decisions.length) * 100 : 0;
    metrics.averageConfidence = totalConfidence / decisions.length;

    // Top tags
    metrics.topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Decision velocity (last 8 weeks)
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekDecisions = decisions.filter(decision => {
        const decisionDate = new Date(decision.timestamp);
        return decisionDate >= weekStart && decisionDate < weekEnd;
      });
      
      metrics.recentTrends.push({
        week: weekStart.toISOString().split('T')[0],
        count: weekDecisions.length
      });
    }
    
    metrics.decisionVelocity = metrics.recentTrends.reduce((sum, week) => sum + week.count, 0) / 8;

    return metrics;
  }

  // Get pending decisions requiring review
  getPendingDecisions(): DecisionEntry[] {
    return this.decisions.filter(decision => 
      ['proposed', 'under_review'].includes(decision.status) ||
      (decision.reviewDate && new Date(decision.reviewDate) <= new Date())
    );
  }

  // Get related decisions
  getRelatedDecisions(decisionId: string): DecisionEntry[] {
    const decision = this.getDecision(decisionId);
    if (!decision) return [];

    return this.decisions.filter(d => 
      d.id !== decisionId && (
        d.relatedDecisions.includes(decisionId) ||
        decision.relatedDecisions.includes(d.id) ||
        d.tags.some(tag => decision.tags.includes(tag)) ||
        d.impact.affectedComponents.some(comp => 
          decision.impact.affectedComponents.includes(comp)
        )
      )
    );
  }

  // Add outcome to a decision
  addOutcome(decisionId: string, outcome: Omit<Outcome, 'timestamp'>): boolean {
    const decision = this.getDecision(decisionId);
    if (!decision) return false;

    const fullOutcome: Outcome = {
      timestamp: new Date().toISOString(),
      ...outcome
    };

    decision.outcomes.push(fullOutcome);
    this.saveToStorage();
    return true;
  }

  // Search decisions
  searchDecisions(query: string): DecisionEntry[] {
    const lowerQuery = query.toLowerCase();
    
    return this.decisions.filter(decision =>
      decision.title.toLowerCase().includes(lowerQuery) ||
      decision.description.toLowerCase().includes(lowerQuery) ||
      decision.rationale.toLowerCase().includes(lowerQuery) ||
      decision.context.problem.toLowerCase().includes(lowerQuery) ||
      decision.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      decision.options.some(option => 
        option.name.toLowerCase().includes(lowerQuery) ||
        option.description.toLowerCase().includes(lowerQuery)
      )
    );
  }

  // Export decisions
  exportDecisions(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      decisions: this.decisions,
      metrics: this.getMetrics()
    }, null, 2);
  }

  // Import decisions
  importDecisions(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.decisions && Array.isArray(parsed.decisions)) {
        this.decisions = parsed.decisions;
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import decisions:', error);
      return false;
    }
  }

  // Generate decision report
  generateReport(filter?: DecisionFilter): string {
    const decisions = this.getDecisions(filter);
    const metrics = this.getMetrics(filter);
    
    return `# Decision Log Report

Generated: ${new Date().toLocaleString()}
${filter ? `Filter Applied: ${JSON.stringify(filter, null, 2)}` : ''}

## Summary
- **Total Decisions**: ${metrics.totalDecisions}
- **Average Implementation Time**: ${metrics.averageImplementationTime.toFixed(1)} days
- **Success Rate**: ${metrics.successRate.toFixed(1)}%
- **Average Confidence**: ${metrics.averageConfidence.toFixed(1)}/10
- **Decision Velocity**: ${metrics.decisionVelocity.toFixed(1)} decisions/week

## Decision Categories
${Object.entries(metrics.decisionsByCategory)
  .filter(([_, count]) => count > 0)
  .map(([category, count]) => `- **${category}**: ${count}`)
  .join('\n')}

## Decision Status
${Object.entries(metrics.decisionsByStatus)
  .filter(([_, count]) => count > 0)
  .map(([status, count]) => `- **${status}**: ${count}`)
  .join('\n')}

## Impact Distribution
${Object.entries(metrics.impactDistribution)
  .filter(([_, count]) => count > 0)
  .map(([impact, count]) => `- **${impact}**: ${count}`)
  .join('\n')}

## Recent Decisions
${decisions
  .slice(0, 10)
  .map(decision => `- **${decision.title}** (${decision.category}) - ${decision.status} - ${new Date(decision.timestamp).toLocaleDateString()}`)
  .join('\n')}

## Pending Reviews
${this.getPendingDecisions()
  .map(decision => `- **${decision.title}** - ${decision.status} - Due: ${decision.reviewDate || 'Not set'}`)
  .join('\n') || 'None'}

## Top Tags
${metrics.topTags
  .slice(0, 10)
  .map(tag => `- **${tag.tag}**: ${tag.count}`)
  .join('\n')}

---
*Generated by Synapse Hub Decision Log*
`;
  }
}

// Global decision logger instance
export const decisionLogger = DecisionLogger.getInstance();

// Svelte stores for reactive updates
export const decisions = writable<DecisionEntry[]>([]);
export const decisionMetrics = writable<DecisionMetrics | null>(null);
export const pendingDecisions = writable<DecisionEntry[]>([]);

// Initialize stores
if (browser) {
  decisions.set(decisionLogger.getDecisions());
  decisionMetrics.set(decisionLogger.getMetrics());
  pendingDecisions.set(decisionLogger.getPendingDecisions());

  // Update stores periodically
  setInterval(() => {
    decisions.set(decisionLogger.getDecisions());
    decisionMetrics.set(decisionLogger.getMetrics());
    pendingDecisions.set(decisionLogger.getPendingDecisions());
  }, 30000);
}

// Utility functions for easy integration
export const addDecision = (
  title: string,
  description: string,
  category: DecisionCategory,
  options: Omit<DecisionOption, 'id'>[],
  selectedOptionId: string,
  rationale: string,
  additionalProps: Partial<Omit<DecisionEntry, 'id' | 'timestamp' | 'sessionId' | 'title' | 'description' | 'category' | 'options' | 'selectedOption' | 'rationale'>> = {}
): DecisionEntry => {
  const fullOptions: DecisionOption[] = options.map((opt, index) => ({
    ...opt,
    id: `option_${index}`,
    selected: opt.name === selectedOptionId || index.toString() === selectedOptionId
  }));

  return decisionLogger.addDecision({
    title,
    description,
    category,
    options: fullOptions,
    selectedOption: selectedOptionId,
    rationale,
    context: additionalProps.context || {
      problem: 'Implementation decision required',
      goals: [],
      businessRequirements: [],
      technicalRequirements: [],
      existingConstraints: [],
      timeframe: 'immediate',
      riskTolerance: 'medium'
    },
    consequences: additionalProps.consequences || [],
    tradeoffs: additionalProps.tradeoffs || [],
    assumptions: additionalProps.assumptions || [],
    constraints: additionalProps.constraints || [],
    stakeholders: additionalProps.stakeholders || [],
    impact: additionalProps.impact || {
      scope: 'component',
      affectedComponents: [],
      affectedStakeholders: [],
      changeComplexity: 'medium',
      riskLevel: 'medium',
      businessImpact: 'moderate',
      technicalImpact: 'moderate'
    },
    urgency: additionalProps.urgency || 'medium',
    reversibility: additionalProps.reversibility || 'moderate',
    confidenceLevel: additionalProps.confidenceLevel || 7,
    status: additionalProps.status || 'approved',
    outcomes: additionalProps.outcomes || [],
    lessons: additionalProps.lessons || [],
    relatedDecisions: additionalProps.relatedDecisions || [],
    tags: additionalProps.tags || [],
    attachments: additionalProps.attachments || []
  });
};

export default decisionLogger; 
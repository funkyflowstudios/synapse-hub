// Implementation Timeline System
// Track what was implemented when and why with detailed history

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { sessionManager } from './session-state.js';

export interface ImplementationEntry {
  id: string;
  timestamp: string;
  sessionId: string;
  type: 'feature' | 'bugfix' | 'refactor' | 'test' | 'config' | 'documentation' | 'setup';
  title: string;
  description: string;
  motivation: string; // Why was this implemented
  approach: string; // How was it implemented
  files: FileChange[];
  dependencies: string[];
  challenges: Challenge[];
  learnings: string[];
  impact: ImpactAssessment;
  timeSpent: number; // minutes
  author: string;
  reviewers: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'deferred' | 'cancelled';
  tags: string[];
  relatedEntries: string[];
  metrics: ImplementationMetrics;
}

export interface FileChange {
  path: string;
  action: 'created' | 'modified' | 'deleted' | 'renamed' | 'moved';
  linesAdded: number;
  linesRemoved: number;
  complexity: 'low' | 'medium' | 'high';
  purpose: string;
  oldPath?: string; // For renames/moves
}

export interface Challenge {
  description: string;
  solution: string;
  timeImpact: number; // minutes
  learningValue: 'low' | 'medium' | 'high';
  category: 'technical' | 'design' | 'integration' | 'tooling' | 'documentation';
}

export interface ImpactAssessment {
  codeQuality: 'improved' | 'neutral' | 'degraded';
  performance: 'improved' | 'neutral' | 'degraded';
  maintainability: 'improved' | 'neutral' | 'degraded';
  testability: 'improved' | 'neutral' | 'degraded';
  userExperience: 'improved' | 'neutral' | 'degraded' | 'not_applicable';
  developerExperience: 'improved' | 'neutral' | 'degraded';
  technicalDebt: 'reduced' | 'neutral' | 'increased';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ImplementationMetrics {
  linesOfCode: number;
  filesChanged: number;
  testsAdded: number;
  documentationUpdated: boolean;
  codeReviewComments: number;
  iterationsRequired: number;
  blockerCount: number;
  velocityScore: number; // 1-10
}

export interface TimelineFilter {
  dateRange?: { start: string; end: string };
  types?: ImplementationEntry['type'][];
  authors?: string[];
  status?: ImplementationEntry['status'][];
  tags?: string[];
  impact?: keyof ImpactAssessment;
  complexity?: 'low' | 'medium' | 'high';
}

export interface TimelineStats {
  totalEntries: number;
  completedEntries: number;
  totalTimeSpent: number;
  averageTimePerEntry: number;
  entriesByType: Record<ImplementationEntry['type'], number>;
  entriesByStatus: Record<ImplementationEntry['status'], number>;
  impactTrends: {
    codeQuality: { improved: number; neutral: number; degraded: number };
    performance: { improved: number; neutral: number; degraded: number };
    maintainability: { improved: number; neutral: number; degraded: number };
    technicalDebt: { reduced: number; neutral: number; increased: number };
  };
  velocityTrend: Array<{ date: string; velocity: number }>;
  topChallenges: Array<{ category: string; count: number }>;
  learningsCount: number;
}

class ImplementationTimeline {
  private static instance: ImplementationTimeline;
  private entries: ImplementationEntry[] = [];
  private storageKey = 'synapse-hub-implementation-timeline';

  static getInstance(): ImplementationTimeline {
    if (!ImplementationTimeline.instance) {
      ImplementationTimeline.instance = new ImplementationTimeline();
    }
    return ImplementationTimeline.instance;
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
        this.entries = JSON.parse(saved);
        console.log(`📚 Loaded ${this.entries.length} timeline entries`);
      }
    } catch (error) {
      console.warn('Failed to load timeline from storage:', error);
      this.entries = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
    } catch (error) {
      console.error('Failed to save timeline to storage:', error);
    }
  }

  // Add a new implementation entry
  addEntry(entry: Omit<ImplementationEntry, 'id' | 'timestamp' | 'sessionId'>): ImplementationEntry {
    const session = sessionManager.getCurrentSession();
    
    const fullEntry: ImplementationEntry = {
      id: this.generateEntryId(),
      timestamp: new Date().toISOString(),
      sessionId: session?.id || 'unknown',
      ...entry
    };

    this.entries.unshift(fullEntry);
    this.saveToStorage();

    // Add to session codebase changes
    if (session) {
      sessionManager.addCodebaseChange({
        files: fullEntry.files.map(f => f.path),
        description: fullEntry.title,
        type: fullEntry.type,
        impact: fullEntry.impact.riskLevel === 'high' ? 'major' : 
                fullEntry.impact.riskLevel === 'medium' ? 'moderate' : 'minor',
        relatedFeatures: fullEntry.tags,
        dependencies: fullEntry.dependencies
      });
    }

    console.log('📝 Added timeline entry:', fullEntry.title);
    return fullEntry;
  }

  private generateEntryId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `impl_${timestamp}_${random}`;
  }

  // Update an existing entry
  updateEntry(id: string, updates: Partial<ImplementationEntry>): boolean {
    const index = this.entries.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.entries[index] = { ...this.entries[index], ...updates };
    this.saveToStorage();
    return true;
  }

  // Get all entries with optional filtering
  getEntries(filter?: TimelineFilter): ImplementationEntry[] {
    let filtered = [...this.entries];

    if (!filter) return filtered;

    if (filter.dateRange) {
      const start = new Date(filter.dateRange.start);
      const end = new Date(filter.dateRange.end);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= start && entryDate <= end;
      });
    }

    if (filter.types?.length) {
      filtered = filtered.filter(entry => filter.types!.includes(entry.type));
    }

    if (filter.authors?.length) {
      filtered = filtered.filter(entry => filter.authors!.includes(entry.author));
    }

    if (filter.status?.length) {
      filtered = filtered.filter(entry => filter.status!.includes(entry.status));
    }

    if (filter.tags?.length) {
      filtered = filtered.filter(entry => 
        filter.tags!.some(tag => entry.tags.includes(tag))
      );
    }

    if (filter.complexity) {
      filtered = filtered.filter(entry =>
        entry.files.some(f => f.complexity === filter.complexity)
      );
    }

    return filtered;
  }

  // Get a specific entry
  getEntry(id: string): ImplementationEntry | undefined {
    return this.entries.find(entry => entry.id === id);
  }

  // Get timeline statistics
  getStats(filter?: TimelineFilter): TimelineStats {
    const entries = this.getEntries(filter);

    const stats: TimelineStats = {
      totalEntries: entries.length,
      completedEntries: entries.filter(e => e.status === 'completed').length,
      totalTimeSpent: entries.reduce((sum, e) => sum + e.timeSpent, 0),
      averageTimePerEntry: 0,
      entriesByType: {
        feature: 0,
        bugfix: 0,
        refactor: 0,
        test: 0,
        config: 0,
        documentation: 0,
        setup: 0
      },
      entriesByStatus: {
        planned: 0,
        in_progress: 0,
        completed: 0,
        deferred: 0,
        cancelled: 0
      },
      impactTrends: {
        codeQuality: { improved: 0, neutral: 0, degraded: 0 },
        performance: { improved: 0, neutral: 0, degraded: 0 },
        maintainability: { improved: 0, neutral: 0, degraded: 0 },
        technicalDebt: { reduced: 0, neutral: 0, increased: 0 }
      },
      velocityTrend: [],
      topChallenges: [],
      learningsCount: entries.reduce((sum, e) => sum + e.learnings.length, 0)
    };

    if (entries.length > 0) {
      stats.averageTimePerEntry = stats.totalTimeSpent / entries.length;
    }

    // Count by type
    entries.forEach(entry => {
      stats.entriesByType[entry.type]++;
      stats.entriesByStatus[entry.status]++;

      // Impact trends
      stats.impactTrends.codeQuality[entry.impact.codeQuality]++;
      stats.impactTrends.performance[entry.impact.performance]++;
      stats.impactTrends.maintainability[entry.impact.maintainability]++;
      stats.impactTrends.technicalDebt[entry.impact.technicalDebt]++;
    });

    // Velocity trend (last 7 days)
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntries = entries.filter(entry => 
        entry.timestamp.startsWith(dateStr) && entry.status === 'completed'
      );
      
      const velocity = dayEntries.reduce((sum, e) => sum + e.metrics.velocityScore, 0) / 
                       Math.max(dayEntries.length, 1);
      
      stats.velocityTrend.push({ date: dateStr, velocity });
    }

    // Top challenges
    const challengeCounts = new Map<string, number>();
    entries.forEach(entry => {
      entry.challenges.forEach(challenge => {
        const count = challengeCounts.get(challenge.category) || 0;
        challengeCounts.set(challenge.category, count + 1);
      });
    });

    stats.topChallenges = Array.from(challengeCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return stats;
  }

  // Get recent implementation activity
  getRecentActivity(days: number = 7): ImplementationEntry[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return this.entries.filter(entry => 
      new Date(entry.timestamp) >= cutoff
    ).slice(0, 20);
  }

  // Get related entries
  getRelatedEntries(entryId: string): ImplementationEntry[] {
    const entry = this.getEntry(entryId);
    if (!entry) return [];

    return this.entries.filter(e => 
      e.id !== entryId && (
        e.relatedEntries.includes(entryId) ||
        entry.relatedEntries.includes(e.id) ||
        e.tags.some(tag => entry.tags.includes(tag)) ||
        e.dependencies.some(dep => entry.dependencies.includes(dep))
      )
    );
  }

  // Search entries
  searchEntries(query: string): ImplementationEntry[] {
    const lowerQuery = query.toLowerCase();
    
    return this.entries.filter(entry =>
      entry.title.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery) ||
      entry.motivation.toLowerCase().includes(lowerQuery) ||
      entry.approach.toLowerCase().includes(lowerQuery) ||
      entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      entry.learnings.some(learning => learning.toLowerCase().includes(lowerQuery))
    );
  }

  // Export timeline data
  exportTimeline(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      entries: this.entries,
      stats: this.getStats()
    }, null, 2);
  }

  // Import timeline data
  importTimeline(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.entries && Array.isArray(parsed.entries)) {
        this.entries = parsed.entries;
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import timeline:', error);
      return false;
    }
  }

  // Generate implementation report
  generateReport(filter?: TimelineFilter): string {
    const entries = this.getEntries(filter);
    const stats = this.getStats(filter);
    
    const report = `# Implementation Timeline Report

Generated: ${new Date().toLocaleString()}
${filter ? `Filter Applied: ${JSON.stringify(filter, null, 2)}` : ''}

## Summary
- **Total Implementations**: ${stats.totalEntries}
- **Completed**: ${stats.completedEntries}
- **Total Time Spent**: ${Math.round(stats.totalTimeSpent / 60)} hours
- **Average Time per Implementation**: ${Math.round(stats.averageTimePerEntry)} minutes
- **Total Learnings Captured**: ${stats.learningsCount}

## Implementation Types
${Object.entries(stats.entriesByType)
  .filter(([_, count]) => count > 0)
  .map(([type, count]) => `- **${type}**: ${count}`)
  .join('\n')}

## Status Distribution
${Object.entries(stats.entriesByStatus)
  .filter(([_, count]) => count > 0)
  .map(([status, count]) => `- **${status}**: ${count}`)
  .join('\n')}

## Impact Assessment
### Code Quality
- Improved: ${stats.impactTrends.codeQuality.improved}
- Neutral: ${stats.impactTrends.codeQuality.neutral}
- Degraded: ${stats.impactTrends.codeQuality.degraded}

### Performance
- Improved: ${stats.impactTrends.performance.improved}
- Neutral: ${stats.impactTrends.performance.neutral}
- Degraded: ${stats.impactTrends.performance.degraded}

### Technical Debt
- Reduced: ${stats.impactTrends.technicalDebt.reduced}
- Neutral: ${stats.impactTrends.technicalDebt.neutral}
- Increased: ${stats.impactTrends.technicalDebt.increased}

## Recent Implementations
${this.getRecentActivity(7)
  .slice(0, 10)
  .map(entry => `- **${entry.title}** (${entry.type}) - ${new Date(entry.timestamp).toLocaleDateString()}`)
  .join('\n')}

## Top Challenges
${stats.topChallenges
  .map(challenge => `- **${challenge.category}**: ${challenge.count} occurrences`)
  .join('\n')}

## Key Learnings
${entries
  .flatMap(e => e.learnings)
  .slice(0, 10)
  .map(learning => `- ${learning}`)
  .join('\n')}

---
*Generated by Synapse Hub Implementation Timeline*
`;

    return report;
  }
}

// Global timeline instance
export const implementationTimeline = ImplementationTimeline.getInstance();

// Svelte stores for reactive updates
export const timelineEntries = writable<ImplementationEntry[]>([]);
export const timelineStats = writable<TimelineStats | null>(null);

// Initialize stores
if (browser) {
  timelineEntries.set(implementationTimeline.getEntries());
  timelineStats.set(implementationTimeline.getStats());

  // Update stores periodically
  setInterval(() => {
    timelineEntries.set(implementationTimeline.getEntries());
    timelineStats.set(implementationTimeline.getStats());
  }, 30000);
}

// Utility functions for easy integration
export const addImplementation = (
  title: string,
  description: string,
  type: ImplementationEntry['type'],
  files: FileChange[],
  options: Partial<Omit<ImplementationEntry, 'id' | 'timestamp' | 'sessionId' | 'title' | 'description' | 'type' | 'files'>> = {}
): ImplementationEntry => {
  return implementationTimeline.addEntry({
    title,
    description,
    type,
    files,
    motivation: options.motivation || 'Implementation requirement',
    approach: options.approach || 'Standard implementation approach',
    dependencies: options.dependencies || [],
    challenges: options.challenges || [],
    learnings: options.learnings || [],
    impact: options.impact || {
      codeQuality: 'neutral',
      performance: 'neutral',
      maintainability: 'neutral',
      testability: 'neutral',
      userExperience: 'not_applicable',
      developerExperience: 'neutral',
      technicalDebt: 'neutral',
      riskLevel: 'low'
    },
    timeSpent: options.timeSpent || 60,
    author: options.author || 'AI Assistant',
    reviewers: options.reviewers || [],
    status: options.status || 'completed',
    tags: options.tags || [],
    relatedEntries: options.relatedEntries || [],
    metrics: options.metrics || {
      linesOfCode: files.reduce((sum, f) => sum + f.linesAdded, 0),
      filesChanged: files.length,
      testsAdded: 0,
      documentationUpdated: false,
      codeReviewComments: 0,
      iterationsRequired: 1,
      blockerCount: 0,
      velocityScore: 7
    }
  });
};

export default implementationTimeline; 
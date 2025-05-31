// Context Loading Optimization System
// Faster session startup with relevant context prioritization

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { sessionManager } from './session-state.js';

export interface ContextFile {
  path: string;
  content?: string;
  size: number;
  lastModified: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'types' | 'components' | 'api' | 'documentation' | 'config' | 'tests';
  dependencies: string[];
  loadTime?: number;
  accessed?: string;
}

export interface ContextLoadingConfig {
  maxConcurrentLoads: number;
  priorityTimeout: number; // ms
  maxMemoryUsage: number; // MB
  cacheExpiry: number; // hours
  progressiveLoading: boolean;
  smartFiltering: boolean;
  phaseAwareLoading: boolean;
}

export interface LoadingProgress {
  total: number;
  loaded: number;
  failed: number;
  progress: number; // 0-100
  currentFile?: string;
  estimatedTimeRemaining: number; // seconds
  loadingSpeed: number; // files per second
}

export interface ContextCache {
  files: Map<string, ContextFile>;
  metadata: {
    lastUpdate: string;
    version: string;
    totalFiles: number;
    totalSize: number;
  };
  performance: {
    averageLoadTime: number;
    cacheHitRate: number;
    totalLoadTime: number;
  };
}

export interface SmartFilter {
  phase: string;
  filePatterns: string[];
  excludePatterns: string[];
  dependencyChains: string[];
  recentActivity: boolean;
  modificationThreshold: number; // hours
}

class ContextLoader {
  private static instance: ContextLoader;
  private cache: ContextCache;
  private config: ContextLoadingConfig;
  private loadingQueue: ContextFile[] = [];
  private isLoading = false;
  private abortController?: AbortController;
  private storageKey = 'synapse-hub-context-cache';
  private configKey = 'synapse-hub-context-config';

  static getInstance(): ContextLoader {
    if (!ContextLoader.instance) {
      ContextLoader.instance = new ContextLoader();
    }
    return ContextLoader.instance;
  }

  constructor() {
    this.config = this.getDefaultConfig();
    this.cache = this.initializeCache();
    
    if (browser) {
      this.loadConfiguration();
      this.loadCache();
    }
  }

  private getDefaultConfig(): ContextLoadingConfig {
    return {
      maxConcurrentLoads: 5,
      priorityTimeout: 2000, // 2 seconds for critical files
      maxMemoryUsage: 512, // 512MB
      cacheExpiry: 24, // 24 hours
      progressiveLoading: true,
      smartFiltering: true,
      phaseAwareLoading: true
    };
  }

  private initializeCache(): ContextCache {
    return {
      files: new Map(),
      metadata: {
        lastUpdate: new Date().toISOString(),
        version: '1.0.0',
        totalFiles: 0,
        totalSize: 0
      },
      performance: {
        averageLoadTime: 0,
        cacheHitRate: 0,
        totalLoadTime: 0
      }
    };
  }

  private loadConfiguration(): void {
    try {
      const saved = localStorage.getItem(this.configKey);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load context configuration:', error);
    }
  }

  private loadCache(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const cached = JSON.parse(saved);
        
        // Check cache expiry
        const cacheAge = Date.now() - new Date(cached.metadata.lastUpdate).getTime();
        const maxAge = this.config.cacheExpiry * 60 * 60 * 1000; // Convert hours to ms
        
        if (cacheAge < maxAge) {
          this.cache = {
            ...cached,
            files: new Map(cached.files)
          };
          console.log(`🚀 Loaded context cache: ${this.cache.files.size} files`);
        } else {
          console.log('⏱️ Context cache expired, will rebuild');
          this.invalidateCache();
        }
      }
    } catch (error) {
      console.warn('Failed to load context cache:', error);
      this.invalidateCache();
    }
  }

  private saveCache(): void {
    try {
      const cacheData = {
        ...this.cache,
        files: Array.from(this.cache.files.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save context cache:', error);
    }
  }

  private saveConfiguration(): void {
    try {
      localStorage.setItem(this.configKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save context configuration:', error);
    }
  }

  // Get smart filter based on current session context
  private getSmartFilter(): SmartFilter {
    const session = sessionManager.getCurrentSession();
    const currentPhase = session?.context.currentPhase || 'Unknown';
    
    // Phase-specific patterns
    const phasePatterns = this.getPhasePatterns(currentPhase);
    
    return {
      phase: currentPhase,
      filePatterns: phasePatterns.include,
      excludePatterns: phasePatterns.exclude,
      dependencyChains: this.getDependencyChains(session?.context.activeFeatures || []),
      recentActivity: true,
      modificationThreshold: 72 // 3 days
    };
  }

  private getPhasePatterns(phase: string): { include: string[]; exclude: string[] } {
    const patterns = {
      'Phase 0': {
        include: ['src/lib/types/**/*.ts', 'src/lib/database/**/*.ts', 'docs/**/*.md'],
        exclude: ['**/*.test.ts', 'node_modules/**']
      },
      'Phase 1': {
        include: ['src/lib/context/**/*.ts', 'templates/**/*.ts', 'docs/**/*.md'],
        exclude: ['**/*.test.ts', 'build/**']
      },
      'Phase 2': {
        include: ['templates/**/*.ts', 'src/lib/templates/**/*.ts', 'scripts/**/*.ts'],
        exclude: ['**/*.test.ts', 'coverage/**']
      },
      'Phase 3': {
        include: ['**/*.test.ts', 'src/lib/testing/**/*.ts', 'scripts/testing/**/*.ts'],
        exclude: ['node_modules/**', 'dist/**']
      },
      'Phase 4': {
        include: ['docker/**/*', '.vscode/**/*', 'scripts/setup/**/*.ts'],
        exclude: ['**/*.log', 'tmp/**']
      },
      'Phase 5': {
        include: ['src/lib/monitoring/**/*.ts', 'scripts/monitoring/**/*.ts'],
        exclude: ['**/*.log', 'coverage/**']
      },
      'Phase 6': {
        include: ['src/lib/session/**/*.ts', '.cursor/**/*', 'docs/**/*.md'],
        exclude: ['**/*.test.ts', 'node_modules/**']
      },
      'Phase 7': {
        include: ['scripts/automation/**/*.ts', 'src/lib/automation/**/*.ts'],
        exclude: ['**/*.test.ts', 'build/**']
      }
    };

    return patterns[phase as keyof typeof patterns] || {
      include: ['src/**/*.ts', 'src/**/*.svelte', '*.md'],
      exclude: ['node_modules/**', 'dist/**', 'build/**']
    };
  }

  private getDependencyChains(activeFeatures: string[]): string[] {
    // Simple dependency mapping - in production this could be more sophisticated
    const dependencies = [];
    
    for (const feature of activeFeatures) {
      dependencies.push(`src/lib/types/${feature}.ts`);
      dependencies.push(`src/components/${feature}/**/*.svelte`);
      dependencies.push(`src/routes/**/${feature}/**/*.ts`);
    }
    
    return dependencies;
  }

  // Prioritize files based on multiple factors
  private prioritizeFiles(files: ContextFile[]): ContextFile[] {
    const session = sessionManager.getCurrentSession();
    const recentFiles = session?.context.openFiles.map(f => f.path) || [];
    const activeFeatures = session?.context.activeFeatures || [];
    
    return files.sort((a, b) => {
      // Priority weights
      const priorityWeight = { critical: 1000, high: 100, medium: 10, low: 1 };
      
      let scoreA = priorityWeight[a.priority];
      let scoreB = priorityWeight[b.priority];
      
      // Boost recently opened files
      if (recentFiles.includes(a.path)) scoreA += 500;
      if (recentFiles.includes(b.path)) scoreB += 500;
      
      // Boost files related to active features
      for (const feature of activeFeatures) {
        if (a.path.includes(feature)) scoreA += 200;
        if (b.path.includes(feature)) scoreB += 200;
      }
      
      // Boost recently modified files
      const aAge = Date.now() - new Date(a.lastModified).getTime();
      const bAge = Date.now() - new Date(b.lastModified).getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      
      if (aAge < dayMs) scoreA += 100;
      if (bAge < dayMs) scoreB += 100;
      if (aAge < dayMs * 7) scoreA += 50;
      if (bAge < dayMs * 7) scoreB += 50;
      
      // Prefer smaller files for faster loading
      if (a.size < 10000) scoreA += 25; // < 10KB
      if (b.size < 10000) scoreB += 25;
      
      return scoreB - scoreA;
    });
  }

  // Discover and categorize files
  async discoverFiles(): Promise<ContextFile[]> {
    const filter = this.getSmartFilter();
    const discoveredFiles: ContextFile[] = [];
    
    // In a real implementation, this would scan the file system
    // For now, we'll use a predefined list based on known project structure
    const knownFiles = this.getKnownProjectFiles();
    
    for (const file of knownFiles) {
      // Apply smart filtering
      if (this.shouldIncludeFile(file.path, filter)) {
        const contextFile: ContextFile = {
          ...file,
          priority: this.calculatePriority(file),
          category: this.categorizeFile(file.path),
          dependencies: this.extractDependencies(file.path),
          accessed: this.cache.files.get(file.path)?.accessed
        };
        
        discoveredFiles.push(contextFile);
      }
    }
    
    return this.prioritizeFiles(discoveredFiles);
  }

  private getKnownProjectFiles(): Partial<ContextFile>[] {
    return [
      // Core types
      { path: 'src/lib/types/index.ts', size: 5000, lastModified: new Date().toISOString() },
      { path: 'src/lib/types/database.ts', size: 8000, lastModified: new Date().toISOString() },
      { path: 'src/lib/types/api.ts', size: 6000, lastModified: new Date().toISOString() },
      
      // Session management
      { path: 'src/lib/session/session-state.ts', size: 15000, lastModified: new Date().toISOString() },
      { path: 'src/lib/session/implementation-timeline.ts', size: 20000, lastModified: new Date().toISOString() },
      { path: 'src/lib/session/decision-log.ts', size: 25000, lastModified: new Date().toISOString() },
      { path: 'src/lib/session/next-steps.ts', size: 18000, lastModified: new Date().toISOString() },
      
      // Monitoring
      { path: 'src/lib/monitoring/logger.ts', size: 12000, lastModified: new Date().toISOString() },
      { path: 'src/lib/monitoring/correlation.ts', size: 8000, lastModified: new Date().toISOString() },
      { path: 'src/lib/monitoring/error-tracking.ts', size: 15000, lastModified: new Date().toISOString() },
      { path: 'src/lib/monitoring/performance.ts', size: 18000, lastModified: new Date().toISOString() },
      
      // Documentation
      { path: 'AI_DEVELOPMENT_OPTIMIZATION_CHECKLIST.md', size: 25000, lastModified: new Date().toISOString() },
      { path: 'ARCHITECTURE_DECISIONS.md', size: 15000, lastModified: new Date().toISOString() },
      { path: 'CODE_PATTERNS.md', size: 20000, lastModified: new Date().toISOString() },
      { path: 'docs/implementation-sequences.md', size: 30000, lastModified: new Date().toISOString() },
      { path: 'docs/atomic-features.md', size: 35000, lastModified: new Date().toISOString() },
      
      // Configuration
      { path: 'package.json', size: 3000, lastModified: new Date().toISOString() },
      { path: 'tsconfig.json', size: 1000, lastModified: new Date().toISOString() },
      { path: 'vite.config.ts', size: 2000, lastModified: new Date().toISOString() },
      { path: '.cursor/settings.json', size: 5000, lastModified: new Date().toISOString() },
      { path: '.cursor/snippets.json', size: 8000, lastModified: new Date().toISOString() }
    ];
  }

  private shouldIncludeFile(path: string, filter: SmartFilter): boolean {
    // Check exclude patterns first
    for (const pattern of filter.excludePatterns) {
      if (this.matchesPattern(path, pattern)) {
        return false;
      }
    }
    
    // Check include patterns
    for (const pattern of filter.filePatterns) {
      if (this.matchesPattern(path, pattern)) {
        return true;
      }
    }
    
    // Check dependency chains
    for (const dependency of filter.dependencyChains) {
      if (this.matchesPattern(path, dependency)) {
        return true;
      }
    }
    
    return false;
  }

  private matchesPattern(path: string, pattern: string): boolean {
    // Simple glob-like pattern matching
    const regex = pattern
      .replace(/\*\*/g, '.*') // ** matches any path
      .replace(/\*/g, '[^/]*') // * matches any filename
      .replace(/\?/g, '.'); // ? matches single character
    
    return new RegExp(`^${regex}$`).test(path);
  }

  private calculatePriority(file: Partial<ContextFile>): 'critical' | 'high' | 'medium' | 'low' {
    const path = file.path!;
    
    // Critical files
    if (path.includes('src/lib/types/') || 
        path.includes('src/lib/session/') ||
        path === 'AI_DEVELOPMENT_OPTIMIZATION_CHECKLIST.md') {
      return 'critical';
    }
    
    // High priority files
    if (path.includes('src/lib/monitoring/') ||
        path.includes('src/components/') ||
        path.includes('.cursor/') ||
        path.endsWith('.md')) {
      return 'high';
    }
    
    // Medium priority files
    if (path.includes('src/routes/') ||
        path.includes('docs/') ||
        path.includes('scripts/')) {
      return 'medium';
    }
    
    // Low priority files
    return 'low';
  }

  private categorizeFile(path: string): ContextFile['category'] {
    if (path.includes('/types/') || path.endsWith('.d.ts')) return 'types';
    if (path.includes('/components/') || path.endsWith('.svelte')) return 'components';
    if (path.includes('/api/') || path.includes('routes/')) return 'api';
    if (path.endsWith('.md') || path.includes('docs/')) return 'documentation';
    if (path.includes('test') || path.endsWith('.test.ts')) return 'tests';
    return 'config';
  }

  private extractDependencies(path: string): string[] {
    // In a real implementation, this would parse the file for imports
    // For now, return common dependencies based on file type
    const dependencies = [];
    
    if (path.endsWith('.svelte')) {
      dependencies.push('src/lib/types/index.ts');
      dependencies.push('src/lib/monitoring/correlation.ts');
    }
    
    if (path.includes('/api/')) {
      dependencies.push('src/lib/types/api.ts');
      dependencies.push('src/lib/monitoring/logger.ts');
    }
    
    if (path.includes('/session/')) {
      dependencies.push('src/lib/types/index.ts');
    }
    
    return dependencies;
  }

  // Load context with progress tracking
  async loadContext(options: {
    maxFiles?: number;
    progressCallback?: (progress: LoadingProgress) => void;
    signal?: AbortSignal;
  } = {}): Promise<ContextFile[]> {
    const startTime = Date.now();
    this.isLoading = true;
    this.abortController = new AbortController();
    
    try {
      // Discover files to load
      const allFiles = await this.discoverFiles();
      const filesToLoad = options.maxFiles ? allFiles.slice(0, options.maxFiles) : allFiles;
      
      const progress: LoadingProgress = {
        total: filesToLoad.length,
        loaded: 0,
        failed: 0,
        progress: 0,
        estimatedTimeRemaining: 0,
        loadingSpeed: 0
      };
      
      const loadedFiles: ContextFile[] = [];
      const loadPromises: Promise<void>[] = [];
      
      // Load files in batches based on priority
      const criticalFiles = filesToLoad.filter(f => f.priority === 'critical');
      const highFiles = filesToLoad.filter(f => f.priority === 'high');
      const mediumFiles = filesToLoad.filter(f => f.priority === 'medium');
      const lowFiles = filesToLoad.filter(f => f.priority === 'low');
      
      // Load critical files first
      await this.loadFileBatch(criticalFiles, progress, loadedFiles, options.progressCallback);
      
      // Load high priority files
      await this.loadFileBatch(highFiles, progress, loadedFiles, options.progressCallback);
      
      // Load medium and low priority files if time permits
      if (this.config.progressiveLoading) {
        await this.loadFileBatch([...mediumFiles, ...lowFiles], progress, loadedFiles, options.progressCallback);
      }
      
      // Update cache
      for (const file of loadedFiles) {
        this.cache.files.set(file.path, file);
      }
      
      // Update cache metadata
      this.cache.metadata = {
        lastUpdate: new Date().toISOString(),
        version: '1.0.0',
        totalFiles: this.cache.files.size,
        totalSize: Array.from(this.cache.files.values()).reduce((sum, f) => sum + f.size, 0)
      };
      
      // Update performance metrics
      const totalLoadTime = Date.now() - startTime;
      this.cache.performance = {
        averageLoadTime: totalLoadTime / loadedFiles.length,
        cacheHitRate: this.calculateCacheHitRate(loadedFiles),
        totalLoadTime
      };
      
      this.saveCache();
      
      console.log(`🚀 Context loaded: ${loadedFiles.length} files in ${totalLoadTime}ms`);
      
      return loadedFiles;
      
    } catch (error) {
      console.error('Failed to load context:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private async loadFileBatch(
    files: ContextFile[],
    progress: LoadingProgress,
    loadedFiles: ContextFile[],
    progressCallback?: (progress: LoadingProgress) => void
  ): Promise<void> {
    const batchSize = Math.min(this.config.maxConcurrentLoads, files.length);
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const loadPromises = batch.map(file => this.loadFile(file));
      
      const results = await Promise.allSettled(loadPromises);
      
      results.forEach((result, index) => {
        const file = batch[index];
        progress.currentFile = file.path;
        
        if (result.status === 'fulfilled') {
          const loadedFile = result.value;
          loadedFiles.push(loadedFile);
          progress.loaded++;
        } else {
          console.warn(`Failed to load file: ${file.path}`, result.reason);
          progress.failed++;
        }
        
        progress.progress = ((progress.loaded + progress.failed) / progress.total) * 100;
        progress.loadingSpeed = progress.loaded / ((Date.now() - Date.now()) / 1000 || 1);
        progress.estimatedTimeRemaining = (progress.total - progress.loaded - progress.failed) / progress.loadingSpeed;
        
        if (progressCallback) {
          progressCallback(progress);
        }
      });
    }
  }

  private async loadFile(file: ContextFile): Promise<ContextFile> {
    const startTime = Date.now();
    
    // Check cache first
    const cached = this.cache.files.get(file.path);
    if (cached && cached.content) {
      cached.accessed = new Date().toISOString();
      cached.loadTime = Date.now() - startTime;
      return cached;
    }
    
    // Simulate file loading (in real implementation, this would read from filesystem)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100)); // Simulate load time
    
    const loadedFile: ContextFile = {
      ...file,
      content: `// Simulated content for ${file.path}`,
      loadTime: Date.now() - startTime,
      accessed: new Date().toISOString()
    };
    
    return loadedFile;
  }

  private calculateCacheHitRate(loadedFiles: ContextFile[]): number {
    const cacheHits = loadedFiles.filter(f => this.cache.files.has(f.path)).length;
    return loadedFiles.length > 0 ? (cacheHits / loadedFiles.length) * 100 : 0;
  }

  // Get optimized context for current session
  async getOptimizedContext(): Promise<ContextFile[]> {
    const session = sessionManager.getCurrentSession();
    
    if (!session) {
      return this.loadContext({ maxFiles: 20 });
    }
    
    // Determine optimal context based on session state
    const contextSize = this.calculateOptimalContextSize(session);
    
    return this.loadContext({
      maxFiles: contextSize,
      progressCallback: (progress) => {
        contextLoadingProgress.set(progress);
      }
    });
  }

  private calculateOptimalContextSize(session: any): number {
    const baseSize = 50;
    const activeFeatures = session.context.activeFeatures.length;
    const recentActions = session.context.recentActions.length;
    
    // Adjust based on activity level
    let size = baseSize + (activeFeatures * 5) + Math.min(recentActions, 20);
    
    // Limit based on memory constraints
    const maxSize = Math.floor(this.config.maxMemoryUsage / 2); // Rough estimate
    
    return Math.min(size, maxSize);
  }

  // Configuration management
  updateConfig(updates: Partial<ContextLoadingConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfiguration();
  }

  getConfig(): ContextLoadingConfig {
    return { ...this.config };
  }

  // Cache management
  invalidateCache(): void {
    this.cache = this.initializeCache();
    if (browser) {
      localStorage.removeItem(this.storageKey);
    }
  }

  getCacheStats(): {
    totalFiles: number;
    totalSize: number;
    hitRate: number;
    lastUpdate: string;
  } {
    return {
      totalFiles: this.cache.metadata.totalFiles,
      totalSize: this.cache.metadata.totalSize,
      hitRate: this.cache.performance.cacheHitRate,
      lastUpdate: this.cache.metadata.lastUpdate
    };
  }

  // Preload context for faster startup
  async preloadContext(): Promise<void> {
    if (this.isLoading) return;
    
    try {
      await this.loadContext({ maxFiles: 30 });
      console.log('🚀 Context preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload context:', error);
    }
  }

  // Generate context report
  generateReport(): string {
    const stats = this.getCacheStats();
    const config = this.getConfig();
    
    return `# Context Loading Report

Generated: ${new Date().toLocaleString()}

## Configuration
- **Max Concurrent Loads**: ${config.maxConcurrentLoads}
- **Priority Timeout**: ${config.priorityTimeout}ms
- **Max Memory Usage**: ${config.maxMemoryUsage}MB
- **Cache Expiry**: ${config.cacheExpiry} hours
- **Progressive Loading**: ${config.progressiveLoading ? 'Enabled' : 'Disabled'}
- **Smart Filtering**: ${config.smartFiltering ? 'Enabled' : 'Disabled'}
- **Phase Aware Loading**: ${config.phaseAwareLoading ? 'Enabled' : 'Disabled'}

## Cache Statistics
- **Total Files**: ${stats.totalFiles}
- **Total Size**: ${(stats.totalSize / 1024).toFixed(1)}KB
- **Cache Hit Rate**: ${stats.hitRate.toFixed(1)}%
- **Last Update**: ${new Date(stats.lastUpdate).toLocaleString()}

## Performance Metrics
- **Average Load Time**: ${this.cache.performance.averageLoadTime.toFixed(1)}ms
- **Total Load Time**: ${this.cache.performance.totalLoadTime}ms

## Recent Files
${Array.from(this.cache.files.values())
  .filter(f => f.accessed)
  .sort((a, b) => new Date(b.accessed!).getTime() - new Date(a.accessed!).getTime())
  .slice(0, 10)
  .map(f => `- **${f.path}** (${f.category}) - ${new Date(f.accessed!).toLocaleString()}`)
  .join('\n')}

---
*Generated by Synapse Hub Context Loader*
`;
  }
}

// Global context loader instance
export const contextLoader = ContextLoader.getInstance();

// Svelte stores for reactive updates
export const contextLoadingProgress = writable<LoadingProgress | null>(null);
export const contextFiles = writable<ContextFile[]>([]);
export const contextConfig = writable<ContextLoadingConfig>(contextLoader.getConfig());

// Derived stores
export const criticalFiles = derived(contextFiles, $files => 
  $files.filter(f => f.priority === 'critical')
);

export const isContextLoading = derived(contextLoadingProgress, $progress => 
  $progress !== null && $progress.progress < 100
);

// Initialize context loading
if (browser) {
  // Start context preloading
  contextLoader.preloadContext();
  
  // Update stores periodically
  setInterval(() => {
    contextFiles.set(Array.from(contextLoader.getCacheStats().totalFiles > 0 ? 
      contextLoader['cache'].files.values() : []));
    contextConfig.set(contextLoader.getConfig());
  }, 30000);
}

// Utility functions for easy integration
export const loadOptimizedContext = async () => {
  return contextLoader.getOptimizedContext();
};

export const updateContextConfig = (updates: Partial<ContextLoadingConfig>) => {
  contextLoader.updateConfig(updates);
  contextConfig.set(contextLoader.getConfig());
};

export const invalidateContextCache = () => {
  contextLoader.invalidateCache();
  contextFiles.set([]);
};

export const getContextStats = () => {
  return contextLoader.getCacheStats();
};

export default contextLoader; 
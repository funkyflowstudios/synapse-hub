#!/usr/bin/env node

/**
 * Plugin Architecture Foundation
 * 
 * Provides an extensible system for future AI agents and automation plugins.
 * Part of Phase 7: Advanced Automation & Future-Proofing
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { execSync } from 'child_process';
import { EventEmitter } from 'events';

interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  type: 'automation' | 'ai-agent' | 'validation' | 'monitoring' | 'integration';
  category: string;
  tags: string[];
  dependencies: string[];
  aiCapabilities?: {
    contextAware: boolean;
    learningEnabled: boolean;
    interactiveMode: boolean;
    batchProcessing: boolean;
  };
  configuration: {
    schema: Record<string, any>;
    defaults: Record<string, any>;
  };
  hooks: string[];
  entryPoint: string;
  createdAt: Date;
  enabled: boolean;
}

interface PluginContext {
  project: {
    root: string;
    name: string;
    version: string;
  };
  environment: string;
  config: Record<string, any>;
  utils: {
    logger: any;
    fileSystem: any;
    process: any;
  };
  events: EventEmitter;
}

interface Plugin {
  metadata: PluginMetadata;
  initialize?(context: PluginContext): Promise<void>;
  execute?(args: any): Promise<any>;
  cleanup?(): Promise<void>;
  onHook?(hookName: string, data: any): Promise<any>;
}

interface PluginRegistry {
  [name: string]: {
    metadata: PluginMetadata;
    instance?: Plugin;
    loaded: boolean;
    lastUsed: Date;
  };
}

class PluginArchitecture extends EventEmitter {
  private pluginsDir: string;
  private registry: PluginRegistry = {};
  private context: PluginContext;
  private hooks: Map<string, Set<string>> = new Map();

  constructor() {
    super();
    
    this.pluginsDir = join(process.cwd(), 'plugins');
    this.context = this.createPluginContext();
    
    this.ensureDirectories();
    this.setupBuiltinHooks();
  }

  /**
   * Initialize plugin architecture
   */
  async initialize(): Promise<void> {
    console.log('🔌 Initializing Plugin Architecture...');
    
    // Create plugin templates
    await this.createPluginTemplates();
    
    // Load existing plugins
    await this.loadAllPlugins();
    
    // Setup plugin discovery
    await this.setupPluginDiscovery();
    
    console.log('✅ Plugin Architecture initialized');
  }

  /**
   * Create plugin templates
   */
  private async createPluginTemplates(): Promise<void> {
    const templatesDir = join(this.pluginsDir, 'templates');
    if (!existsSync(templatesDir)) {
      mkdirSync(templatesDir, { recursive: true });
    }

    const templates = {
      'automation-plugin.template.ts': `// Automation Plugin Template
import { Plugin, PluginContext } from '../plugin-architecture';

export class AutomationPlugin implements Plugin {
  public metadata = {
    name: 'sample-automation',
    version: '1.0.0',
    description: 'Sample automation plugin',
    author: 'Synapse Hub',
    type: 'automation' as const,
    category: 'development',
    tags: ['automation', 'development'],
    dependencies: [],
    configuration: {
      schema: {
        enabled: { type: 'boolean', default: true },
        interval: { type: 'number', default: 60000 }
      },
      defaults: {
        enabled: true,
        interval: 60000
      }
    },
    hooks: ['before:build', 'after:test'],
    entryPoint: 'index.ts',
    createdAt: new Date(),
    enabled: true
  };

  private context?: PluginContext;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    console.log(\`🔌 Initializing \${this.metadata.name} plugin\`);
    
    // Setup plugin-specific initialization
    context.events.on('plugin:execute', this.handleExecution.bind(this));
  }

  async execute(args: any): Promise<any> {
    console.log(\`🔌 Executing \${this.metadata.name} with args:\`, args);
    
    // Implement your automation logic here
    return { success: true, message: 'Automation completed' };
  }

  async onHook(hookName: string, data: any): Promise<any> {
    console.log(\`🪝 Hook \${hookName} triggered for \${this.metadata.name}\`);
    
    switch (hookName) {
      case 'before:build':
        // Handle pre-build automation
        break;
      case 'after:test':
        // Handle post-test automation
        break;
    }
  }

  private async handleExecution(data: any): Promise<void> {
    if (data.target === this.metadata.name) {
      await this.execute(data.args);
    }
  }

  async cleanup(): Promise<void> {
    console.log(\`🧹 Cleaning up \${this.metadata.name} plugin\`);
    this.context?.events.removeAllListeners('plugin:execute');
  }
}`,

      'ai-agent-plugin.template.ts': `// AI Agent Plugin Template
import { Plugin, PluginContext } from '../plugin-architecture';

export class AIAgentPlugin implements Plugin {
  public metadata = {
    name: 'sample-ai-agent',
    version: '1.0.0',
    description: 'Sample AI agent plugin',
    author: 'Synapse Hub',
    type: 'ai-agent' as const,
    category: 'artificial-intelligence',
    tags: ['ai', 'agent', 'automation'],
    dependencies: [],
    aiCapabilities: {
      contextAware: true,
      learningEnabled: true,
      interactiveMode: true,
      batchProcessing: true
    },
    configuration: {
      schema: {
        model: { type: 'string', default: 'gpt-4' },
        temperature: { type: 'number', default: 0.7 },
        maxTokens: { type: 'number', default: 1000 }
      },
      defaults: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      }
    },
    hooks: ['ai:request', 'ai:response', 'context:update'],
    entryPoint: 'index.ts',
    createdAt: new Date(),
    enabled: true
  };

  private context?: PluginContext;
  private knowledgeBase: Map<string, any> = new Map();

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    console.log(\`🤖 Initializing \${this.metadata.name} AI agent\`);
    
    // Setup AI-specific initialization
    context.events.on('ai:query', this.handleAIQuery.bind(this));
    context.events.on('context:update', this.updateKnowledge.bind(this));
  }

  async execute(args: any): Promise<any> {
    console.log(\`🤖 AI Agent \${this.metadata.name} processing request:\`, args);
    
    // Implement AI agent logic here
    const response = await this.processAIRequest(args);
    
    return {
      success: true,
      response,
      confidence: 0.9,
      reasoning: 'AI agent processing completed'
    };
  }

  private async processAIRequest(request: any): Promise<any> {
    // Simulate AI processing
    const contextualInfo = this.knowledgeBase.get(request.topic) || {};
    
    return {
      answer: \`AI-generated response for: \${request.query}\`,
      context: contextualInfo,
      suggestions: ['Consider option A', 'Explore alternative B']
    };
  }

  private async handleAIQuery(data: any): Promise<void> {
    if (data.agent === this.metadata.name) {
      const result = await this.execute(data);
      this.context?.events.emit('ai:response', { 
        agent: this.metadata.name, 
        result 
      });
    }
  }

  private async updateKnowledge(data: any): Promise<void> {
    // Update knowledge base with new context
    this.knowledgeBase.set(data.key, data.value);
    console.log(\`🧠 Knowledge updated for \${this.metadata.name}\`);
  }

  async onHook(hookName: string, data: any): Promise<any> {
    console.log(\`🪝 AI Hook \${hookName} triggered for \${this.metadata.name}\`);
    
    switch (hookName) {
      case 'ai:request':
        return await this.processAIRequest(data);
      case 'ai:response':
        // Process AI response
        break;
      case 'context:update':
        await this.updateKnowledge(data);
        break;
    }
  }

  async cleanup(): Promise<void> {
    console.log(\`🧹 Cleaning up \${this.metadata.name} AI agent\`);
    this.context?.events.removeAllListeners('ai:query');
    this.context?.events.removeAllListeners('context:update');
    this.knowledgeBase.clear();
  }
}`,

      'monitoring-plugin.template.ts': `// Monitoring Plugin Template
import { Plugin, PluginContext } from '../plugin-architecture';

export class MonitoringPlugin implements Plugin {
  public metadata = {
    name: 'sample-monitoring',
    version: '1.0.0',
    description: 'Sample monitoring plugin',
    author: 'Synapse Hub',
    type: 'monitoring' as const,
    category: 'observability',
    tags: ['monitoring', 'metrics', 'alerting'],
    dependencies: [],
    configuration: {
      schema: {
        interval: { type: 'number', default: 30000 },
        alertThreshold: { type: 'number', default: 80 }
      },
      defaults: {
        interval: 30000,
        alertThreshold: 80
      }
    },
    hooks: ['metrics:collect', 'alert:trigger'],
    entryPoint: 'index.ts',
    createdAt: new Date(),
    enabled: true
  };

  private context?: PluginContext;
  private monitoringInterval?: NodeJS.Timeout;

  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    console.log(\`📊 Initializing \${this.metadata.name} monitoring plugin\`);
    
    // Start monitoring
    this.startMonitoring();
  }

  async execute(args: any): Promise<any> {
    console.log(\`📊 Monitoring \${this.metadata.name} collecting metrics\`);
    
    const metrics = await this.collectMetrics();
    await this.processMetrics(metrics);
    
    return { success: true, metrics };
  }

  private startMonitoring(): void {
    const config = this.context?.config || this.metadata.configuration.defaults;
    
    this.monitoringInterval = setInterval(async () => {
      await this.execute({});
    }, config.interval);
  }

  private async collectMetrics(): Promise<any> {
    // Implement metric collection logic
    return {
      timestamp: new Date().toISOString(),
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100
    };
  }

  private async processMetrics(metrics: any): Promise<void> {
    const threshold = this.context?.config?.alertThreshold || 80;
    
    // Check for alerts
    if (metrics.cpu > threshold || metrics.memory > threshold) {
      this.context?.events.emit('alert:trigger', {
        plugin: this.metadata.name,
        type: 'resource_usage',
        metrics,
        severity: 'warning'
      });
    }
  }

  async onHook(hookName: string, data: any): Promise<any> {
    switch (hookName) {
      case 'metrics:collect':
        return await this.collectMetrics();
      case 'alert:trigger':
        console.log(\`🚨 Alert triggered: \${JSON.stringify(data)}\`);
        break;
    }
  }

  async cleanup(): Promise<void> {
    console.log(\`🧹 Cleaning up \${this.metadata.name} monitoring plugin\`);
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}`
    };

    for (const [filename, content] of Object.entries(templates)) {
      const templatePath = join(templatesDir, filename);
      if (!existsSync(templatePath)) {
        writeFileSync(templatePath, content);
        console.log(`📝 Created plugin template: ${filename}`);
      }
    }
  }

  /**
   * Load all plugins from the plugins directory
   */
  async loadAllPlugins(): Promise<void> {
    if (!existsSync(this.pluginsDir)) {
      return;
    }

    const pluginDirs = readdirSync(this.pluginsDir)
      .filter(dir => {
        const fullPath = join(this.pluginsDir, dir);
        return statSync(fullPath).isDirectory() && 
               dir !== 'templates' &&
               existsSync(join(fullPath, 'package.json'));
      });

    for (const dir of pluginDirs) {
      try {
        await this.loadPlugin(dir);
      } catch (error) {
        console.warn(`⚠️  Failed to load plugin ${dir}:`, error.message);
      }
    }

    console.log(`📦 Loaded ${Object.keys(this.registry).length} plugins`);
  }

  /**
   * Load a specific plugin
   */
  async loadPlugin(pluginName: string): Promise<void> {
    const pluginDir = join(this.pluginsDir, pluginName);
    const packageJsonPath = join(pluginDir, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      throw new Error(`Plugin package.json not found: ${pluginName}`);
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const pluginMetadata: PluginMetadata = {
      name: packageJson.name || pluginName,
      version: packageJson.version || '1.0.0',
      description: packageJson.description || 'Plugin description',
      author: packageJson.author || 'Unknown',
      type: packageJson.pluginType || 'automation',
      category: packageJson.category || 'general',
      tags: packageJson.tags || [],
      dependencies: packageJson.dependencies ? Object.keys(packageJson.dependencies) : [],
      aiCapabilities: packageJson.aiCapabilities,
      configuration: packageJson.configuration || { schema: {}, defaults: {} },
      hooks: packageJson.hooks || [],
      entryPoint: packageJson.main || 'index.ts',
      createdAt: new Date(packageJson.createdAt || Date.now()),
      enabled: packageJson.enabled !== false
    };

    // Load plugin instance if enabled
    let pluginInstance: Plugin | undefined;
    if (pluginMetadata.enabled) {
      try {
        const entryPath = join(pluginDir, pluginMetadata.entryPoint);
        if (existsSync(entryPath)) {
          const PluginClass = await import(entryPath);
          pluginInstance = new PluginClass.default();
          
          // Initialize plugin
          await pluginInstance.initialize?.(this.context);
          
          // Register hooks
          this.registerPluginHooks(pluginMetadata.name, pluginMetadata.hooks);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to instantiate plugin ${pluginName}:`, error.message);
      }
    }

    this.registry[pluginMetadata.name] = {
      metadata: pluginMetadata,
      instance: pluginInstance,
      loaded: !!pluginInstance,
      lastUsed: new Date()
    };

    console.log(`✅ Loaded plugin: ${pluginMetadata.name} v${pluginMetadata.version}`);
  }

  /**
   * Execute a plugin
   */
  async executePlugin(pluginName: string, args: any = {}): Promise<any> {
    const plugin = this.registry[pluginName];
    
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    if (!plugin.loaded || !plugin.instance) {
      throw new Error(`Plugin not loaded: ${pluginName}`);
    }

    if (!plugin.metadata.enabled) {
      throw new Error(`Plugin disabled: ${pluginName}`);
    }

    try {
      plugin.lastUsed = new Date();
      const result = await plugin.instance.execute?.(args);
      
      this.emit('plugin:executed', {
        plugin: pluginName,
        args,
        result,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      this.emit('plugin:error', {
        plugin: pluginName,
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Trigger a hook
   */
  async triggerHook(hookName: string, data: any = {}): Promise<any[]> {
    const pluginNames = this.hooks.get(hookName) || new Set();
    const results: any[] = [];

    for (const pluginName of pluginNames) {
      const plugin = this.registry[pluginName];
      
      if (plugin?.loaded && plugin.instance && plugin.metadata.enabled) {
        try {
          const result = await plugin.instance.onHook?.(hookName, data);
          results.push({
            plugin: pluginName,
            result,
            success: true
          });
        } catch (error) {
          results.push({
            plugin: pluginName,
            error: error.message,
            success: false
          });
        }
      }
    }

    this.emit('hook:triggered', {
      hook: hookName,
      data,
      results,
      timestamp: new Date()
    });

    return results;
  }

  /**
   * Create a new plugin from template
   */
  async createPlugin(
    name: string,
    type: PluginMetadata['type'],
    options: {
      description?: string;
      author?: string;
      category?: string;
      tags?: string[];
    } = {}
  ): Promise<string> {
    const pluginDir = join(this.pluginsDir, name);
    
    if (existsSync(pluginDir)) {
      throw new Error(`Plugin directory already exists: ${name}`);
    }

    mkdirSync(pluginDir, { recursive: true });

    // Create package.json
    const packageJson = {
      name,
      version: '1.0.0',
      description: options.description || `${type} plugin`,
      author: options.author || 'Synapse Hub',
      pluginType: type,
      category: options.category || 'general',
      tags: options.tags || [type],
      main: 'index.ts',
      configuration: {
        schema: {},
        defaults: {}
      },
      hooks: [],
      enabled: true,
      createdAt: new Date().toISOString()
    };

    writeFileSync(
      join(pluginDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Copy template
    const templateFile = join(this.pluginsDir, 'templates', `${type}-plugin.template.ts`);
    if (existsSync(templateFile)) {
      const template = readFileSync(templateFile, 'utf8');
      const pluginCode = template
        .replace(/sample-\w+/g, name)
        .replace(/Sample \w+ Plugin/g, `${name} Plugin`);
      
      writeFileSync(join(pluginDir, 'index.ts'), pluginCode);
    }

    // Create README
    const readme = `# ${name}

${options.description || `${type} plugin for Synapse Hub`}

## Configuration

\`\`\`json
{
  "enabled": true
}
\`\`\`

## Usage

\`\`\`bash
npm run plugin:execute ${name}
\`\`\`
`;

    writeFileSync(join(pluginDir, 'README.md'), readme);

    console.log(`✅ Created plugin: ${name}`);
    console.log(`📁 Plugin directory: ${pluginDir}`);
    console.log(`📝 Edit the plugin files to implement your functionality`);

    return pluginDir;
  }

  /**
   * List all plugins
   */
  listPlugins(filterBy?: { type?: string; enabled?: boolean }): PluginMetadata[] {
    return Object.values(this.registry)
      .map(p => p.metadata)
      .filter(metadata => {
        if (filterBy?.type && metadata.type !== filterBy.type) return false;
        if (filterBy?.enabled !== undefined && metadata.enabled !== filterBy.enabled) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Enable/disable a plugin
   */
  async togglePlugin(pluginName: string, enabled: boolean): Promise<void> {
    const plugin = this.registry[pluginName];
    
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    plugin.metadata.enabled = enabled;

    // Update package.json
    const pluginDir = join(this.pluginsDir, pluginName);
    const packageJsonPath = join(pluginDir, 'package.json');
    
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      packageJson.enabled = enabled;
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    if (enabled && !plugin.loaded) {
      // Reload plugin
      await this.loadPlugin(pluginName);
    } else if (!enabled && plugin.loaded) {
      // Cleanup plugin
      await plugin.instance?.cleanup?.();
      plugin.instance = undefined;
      plugin.loaded = false;
    }

    console.log(`${enabled ? '✅ Enabled' : '❌ Disabled'} plugin: ${pluginName}`);
  }

  /**
   * Get plugin status and metrics
   */
  getPluginStatus(): any {
    const stats = {
      total: Object.keys(this.registry).length,
      enabled: 0,
      loaded: 0,
      byType: {} as Record<string, number>,
      recentlyUsed: [] as string[]
    };

    const recentThreshold = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    for (const [name, plugin] of Object.entries(this.registry)) {
      if (plugin.metadata.enabled) stats.enabled++;
      if (plugin.loaded) stats.loaded++;
      
      const type = plugin.metadata.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      if (plugin.lastUsed.getTime() > recentThreshold) {
        stats.recentlyUsed.push(name);
      }
    }

    return stats;
  }

  /**
   * Setup plugin discovery
   */
  private async setupPluginDiscovery(): Promise<void> {
    // Watch for new plugins in the plugins directory
    // This is a simplified version - in production you might use fs.watch
    console.log('🔍 Plugin discovery system ready');
  }

  /**
   * Register plugin hooks
   */
  private registerPluginHooks(pluginName: string, hooks: string[]): void {
    for (const hookName of hooks) {
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, new Set());
      }
      this.hooks.get(hookName)!.add(pluginName);
    }
  }

  /**
   * Setup builtin hooks
   */
  private setupBuiltinHooks(): void {
    const builtinHooks = [
      'before:build',
      'after:build',
      'before:test',
      'after:test',
      'before:deploy',
      'after:deploy',
      'ai:request',
      'ai:response',
      'context:update',
      'metrics:collect',
      'alert:trigger',
      'plugin:loaded',
      'plugin:executed',
      'plugin:error'
    ];

    builtinHooks.forEach(hook => {
      this.hooks.set(hook, new Set());
    });
  }

  /**
   * Create plugin context
   */
  private createPluginContext(): PluginContext {
    return {
      project: {
        root: process.cwd(),
        name: 'synapse-hub',
        version: '0.0.1'
      },
      environment: process.env.NODE_ENV || 'development',
      config: {},
      utils: {
        logger: console,
        fileSystem: { readFileSync, writeFileSync, existsSync },
        process: { execSync }
      },
      events: this
    };
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    if (!existsSync(this.pluginsDir)) {
      mkdirSync(this.pluginsDir, { recursive: true });
    }
  }
}

// CLI Interface
if (require.main === module) {
  const architecture = new PluginArchitecture();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      architecture.initialize().catch(error => {
        console.error('Initialization failed:', error);
        process.exit(1);
      });
      break;
    
    case 'create':
      const name = args[1];
      const type = args[2] as PluginMetadata['type'];
      const description = args.slice(3).join(' ');
      
      if (!name || !type) {
        console.error('Usage: create <name> <type> [description]');
        console.error('Types: automation, ai-agent, validation, monitoring, integration');
        process.exit(1);
      }
      
      architecture.createPlugin(name, type, { description }).catch(error => {
        console.error('Plugin creation failed:', error);
        process.exit(1);
      });
      break;
    
    case 'list':
      architecture.initialize().then(() => {
        const plugins = architecture.listPlugins();
        console.log(`📦 Available plugins (${plugins.length}):`);
        plugins.forEach(plugin => {
          const status = plugin.enabled ? '✅' : '❌';
          console.log(`  ${status} ${plugin.name} v${plugin.version} (${plugin.type})`);
          console.log(`    ${plugin.description}`);
        });
      }).catch(error => {
        console.error('Plugin listing failed:', error);
        process.exit(1);
      });
      break;
    
    case 'execute':
      const pluginName = args[1];
      if (!pluginName) {
        console.error('Usage: execute <plugin-name> [args...]');
        process.exit(1);
      }
      
      architecture.initialize().then(async () => {
        const pluginArgs = args.slice(2);
        const result = await architecture.executePlugin(pluginName, { args: pluginArgs });
        console.log('Plugin result:', result);
      }).catch(error => {
        console.error('Plugin execution failed:', error);
        process.exit(1);
      });
      break;
    
    case 'enable':
    case 'disable':
      const targetPlugin = args[1];
      if (!targetPlugin) {
        console.error(`Usage: ${command} <plugin-name>`);
        process.exit(1);
      }
      
      architecture.initialize().then(async () => {
        await architecture.togglePlugin(targetPlugin, command === 'enable');
      }).catch(error => {
        console.error(`Plugin ${command} failed:`, error);
        process.exit(1);
      });
      break;
    
    case 'status':
      architecture.initialize().then(() => {
        const status = architecture.getPluginStatus();
        console.log('📊 Plugin Status:');
        console.log(`  Total: ${status.total}`);
        console.log(`  Enabled: ${status.enabled}`);
        console.log(`  Loaded: ${status.loaded}`);
        console.log('  By Type:');
        Object.entries(status.byType).forEach(([type, count]) => {
          console.log(`    ${type}: ${count}`);
        });
        if (status.recentlyUsed.length > 0) {
          console.log(`  Recently Used: ${status.recentlyUsed.join(', ')}`);
        }
      }).catch(error => {
        console.error('Status check failed:', error);
        process.exit(1);
      });
      break;
    
    case 'hook':
      const hookName = args[1];
      if (!hookName) {
        console.error('Usage: hook <hook-name> [data]');
        process.exit(1);
      }
      
      architecture.initialize().then(async () => {
        const data = args[2] ? JSON.parse(args[2]) : {};
        const results = await architecture.triggerHook(hookName, data);
        console.log('Hook results:', results);
      }).catch(error => {
        console.error('Hook execution failed:', error);
        process.exit(1);
      });
      break;
    
    default:
      console.log(`
🔌 Plugin Architecture Foundation

Usage:
  tsx scripts/plugin-architecture.ts <command> [options]

Commands:
  init                              - Initialize plugin architecture
  create <name> <type> [desc]       - Create new plugin
  list                              - List all plugins
  execute <plugin> [args...]        - Execute a plugin
  enable <plugin>                   - Enable a plugin
  disable <plugin>                  - Disable a plugin
  status                            - Show plugin status
  hook <hook-name> [data]           - Trigger a hook

Plugin Types:
  automation                        - Automation plugins
  ai-agent                          - AI agent plugins
  validation                        - Validation plugins
  monitoring                        - Monitoring plugins
  integration                       - Integration plugins

Examples:
  tsx scripts/plugin-architecture.ts init
  tsx scripts/plugin-architecture.ts create my-automation automation "Custom automation plugin"
  tsx scripts/plugin-architecture.ts list
  tsx scripts/plugin-architecture.ts execute my-automation
  tsx scripts/plugin-architecture.ts hook before:build '{"environment":"production"}'
      `);
  }
}

export { 
  PluginArchitecture, 
  Plugin, 
  PluginMetadata, 
  PluginContext, 
  PluginRegistry 
}; 
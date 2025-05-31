#!/usr/bin/env node

/**
 * Documentation Generation System
 * 
 * Provides automated generation of API and component documentation.
 * Part of Phase 7: Advanced Automation & Future-Proofing
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname, basename } from 'path';

interface DocumentationConfig {
  sources: {
    api: string[];
    components: string[];
    types: string[];
    stories: string[];
  };
  output: {
    directory: string;
    formats: ('html' | 'markdown' | 'json')[];
  };
  generation: {
    includePrivate: boolean;
    includeExamples: boolean;
    includeTests: boolean;
    groupByCategory: boolean;
  };
  customization: {
    title: string;
    logo?: string;
    theme: string;
    customCss?: string;
  };
}

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responses: Array<{
    status: number;
    description: string;
    schema?: any;
  }>;
  examples: Array<{
    name: string;
    request: any;
    response: any;
  }>;
}

interface Component {
  name: string;
  description: string;
  filePath: string;
  props: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: any;
    description: string;
  }>;
  events: Array<{
    name: string;
    description: string;
    payload?: any;
  }>;
  slots: Array<{
    name: string;
    description: string;
    props?: any;
  }>;
  examples: Array<{
    name: string;
    code: string;
    description: string;
  }>;
}

class DocumentationGenerator {
  private docsDir: string;
  private configPath: string;
  private outputDir: string;

  constructor() {
    this.docsDir = join(process.cwd(), 'docs-generation');
    this.configPath = join(this.docsDir, 'docs-config.json');
    this.outputDir = join(this.docsDir, 'output');
    
    this.ensureDirectories();
  }

  /**
   * Initialize documentation generation system
   */
  async initialize(): Promise<void> {
    console.log('📚 Initializing Documentation Generation...');
    
    // Create default configuration
    await this.createDefaultConfiguration();
    
    // Setup documentation tools
    await this.setupDocumentationTools();
    
    console.log('✅ Documentation Generation initialized');
  }

  /**
   * Create default configuration
   */
  private async createDefaultConfiguration(): Promise<void> {
    if (existsSync(this.configPath)) {
      return;
    }

    const defaultConfig: DocumentationConfig = {
      sources: {
        api: ['src/routes/api/**/*.ts'],
        components: ['src/lib/components/**/*.svelte', 'src/components/**/*.svelte'],
        types: ['src/lib/types/**/*.ts'],
        stories: ['src/stories/**/*.stories.ts']
      },
      output: {
        directory: 'docs',
        formats: ['html', 'markdown']
      },
      generation: {
        includePrivate: false,
        includeExamples: true,
        includeTests: false,
        groupByCategory: true
      },
      customization: {
        title: 'Synapse Hub Documentation',
        theme: 'default',
        logo: 'static/logo.svg'
      }
    };

    writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('📋 Created default documentation configuration');
  }

  /**
   * Setup documentation tools
   */
  private async setupDocumentationTools(): Promise<void> {
    console.log('🛠️  Setting up documentation tools...');
    
    const tools = [
      { name: 'TypeDoc', check: 'npx typedoc --version', install: 'npm install -D typedoc' },
      { name: 'JSDoc', check: 'npx jsdoc --version', install: 'npm install -D jsdoc' }
    ];

    for (const tool of tools) {
      try {
        execSync(tool.check, { stdio: 'pipe' });
        console.log(`  ✅ ${tool.name} available`);
      } catch {
        console.log(`  🔧 Installing ${tool.name}...`);
        try {
          execSync(tool.install, { stdio: 'pipe' });
          console.log(`  ✅ ${tool.name} installed`);
        } catch (error) {
          console.warn(`  ⚠️  Failed to install ${tool.name}:`, error.message);
        }
      }
    }
  }

  /**
   * Generate comprehensive documentation
   */
  async generateDocumentation(): Promise<void> {
    console.log('📚 Generating documentation...');
    
    const config = this.getConfiguration();
    
    // Extract and document APIs
    const apis = await this.extractAPIDocumentation(config.sources.api);
    
    // Extract and document components
    const components = await this.extractComponentDocumentation(config.sources.components);
    
    // Extract type definitions
    const types = await this.extractTypeDocumentation(config.sources.types);
    
    // Generate documentation in requested formats
    for (const format of config.output.formats) {
      switch (format) {
        case 'html':
          await this.generateHTMLDocumentation(apis, components, types, config);
          break;
        case 'markdown':
          await this.generateMarkdownDocumentation(apis, components, types, config);
          break;
        case 'json':
          await this.generateJSONDocumentation(apis, components, types, config);
          break;
      }
    }
    
    console.log('✅ Documentation generation completed');
  }

  /**
   * Extract API documentation from source files
   */
  private async extractAPIDocumentation(patterns: string[]): Promise<APIEndpoint[]> {
    console.log('  🔍 Extracting API documentation...');
    
    const apis: APIEndpoint[] = [];
    const files = this.findFiles(patterns);
    
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const extractedApis = this.parseAPIFile(content, file);
        apis.push(...extractedApis);
      } catch (error) {
        console.warn(`    ⚠️  Failed to parse ${file}:`, error.message);
      }
    }
    
    console.log(`    📋 Found ${apis.length} API endpoints`);
    return apis;
  }

  /**
   * Extract component documentation
   */
  private async extractComponentDocumentation(patterns: string[]): Promise<Component[]> {
    console.log('  🧩 Extracting component documentation...');
    
    const components: Component[] = [];
    const files = this.findFiles(patterns);
    
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const component = this.parseSvelteComponent(content, file);
        if (component) {
          components.push(component);
        }
      } catch (error) {
        console.warn(`    ⚠️  Failed to parse ${file}:`, error.message);
      }
    }
    
    console.log(`    🧩 Found ${components.length} components`);
    return components;
  }

  /**
   * Extract type documentation using TypeDoc
   */
  private async extractTypeDocumentation(patterns: string[]): Promise<any[]> {
    console.log('  📝 Extracting type documentation...');
    
    try {
      const tempConfigPath = join(this.docsDir, 'typedoc.json');
      const typedocConfig = {
        entryPoints: patterns,
        out: join(this.docsDir, 'temp-types'),
        json: join(this.docsDir, 'types.json'),
        excludePrivate: true,
        excludeInternal: true
      };
      
      writeFileSync(tempConfigPath, JSON.stringify(typedocConfig, null, 2));
      
      execSync(`npx typedoc --options ${tempConfigPath}`, { stdio: 'pipe' });
      
      const typesJson = join(this.docsDir, 'types.json');
      if (existsSync(typesJson)) {
        const types = JSON.parse(readFileSync(typesJson, 'utf8'));
        console.log(`    📝 Extracted type definitions`);
        return types.children || [];
      }
    } catch (error) {
      console.warn(`    ⚠️  TypeDoc extraction failed:`, error.message);
    }
    
    return [];
  }

  /**
   * Parse API file for documentation
   */
  private parseAPIFile(content: string, filePath: string): APIEndpoint[] {
    const apis: APIEndpoint[] = [];
    
    // Extract route handlers (simplified parser)
    const routePattern = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)/g;
    const docPattern = /\/\*\*\s*([\s\S]*?)\s*\*\//g;
    
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      const method = match[1];
      const startPos = match.index;
      
      // Look for JSDoc comment before the function
      const beforeFunction = content.substring(Math.max(0, startPos - 500), startPos);
      const docMatch = beforeFunction.match(/\/\*\*\s*([\s\S]*?)\s*\*\/\s*$/);
      
      if (docMatch) {
        const docText = docMatch[1];
        const api = this.parseJSDocForAPI(docText, method, filePath);
        if (api) {
          apis.push(api);
        }
      }
    }
    
    return apis;
  }

  /**
   * Parse JSDoc comment for API information
   */
  private parseJSDocForAPI(docText: string, method: string, filePath: string): APIEndpoint | null {
    const lines = docText.split('\n').map(line => line.replace(/^\s*\*\s?/, ''));
    
    let description = '';
    const parameters: any[] = [];
    const responses: any[] = [];
    
    for (const line of lines) {
      if (line.startsWith('@param')) {
        const paramMatch = line.match(/@param\s+\{([^}]+)\}\s+(\w+)\s+(.+)/);
        if (paramMatch) {
          parameters.push({
            name: paramMatch[2],
            type: paramMatch[1],
            required: !paramMatch[1].includes('?'),
            description: paramMatch[3]
          });
        }
      } else if (line.startsWith('@returns') || line.startsWith('@response')) {
        const responseMatch = line.match(/@(?:returns|response)\s+\{([^}]+)\}\s+(.+)/);
        if (responseMatch) {
          responses.push({
            status: 200,
            description: responseMatch[2],
            schema: responseMatch[1]
          });
        }
      } else if (!line.startsWith('@') && line.trim()) {
        description += line + ' ';
      }
    }
    
    // Extract path from file path
    const pathMatch = filePath.match(/routes\/api(.+)\/\+server\.ts$/);
    const path = pathMatch ? pathMatch[1] : '/unknown';
    
    return {
      method,
      path,
      description: description.trim(),
      parameters,
      responses,
      examples: []
    };
  }

  /**
   * Parse Svelte component for documentation
   */
  private parseSvelteComponent(content: string, filePath: string): Component | null {
    const componentName = basename(filePath, '.svelte');
    
    // Extract script section
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (!scriptMatch) return null;
    
    const scriptContent = scriptMatch[1];
    
    // Extract props using export let pattern
    const props: any[] = [];
    const propPattern = /export\s+let\s+(\w+)(?:\s*:\s*([^=\n;]+))?(?:\s*=\s*([^;\n]+))?/g;
    
    let propMatch;
    while ((propMatch = propPattern.exec(scriptContent)) !== null) {
      props.push({
        name: propMatch[1],
        type: propMatch[2]?.trim() || 'any',
        required: !propMatch[3], // Has default value
        default: propMatch[3]?.trim(),
        description: '' // Would need JSDoc parsing
      });
    }
    
    // Extract events (simplified)
    const events: any[] = [];
    const eventPattern = /createEventDispatcher<\{([^}]+)\}>/;
    const eventMatch = scriptContent.match(eventPattern);
    
    if (eventMatch) {
      const eventTypes = eventMatch[1];
      // Parse event types (simplified)
      const eventNames = eventTypes.split(',').map(e => e.split(':')[0].trim());
      eventNames.forEach(name => {
        if (name) {
          events.push({
            name,
            description: `${name} event`,
            payload: 'any'
          });
        }
      });
    }
    
    // Extract slots (simplified)
    const slots: any[] = [];
    const slotPattern = /<slot(?:\s+name="([^"]+)")?/g;
    
    let slotMatch;
    while ((slotMatch = slotPattern.exec(content)) !== null) {
      slots.push({
        name: slotMatch[1] || 'default',
        description: `${slotMatch[1] || 'Default'} slot`,
        props: {}
      });
    }
    
    return {
      name: componentName,
      description: `${componentName} component`,
      filePath,
      props,
      events,
      slots,
      examples: []
    };
  }

  /**
   * Generate HTML documentation
   */
  private async generateHTMLDocumentation(
    apis: APIEndpoint[],
    components: Component[],
    types: any[],
    config: DocumentationConfig
  ): Promise<void> {
    console.log('  📄 Generating HTML documentation...');
    
    const htmlDir = join(this.outputDir, 'html');
    mkdirSync(htmlDir, { recursive: true });
    
    // Generate index page
    const indexHtml = this.generateIndexHTML(apis, components, types, config);
    writeFileSync(join(htmlDir, 'index.html'), indexHtml);
    
    // Generate API documentation
    if (apis.length > 0) {
      const apiHtml = this.generateAPIHTML(apis, config);
      writeFileSync(join(htmlDir, 'api.html'), apiHtml);
    }
    
    // Generate component documentation
    if (components.length > 0) {
      const componentsHtml = this.generateComponentsHTML(components, config);
      writeFileSync(join(htmlDir, 'components.html'), componentsHtml);
    }
    
    // Copy assets
    await this.copyDocumentationAssets(htmlDir);
    
    console.log(`    📄 HTML documentation generated at ${htmlDir}`);
  }

  /**
   * Generate index HTML page
   */
  private generateIndexHTML(
    apis: APIEndpoint[],
    components: Component[],
    types: any[],
    config: DocumentationConfig
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.customization.title}</title>
    <link rel="stylesheet" href="assets/docs.css">
</head>
<body>
    <div class="container">
        <header class="docs-header">
            ${config.customization.logo ? `<img src="${config.customization.logo}" alt="Logo" class="logo">` : ''}
            <h1>${config.customization.title}</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </header>
        
        <nav class="docs-nav">
            <ul>
                <li><a href="#overview">Overview</a></li>
                ${apis.length > 0 ? '<li><a href="api.html">API Reference</a></li>' : ''}
                ${components.length > 0 ? '<li><a href="components.html">Components</a></li>' : ''}
            </ul>
        </nav>
        
        <main class="docs-content">
            <section id="overview">
                <h2>Overview</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>${apis.length}</h3>
                        <p>API Endpoints</p>
                    </div>
                    <div class="stat-card">
                        <h3>${components.length}</h3>
                        <p>Components</p>
                    </div>
                    <div class="stat-card">
                        <h3>${types.length}</h3>
                        <p>Type Definitions</p>
                    </div>
                </div>
            </section>
            
            ${apis.length > 0 ? `
            <section id="quick-api">
                <h2>Quick API Reference</h2>
                <div class="api-quick-list">
                    ${apis.slice(0, 5).map(api => `
                        <div class="api-item">
                            <span class="method method-${api.method.toLowerCase()}">${api.method}</span>
                            <span class="path">${api.path}</span>
                            <span class="description">${api.description}</span>
                        </div>
                    `).join('')}
                </div>
                <a href="api.html" class="view-all">View All API Endpoints →</a>
            </section>
            ` : ''}
            
            ${components.length > 0 ? `
            <section id="quick-components">
                <h2>Components Overview</h2>
                <div class="components-grid">
                    ${components.slice(0, 6).map(component => `
                        <div class="component-card">
                            <h3>${component.name}</h3>
                            <p>${component.description}</p>
                            <div class="component-meta">
                                <span>${component.props.length} props</span>
                                <span>${component.events.length} events</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <a href="components.html" class="view-all">View All Components →</a>
            </section>
            ` : ''}
        </main>
    </div>
</body>
</html>`;
  }

  /**
   * Generate API HTML documentation
   */
  private generateAPIHTML(apis: APIEndpoint[], config: DocumentationConfig): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Reference - ${config.customization.title}</title>
    <link rel="stylesheet" href="assets/docs.css">
</head>
<body>
    <div class="container">
        <header class="docs-header">
            <a href="index.html">← Back to Overview</a>
            <h1>API Reference</h1>
        </header>
        
        <main class="docs-content">
            ${apis.map(api => `
                <div class="api-endpoint" id="${api.method.toLowerCase()}-${api.path.replace(/\//g, '-')}">
                    <div class="endpoint-header">
                        <span class="method method-${api.method.toLowerCase()}">${api.method}</span>
                        <span class="path">${api.path}</span>
                    </div>
                    
                    <div class="endpoint-content">
                        <p class="description">${api.description}</p>
                        
                        ${api.parameters.length > 0 ? `
                        <div class="parameters">
                            <h4>Parameters</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Required</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${api.parameters.map(param => `
                                        <tr>
                                            <td><code>${param.name}</code></td>
                                            <td>${param.type}</td>
                                            <td>${param.required ? 'Yes' : 'No'}</td>
                                            <td>${param.description}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        ` : ''}
                        
                        ${api.responses.length > 0 ? `
                        <div class="responses">
                            <h4>Responses</h4>
                            ${api.responses.map(response => `
                                <div class="response">
                                    <span class="status-code">${response.status}</span>
                                    <span class="description">${response.description}</span>
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </main>
    </div>
</body>
</html>`;
  }

  /**
   * Generate Components HTML documentation
   */
  private generateComponentsHTML(components: Component[], config: DocumentationConfig): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Components - ${config.customization.title}</title>
    <link rel="stylesheet" href="assets/docs.css">
</head>
<body>
    <div class="container">
        <header class="docs-header">
            <a href="index.html">← Back to Overview</a>
            <h1>Components</h1>
        </header>
        
        <main class="docs-content">
            ${components.map(component => `
                <div class="component" id="${component.name.toLowerCase()}">
                    <div class="component-header">
                        <h2>${component.name}</h2>
                        <code class="file-path">${component.filePath}</code>
                    </div>
                    
                    <div class="component-content">
                        <p class="description">${component.description}</p>
                        
                        ${component.props.length > 0 ? `
                        <div class="props">
                            <h4>Props</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Required</th>
                                        <th>Default</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${component.props.map(prop => `
                                        <tr>
                                            <td><code>${prop.name}</code></td>
                                            <td>${prop.type}</td>
                                            <td>${prop.required ? 'Yes' : 'No'}</td>
                                            <td>${prop.default || '-'}</td>
                                            <td>${prop.description || '-'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        ` : ''}
                        
                        ${component.events.length > 0 ? `
                        <div class="events">
                            <h4>Events</h4>
                            <ul>
                                ${component.events.map(event => `
                                    <li>
                                        <code>${event.name}</code> - ${event.description}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        ` : ''}
                        
                        ${component.slots.length > 0 ? `
                        <div class="slots">
                            <h4>Slots</h4>
                            <ul>
                                ${component.slots.map(slot => `
                                    <li>
                                        <code>${slot.name}</code> - ${slot.description}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </main>
    </div>
</body>
</html>`;
  }

  /**
   * Generate Markdown documentation
   */
  private async generateMarkdownDocumentation(
    apis: APIEndpoint[],
    components: Component[],
    types: any[],
    config: DocumentationConfig
  ): Promise<void> {
    console.log('  📝 Generating Markdown documentation...');
    
    const mdDir = join(this.outputDir, 'markdown');
    mkdirSync(mdDir, { recursive: true });
    
    // Generate README
    const readme = this.generateReadmeMD(apis, components, types, config);
    writeFileSync(join(mdDir, 'README.md'), readme);
    
    // Generate API documentation
    if (apis.length > 0) {
      const apiMd = this.generateAPIMD(apis);
      writeFileSync(join(mdDir, 'API.md'), apiMd);
    }
    
    // Generate component documentation
    if (components.length > 0) {
      const componentsMd = this.generateComponentsMD(components);
      writeFileSync(join(mdDir, 'COMPONENTS.md'), componentsMd);
    }
    
    console.log(`    📝 Markdown documentation generated at ${mdDir}`);
  }

  /**
   * Generate README markdown
   */
  private generateReadmeMD(
    apis: APIEndpoint[],
    components: Component[],
    types: any[],
    config: DocumentationConfig
  ): string {
    return `# ${config.customization.title}

Generated documentation for the Synapse Hub project.

## Overview

- **API Endpoints**: ${apis.length}
- **Components**: ${components.length}  
- **Type Definitions**: ${types.length}

## Documentation

${apis.length > 0 ? '- [API Reference](API.md)' : ''}
${components.length > 0 ? '- [Components](COMPONENTS.md)' : ''}

---

*Generated on ${new Date().toLocaleString()}*
`;
  }

  /**
   * Generate API markdown
   */
  private generateAPIMD(apis: APIEndpoint[]): string {
    return `# API Reference

${apis.map(api => `
## ${api.method} ${api.path}

${api.description}

${api.parameters.length > 0 ? `
### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
${api.parameters.map(p => `| \`${p.name}\` | ${p.type} | ${p.required ? 'Yes' : 'No'} | ${p.description} |`).join('\n')}
` : ''}

${api.responses.length > 0 ? `
### Responses

${api.responses.map(r => `- **${r.status}**: ${r.description}`).join('\n')}
` : ''}
`).join('\n---\n')}
`;
  }

  /**
   * Generate Components markdown
   */
  private generateComponentsMD(components: Component[]): string {
    return `# Components

${components.map(component => `
## ${component.name}

${component.description}

**File**: \`${component.filePath}\`

${component.props.length > 0 ? `
### Props

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
${component.props.map(p => `| \`${p.name}\` | ${p.type} | ${p.required ? 'Yes' : 'No'} | ${p.default || '-'} | ${p.description || '-'} |`).join('\n')}
` : ''}

${component.events.length > 0 ? `
### Events

${component.events.map(e => `- **${e.name}**: ${e.description}`).join('\n')}
` : ''}

${component.slots.length > 0 ? `
### Slots

${component.slots.map(s => `- **${s.name}**: ${s.description}`).join('\n')}
` : ''}
`).join('\n---\n')}
`;
  }

  /**
   * Generate JSON documentation
   */
  private async generateJSONDocumentation(
    apis: APIEndpoint[],
    components: Component[],
    types: any[],
    config: DocumentationConfig
  ): Promise<void> {
    console.log('  📋 Generating JSON documentation...');
    
    const jsonDir = join(this.outputDir, 'json');
    mkdirSync(jsonDir, { recursive: true });
    
    const documentation = {
      meta: {
        title: config.customization.title,
        generated: new Date().toISOString(),
        version: '1.0.0'
      },
      apis,
      components,
      types
    };
    
    writeFileSync(join(jsonDir, 'documentation.json'), JSON.stringify(documentation, null, 2));
    console.log(`    📋 JSON documentation generated at ${jsonDir}`);
  }

  /**
   * Copy documentation assets
   */
  private async copyDocumentationAssets(htmlDir: string): Promise<void> {
    const assetsDir = join(htmlDir, 'assets');
    mkdirSync(assetsDir, { recursive: true });
    
    // Generate CSS
    const css = `
/* Documentation Styles */
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; line-height: 1.6; color: #333; }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.docs-header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
.docs-nav ul { list-style: none; padding: 0; display: flex; gap: 20px; justify-content: center; }
.docs-nav a { text-decoration: none; color: #0066cc; padding: 10px 15px; border-radius: 5px; }
.docs-nav a:hover { background: #f0f8ff; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
.stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
.method { padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; font-size: 0.8em; }
.method-get { background: #28a745; }
.method-post { background: #007bff; }
.method-put { background: #ffc107; color: #000; }
.method-delete { background: #dc3545; }
.api-endpoint, .component { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
.endpoint-header, .component-header { margin-bottom: 15px; }
table { width: 100%; border-collapse: collapse; margin: 15px 0; }
th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
th { background: #f8f9fa; }
code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; font-family: 'Monaco', monospace; }
.file-path { font-size: 0.9em; color: #666; }
`;
    
    writeFileSync(join(assetsDir, 'docs.css'), css);
  }

  /**
   * Find files matching glob patterns
   */
  private findFiles(patterns: string[]): string[] {
    const files: string[] = [];
    
    for (const pattern of patterns) {
      try {
        // Simple glob implementation - would use a proper glob library in production
        const directory = pattern.split('/**')[0];
        const extension = pattern.split('.').pop();
        
        if (existsSync(directory)) {
          const found = this.findFilesRecursive(directory, extension);
          files.push(...found);
        }
      } catch (error) {
        console.warn(`Failed to find files for pattern ${pattern}:`, error.message);
      }
    }
    
    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Recursively find files with specific extension
   */
  private findFilesRecursive(dir: string, extension?: string): string[] {
    const files: string[] = [];
    
    try {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.findFilesRecursive(fullPath, extension));
        } else if (!extension || fullPath.endsWith(`.${extension}`)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory not accessible, skip
    }
    
    return files;
  }

  /**
   * Get configuration
   */
  private getConfiguration(): DocumentationConfig {
    if (!existsSync(this.configPath)) {
      throw new Error('Documentation configuration not found. Run init first.');
    }
    
    return JSON.parse(readFileSync(this.configPath, 'utf8'));
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    [this.docsDir, this.outputDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }
}

// CLI Interface
if (require.main === module) {
  const generator = new DocumentationGenerator();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      generator.initialize().catch(error => {
        console.error('Initialization failed:', error);
        process.exit(1);
      });
      break;
    
    case 'generate':
      generator.generateDocumentation().catch(error => {
        console.error('Documentation generation failed:', error);
        process.exit(1);
      });
      break;
    
    default:
      console.log(`
📚 Documentation Generation System

Usage:
  tsx scripts/documentation-generation.ts <command>

Commands:
  init                              - Initialize documentation system
  generate                          - Generate comprehensive documentation

Output Formats:
  - HTML (with navigation and styling)
  - Markdown (for README and wikis)
  - JSON (for programmatic access)

Examples:
  tsx scripts/documentation-generation.ts init
  tsx scripts/documentation-generation.ts generate
      `);
  }
}

export { DocumentationGenerator, DocumentationConfig, APIEndpoint, Component }; 
#!/usr/bin/env node

/**
 * Configuration Management System
 * 
 * Provides environment-specific configuration management with validation and safe deployment.
 * Part of Phase 7: Advanced Automation & Future-Proofing
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    default?: any;
    validation?: {
      pattern?: string;
      min?: number;
      max?: number;
      enum?: any[];
    };
    description: string;
    sensitive?: boolean;
  };
}

interface Environment {
  name: string;
  description: string;
  baseUrl?: string;
  variables: Record<string, any>;
  secrets: Record<string, string>;
  features: Record<string, boolean>;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

class ConfigurationManager {
  private configDir: string;
  private envDir: string;
  private schemaPath: string;
  private secretsPath: string;

  constructor() {
    this.configDir = join(process.cwd(), 'config');
    this.envDir = join(this.configDir, 'environments');
    this.schemaPath = join(this.configDir, 'schema.json');
    this.secretsPath = join(this.configDir, '.secrets');
    
    this.ensureDirectories();
  }

  /**
   * Initialize configuration management system
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing Configuration Management System...');
    
    // Create default schema if it doesn't exist
    if (!existsSync(this.schemaPath)) {
      await this.createDefaultSchema();
    }
    
    // Create default environments
    await this.createDefaultEnvironments();
    
    // Setup secrets management
    await this.setupSecretsManagement();
    
    console.log('✅ Configuration Management System initialized');
  }

  /**
   * Create default configuration schema
   */
  private async createDefaultSchema(): Promise<void> {
    const defaultSchema: ConfigSchema = {
      // Application Configuration
      'app.name': {
        type: 'string',
        required: true,
        default: 'synapse-hub',
        description: 'Application name',
        validation: { pattern: '^[a-z-]+$' }
      },
      'app.version': {
        type: 'string',
        required: true,
        description: 'Application version'
      },
      'app.environment': {
        type: 'string',
        required: true,
        validation: { enum: ['development', 'staging', 'production'] },
        description: 'Current environment'
      },
      'app.debug': {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Enable debug mode'
      },
      
      // Server Configuration
      'server.host': {
        type: 'string',
        required: true,
        default: 'localhost',
        description: 'Server host'
      },
      'server.port': {
        type: 'number',
        required: true,
        default: 3000,
        validation: { min: 1000, max: 65535 },
        description: 'Server port'
      },
      'server.cors.enabled': {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Enable CORS'
      },
      'server.cors.origins': {
        type: 'array',
        required: false,
        default: ['http://localhost:5173'],
        description: 'Allowed CORS origins'
      },
      
      // Database Configuration
      'database.url': {
        type: 'string',
        required: true,
        description: 'Database connection URL',
        sensitive: true
      },
      'database.pool.min': {
        type: 'number',
        required: false,
        default: 2,
        validation: { min: 1 },
        description: 'Minimum database connections'
      },
      'database.pool.max': {
        type: 'number',
        required: false,
        default: 10,
        validation: { min: 1, max: 100 },
        description: 'Maximum database connections'
      },
      
      // Security Configuration
      'security.jwt.secret': {
        type: 'string',
        required: true,
        description: 'JWT signing secret',
        sensitive: true
      },
      'security.jwt.expiresIn': {
        type: 'string',
        required: false,
        default: '24h',
        description: 'JWT expiration time'
      },
      'security.encryption.key': {
        type: 'string',
        required: true,
        description: 'Encryption key for sensitive data',
        sensitive: true
      },
      
      // External Services
      'monitoring.enabled': {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Enable monitoring'
      },
      'monitoring.endpoint': {
        type: 'string',
        required: false,
        description: 'Monitoring service endpoint'
      },
      'logging.level': {
        type: 'string',
        required: false,
        default: 'info',
        validation: { enum: ['debug', 'info', 'warn', 'error'] },
        description: 'Logging level'
      },
      
      // Feature Flags
      'features.realTimeUpdates': {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Enable real-time updates via WebSocket'
      },
      'features.advancedMetrics': {
        type: 'boolean',
        required: false,
        default: false,
        description: 'Enable advanced metrics collection'
      }
    };

    writeFileSync(this.schemaPath, JSON.stringify(defaultSchema, null, 2));
    console.log('📋 Created default configuration schema');
  }

  /**
   * Create default environment configurations
   */
  private async createDefaultEnvironments(): Promise<void> {
    const environments: Environment[] = [
      {
        name: 'development',
        description: 'Local development environment',
        baseUrl: 'http://localhost:3000',
        variables: {
          'app.environment': 'development',
          'app.debug': true,
          'server.host': 'localhost',
          'server.port': 3000,
          'database.url': 'file:./local.db',
          'logging.level': 'debug',
          'features.realTimeUpdates': true,
          'features.advancedMetrics': true
        },
        secrets: {
          'security.jwt.secret': 'dev-jwt-secret-change-in-production',
          'security.encryption.key': 'dev-encryption-key-32-characters!'
        },
        features: {
          hotReload: true,
          debugPanel: true,
          mockServices: true
        }
      },
      {
        name: 'staging',
        description: 'Staging environment for testing',
        baseUrl: 'https://staging.synapse-hub.com',
        variables: {
          'app.environment': 'staging',
          'app.debug': false,
          'server.host': '0.0.0.0',
          'server.port': 3000,
          'logging.level': 'info',
          'monitoring.enabled': true,
          'features.realTimeUpdates': true,
          'features.advancedMetrics': true
        },
        secrets: {
          'database.url': '${DATABASE_URL}',
          'security.jwt.secret': '${JWT_SECRET}',
          'security.encryption.key': '${ENCRYPTION_KEY}',
          'monitoring.endpoint': '${MONITORING_ENDPOINT}'
        },
        features: {
          hotReload: false,
          debugPanel: false,
          mockServices: false
        }
      },
      {
        name: 'production',
        description: 'Production environment',
        baseUrl: 'https://synapse-hub.com',
        variables: {
          'app.environment': 'production',
          'app.debug': false,
          'server.host': '0.0.0.0',
          'server.port': 3000,
          'logging.level': 'warn',
          'monitoring.enabled': true,
          'features.realTimeUpdates': true,
          'features.advancedMetrics': false
        },
        secrets: {
          'database.url': '${DATABASE_URL}',
          'security.jwt.secret': '${JWT_SECRET}',
          'security.encryption.key': '${ENCRYPTION_KEY}',
          'monitoring.endpoint': '${MONITORING_ENDPOINT}'
        },
        features: {
          hotReload: false,
          debugPanel: false,
          mockServices: false
        }
      }
    ];

    for (const env of environments) {
      const envPath = join(this.envDir, `${env.name}.json`);
      if (!existsSync(envPath)) {
        writeFileSync(envPath, JSON.stringify(env, null, 2));
        console.log(`📝 Created ${env.name} environment configuration`);
      }
    }
  }

  /**
   * Setup secrets management
   */
  private async setupSecretsManagement(): Promise<void> {
    if (!existsSync(this.secretsPath)) {
      mkdirSync(this.secretsPath, { recursive: true });
    }

    // Create .gitignore for secrets
    const gitignorePath = join(this.secretsPath, '.gitignore');
    if (!existsSync(gitignorePath)) {
      writeFileSync(gitignorePath, '*\n!.gitignore\n');
    }

    // Create secrets template
    const secretsTemplate = {
      development: {
        'security.jwt.secret': 'dev-jwt-secret-change-in-production',
        'security.encryption.key': 'dev-encryption-key-32-characters!'
      },
      staging: {
        'database.url': 'postgresql://user:pass@staging-db:5432/synapse_hub',
        'security.jwt.secret': 'staging-jwt-secret-very-secure',
        'security.encryption.key': 'staging-encryption-32-chars-key!',
        'monitoring.endpoint': 'https://monitoring.staging.com'
      },
      production: {
        'database.url': 'postgresql://user:pass@prod-db:5432/synapse_hub',
        'security.jwt.secret': 'production-jwt-secret-very-secure',
        'security.encryption.key': 'production-encryption-32-chars!',
        'monitoring.endpoint': 'https://monitoring.production.com'
      }
    };

    const templatePath = join(this.secretsPath, 'secrets.template.json');
    if (!existsSync(templatePath)) {
      writeFileSync(templatePath, JSON.stringify(secretsTemplate, null, 2));
      console.log('🔐 Created secrets template');
    }
  }

  /**
   * Validate configuration against schema
   */
  async validateConfiguration(environment: string): Promise<ConfigValidationResult> {
    console.log(`🔍 Validating ${environment} configuration...`);
    
    const result: ConfigValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Load schema
      const schema: ConfigSchema = JSON.parse(readFileSync(this.schemaPath, 'utf8'));
      
      // Load environment configuration
      const envPath = join(this.envDir, `${environment}.json`);
      if (!existsSync(envPath)) {
        result.valid = false;
        result.errors.push(`Environment configuration not found: ${environment}`);
        return result;
      }

      const envConfig: Environment = JSON.parse(readFileSync(envPath, 'utf8'));
      const config = { ...envConfig.variables, ...envConfig.secrets };

      // Validate each schema field
      for (const [key, schemaField] of Object.entries(schema)) {
        const value = this.getNestedValue(config, key);
        
        // Check required fields
        if (schemaField.required && (value === undefined || value === null)) {
          if (schemaField.default !== undefined) {
            result.warnings.push(`Using default value for required field: ${key}`);
          } else {
            result.valid = false;
            result.errors.push(`Required field missing: ${key}`);
          }
          continue;
        }

        // Skip validation if value is undefined and not required
        if (value === undefined && !schemaField.required) {
          continue;
        }

        // Type validation
        if (!this.validateType(value, schemaField.type)) {
          result.valid = false;
          result.errors.push(`Invalid type for ${key}: expected ${schemaField.type}, got ${typeof value}`);
          continue;
        }

        // Additional validations
        if (schemaField.validation) {
          const validationErrors = this.validateField(key, value, schemaField.validation);
          result.errors.push(...validationErrors);
          if (validationErrors.length > 0) {
            result.valid = false;
          }
        }
      }

      // Check for unknown fields
      this.checkUnknownFields(config, schema, result);

    } catch (error) {
      result.valid = false;
      result.errors.push(`Configuration validation failed: ${error.message}`);
    }

    if (result.valid) {
      console.log('✅ Configuration validation passed');
    } else {
      console.log('❌ Configuration validation failed');
      result.errors.forEach(error => console.log(`  • ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log('⚠️  Configuration warnings:');
      result.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    return result;
  }

  /**
   * Generate environment configuration file
   */
  async generateEnvironmentConfig(environment: string, outputPath?: string): Promise<void> {
    console.log(`🏗️  Generating ${environment} configuration...`);

    const envPath = join(this.envDir, `${environment}.json`);
    if (!existsSync(envPath)) {
      throw new Error(`Environment configuration not found: ${environment}`);
    }

    const envConfig: Environment = JSON.parse(readFileSync(envPath, 'utf8'));
    const schema: ConfigSchema = JSON.parse(readFileSync(this.schemaPath, 'utf8'));

    // Merge configuration with defaults
    const config: Record<string, any> = {};
    
    for (const [key, schemaField] of Object.entries(schema)) {
      const value = this.getNestedValue(envConfig.variables, key) || 
                   this.getNestedValue(envConfig.secrets, key) ||
                   schemaField.default;
      
      if (value !== undefined) {
        this.setNestedValue(config, key, value);
      }
    }

    // Generate different output formats
    const outputs = {
      json: JSON.stringify(config, null, 2),
      env: this.generateEnvFormat(config),
      docker: this.generateDockerFormat(config),
      yaml: this.generateYamlFormat(config)
    };

    const baseOutputPath = outputPath || join(this.configDir, 'generated', environment);
    mkdirSync(dirname(baseOutputPath), { recursive: true });

    for (const [format, content] of Object.entries(outputs)) {
      const filePath = `${baseOutputPath}.${format}`;
      writeFileSync(filePath, content);
      console.log(`📄 Generated ${format.toUpperCase()} config: ${filePath}`);
    }
  }

  /**
   * Deploy configuration to environment
   */
  async deployConfiguration(environment: string, dryRun: boolean = false): Promise<void> {
    console.log(`🚀 ${dryRun ? 'Simulating' : 'Deploying'} configuration to ${environment}...`);

    // Validate configuration first
    const validation = await this.validateConfiguration(environment);
    if (!validation.valid) {
      throw new Error('Configuration validation failed');
    }

    // Generate configuration files
    await this.generateEnvironmentConfig(environment);

    if (dryRun) {
      console.log('✅ Dry run completed successfully');
      return;
    }

    // Deploy based on environment
    switch (environment) {
      case 'development':
        await this.deployToLocal();
        break;
      case 'staging':
        await this.deployToStaging();
        break;
      case 'production':
        await this.deployToProduction();
        break;
      default:
        throw new Error(`Unknown environment: ${environment}`);
    }

    console.log(`✅ Configuration deployed to ${environment}`);
  }

  /**
   * Validate field type
   */
  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Validate field against validation rules
   */
  private validateField(key: string, value: any, validation: any): string[] {
    const errors: string[] = [];

    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        errors.push(`Value for ${key} does not match pattern: ${validation.pattern}`);
      }
    }

    if (validation.min !== undefined && typeof value === 'number') {
      if (value < validation.min) {
        errors.push(`Value for ${key} is below minimum: ${validation.min}`);
      }
    }

    if (validation.max !== undefined && typeof value === 'number') {
      if (value > validation.max) {
        errors.push(`Value for ${key} is above maximum: ${validation.max}`);
      }
    }

    if (validation.enum && !validation.enum.includes(value)) {
      errors.push(`Value for ${key} is not in allowed values: ${validation.enum.join(', ')}`);
    }

    return errors;
  }

  /**
   * Check for unknown configuration fields
   */
  private checkUnknownFields(config: Record<string, any>, schema: ConfigSchema, result: ConfigValidationResult): void {
    const flatConfig = this.flattenObject(config);
    const schemaKeys = Object.keys(schema);

    for (const key of Object.keys(flatConfig)) {
      if (!schemaKeys.includes(key)) {
        result.warnings.push(`Unknown configuration field: ${key}`);
      }
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Flatten object for comparison
   */
  private flattenObject(obj: any, prefix: string = ''): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
    
    return result;
  }

  /**
   * Generate .env format
   */
  private generateEnvFormat(config: Record<string, any>): string {
    const flatConfig = this.flattenObject(config);
    return Object.entries(flatConfig)
      .map(([key, value]) => {
        const envKey = key.toUpperCase().replace(/\./g, '_');
        const envValue = typeof value === 'string' ? value : JSON.stringify(value);
        return `${envKey}=${envValue}`;
      })
      .join('\n');
  }

  /**
   * Generate Docker Compose format
   */
  private generateDockerFormat(config: Record<string, any>): string {
    const flatConfig = this.flattenObject(config);
    const envVars = Object.entries(flatConfig)
      .map(([key, value]) => {
        const envKey = key.toUpperCase().replace(/\./g, '_');
        const envValue = typeof value === 'string' ? value : JSON.stringify(value);
        return `      - ${envKey}=${envValue}`;
      })
      .join('\n');

    return `# Generated Docker Compose environment variables
services:
  synapse-hub:
    environment:
${envVars}`;
  }

  /**
   * Generate YAML format
   */
  private generateYamlFormat(config: Record<string, any>): string {
    return this.objectToYaml(config, 0);
  }

  /**
   * Convert object to YAML format
   */
  private objectToYaml(obj: any, indent: number): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          yaml += `${spaces}  - ${item}\n`;
        });
      } else {
        const yamlValue = typeof value === 'string' ? `"${value}"` : value;
        yaml += `${spaces}${key}: ${yamlValue}\n`;
      }
    }

    return yaml;
  }

  /**
   * Deploy to local environment
   */
  private async deployToLocal(): Promise<void> {
    console.log('🏠 Deploying to local environment...');
    
    const sourcePath = join(this.configDir, 'generated', 'development.env');
    const targetPath = join(process.cwd(), '.env.local');
    
    if (existsSync(sourcePath)) {
      execSync(`cp ${sourcePath} ${targetPath}`);
      console.log('📄 Updated .env.local file');
    }
  }

  /**
   * Deploy to staging environment
   */
  private async deployToStaging(): Promise<void> {
    console.log('🎭 Deploying to staging environment...');
    // Implementation depends on staging infrastructure
    console.log('⚠️  Staging deployment requires infrastructure setup');
  }

  /**
   * Deploy to production environment
   */
  private async deployToProduction(): Promise<void> {
    console.log('🏭 Deploying to production environment...');
    // Implementation depends on production infrastructure
    console.log('⚠️  Production deployment requires infrastructure setup');
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    [this.configDir, this.envDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }
}

// CLI Interface
if (require.main === module) {
  const manager = new ConfigurationManager();
  
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1];

  switch (command) {
    case 'init':
      manager.initialize().catch(error => {
        console.error('Initialization failed:', error);
        process.exit(1);
      });
      break;
    
    case 'validate':
      if (!environment) {
        console.error('Environment required for validation');
        process.exit(1);
      }
      manager.validateConfiguration(environment).catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
      });
      break;
    
    case 'generate':
      if (!environment) {
        console.error('Environment required for generation');
        process.exit(1);
      }
      manager.generateEnvironmentConfig(environment).catch(error => {
        console.error('Generation failed:', error);
        process.exit(1);
      });
      break;
    
    case 'deploy':
      if (!environment) {
        console.error('Environment required for deployment');
        process.exit(1);
      }
      const dryRun = args.includes('--dry-run');
      manager.deployConfiguration(environment, dryRun).catch(error => {
        console.error('Deployment failed:', error);
        process.exit(1);
      });
      break;
    
    default:
      console.log(`
🔧 Configuration Management System

Usage:
  tsx scripts/configuration-management.ts <command> [environment] [options]

Commands:
  init                     - Initialize configuration system
  validate <env>           - Validate environment configuration
  generate <env>           - Generate configuration files
  deploy <env> [--dry-run] - Deploy configuration to environment

Environments:
  development             - Local development environment
  staging                 - Staging environment
  production              - Production environment

Examples:
  tsx scripts/configuration-management.ts init
  tsx scripts/configuration-management.ts validate development
  tsx scripts/configuration-management.ts generate staging
  tsx scripts/configuration-management.ts deploy production --dry-run
      `);
  }
}

export { ConfigurationManager, ConfigSchema, Environment, ConfigValidationResult }; 
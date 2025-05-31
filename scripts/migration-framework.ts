#!/usr/bin/env node

/**
 * Migration Framework System
 * 
 * Provides safe change management for all components including database, configuration, and code migrations.
 * Part of Phase 7: Advanced Automation & Future-Proofing
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { execSync } from 'child_process';

interface Migration {
  id: string;
  name: string;
  type: 'database' | 'config' | 'code' | 'data';
  version: string;
  description: string;
  dependencies: string[];
  rollbackable: boolean;
  estimatedDuration: number; // in seconds
  riskLevel: 'low' | 'medium' | 'high';
  upScript: string;
  downScript?: string;
  validationScript?: string;
  createdAt: Date;
  appliedAt?: Date;
  rolledBackAt?: Date;
}

interface MigrationResult {
  success: boolean;
  duration: number;
  output: string;
  error?: string;
}

interface MigrationPlan {
  migrations: Migration[];
  estimatedDuration: number;
  riskAssessment: {
    overall: 'low' | 'medium' | 'high';
    concerns: string[];
  };
  rollbackStrategy: string;
}

class MigrationFramework {
  private migrationsDir: string;
  private appliedMigrationsFile: string;
  private backupsDir: string;
  private templatesDir: string;

  constructor() {
    this.migrationsDir = join(process.cwd(), 'migrations');
    this.appliedMigrationsFile = join(this.migrationsDir, '.applied.json');
    this.backupsDir = join(this.migrationsDir, 'backups');
    this.templatesDir = join(this.migrationsDir, 'templates');
    
    this.ensureDirectories();
  }

  /**
   * Initialize migration framework
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Migration Framework...');
    
    // Create migration templates
    await this.createMigrationTemplates();
    
    // Create initial applied migrations file
    if (!existsSync(this.appliedMigrationsFile)) {
      writeFileSync(this.appliedMigrationsFile, JSON.stringify([], null, 2));
    }
    
    console.log('✅ Migration Framework initialized');
  }

  /**
   * Create migration templates
   */
  private async createMigrationTemplates(): Promise<void> {
    const templates = {
      'database-migration.template.ts': `// Database Migration Template
export const up = async (): Promise<void> => {
  // Add your database changes here
  // Example: CREATE TABLE, ALTER TABLE, INSERT data, etc.
  console.log('Applying database migration...');
};

export const down = async (): Promise<void> => {
  // Add rollback logic here
  // Example: DROP TABLE, revert ALTER TABLE, etc.
  console.log('Rolling back database migration...');
};

export const validate = async (): Promise<boolean> => {
  // Add validation logic here
  // Return true if migration was applied successfully
  return true;
};`,

      'config-migration.template.ts': `// Configuration Migration Template
export const up = async (): Promise<void> => {
  // Add configuration changes here
  // Example: Update config files, environment variables, etc.
  console.log('Applying configuration migration...');
};

export const down = async (): Promise<void> => {
  // Add rollback logic here
  // Example: Restore previous configuration
  console.log('Rolling back configuration migration...');
};

export const validate = async (): Promise<boolean> => {
  // Add validation logic here
  // Return true if configuration is correct
  return true;
};`,

      'code-migration.template.ts': `// Code Migration Template
export const up = async (): Promise<void> => {
  // Add code changes here
  // Example: File operations, dependency updates, etc.
  console.log('Applying code migration...');
};

export const down = async (): Promise<void> => {
  // Add rollback logic here
  // Example: Restore previous code state
  console.log('Rolling back code migration...');
};

export const validate = async (): Promise<boolean> => {
  // Add validation logic here
  // Return true if code changes are correct
  return true;
};`,

      'data-migration.template.ts': `// Data Migration Template
export const up = async (): Promise<void> => {
  // Add data transformation logic here
  // Example: Data format changes, data cleanup, etc.
  console.log('Applying data migration...');
};

export const down = async (): Promise<void> => {
  // Add rollback logic here
  // Example: Restore previous data format
  console.log('Rolling back data migration...');
};

export const validate = async (): Promise<boolean> => {
  // Add validation logic here
  // Return true if data is in correct format
  return true;
};`
    };

    for (const [filename, content] of Object.entries(templates)) {
      const templatePath = join(this.templatesDir, filename);
      if (!existsSync(templatePath)) {
        writeFileSync(templatePath, content);
        console.log(`📝 Created migration template: ${filename}`);
      }
    }
  }

  /**
   * Create a new migration
   */
  async createMigration(
    name: string,
    type: Migration['type'],
    description: string,
    options: {
      rollbackable?: boolean;
      riskLevel?: Migration['riskLevel'];
      dependencies?: string[];
      estimatedDuration?: number;
    } = {}
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    const migrationId = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}`;
    
    const migration: Migration = {
      id: migrationId,
      name,
      type,
      version: this.getCurrentVersion(),
      description,
      dependencies: options.dependencies || [],
      rollbackable: options.rollbackable !== false,
      estimatedDuration: options.estimatedDuration || 30,
      riskLevel: options.riskLevel || 'medium',
      upScript: `migrations/${migrationId}/up.ts`,
      downScript: options.rollbackable !== false ? `migrations/${migrationId}/down.ts` : undefined,
      validationScript: `migrations/${migrationId}/validate.ts`,
      createdAt: new Date()
    };

    // Create migration directory
    const migrationDir = join(this.migrationsDir, migrationId);
    mkdirSync(migrationDir, { recursive: true });

    // Create migration files from templates
    const templateFile = join(this.templatesDir, `${type}-migration.template.ts`);
    if (existsSync(templateFile)) {
      const template = readFileSync(templateFile, 'utf8');
      
      // Create up script
      writeFileSync(join(migrationDir, 'up.ts'), template);
      
      // Create down script if rollbackable
      if (migration.rollbackable) {
        writeFileSync(join(migrationDir, 'down.ts'), template);
      }
      
      // Create validation script
      writeFileSync(join(migrationDir, 'validate.ts'), template);
    }

    // Create migration metadata
    writeFileSync(
      join(migrationDir, 'migration.json'),
      JSON.stringify(migration, null, 2)
    );

    console.log(`✅ Created migration: ${migrationId}`);
    console.log(`📁 Migration directory: ${migrationDir}`);
    console.log(`📝 Edit the migration files to implement your changes`);

    return migrationId;
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const appliedMigrations = this.getAppliedMigrations();
    const allMigrations = await this.getAllMigrations();
    
    return allMigrations.filter(migration => 
      !appliedMigrations.find(applied => applied.id === migration.id)
    );
  }

  /**
   * Get all migrations
   */
  async getAllMigrations(): Promise<Migration[]> {
    const migrations: Migration[] = [];
    
    if (!existsSync(this.migrationsDir)) {
      return migrations;
    }

    const migrationDirs = readdirSync(this.migrationsDir)
      .filter(dir => {
        const fullPath = join(this.migrationsDir, dir);
        return statSync(fullPath).isDirectory() && 
               existsSync(join(fullPath, 'migration.json'));
      })
      .sort();

    for (const dir of migrationDirs) {
      const migrationFile = join(this.migrationsDir, dir, 'migration.json');
      const migration: Migration = JSON.parse(readFileSync(migrationFile, 'utf8'));
      migrations.push(migration);
    }

    return migrations;
  }

  /**
   * Create migration plan
   */
  async createMigrationPlan(targetMigrations?: string[]): Promise<MigrationPlan> {
    const pendingMigrations = await this.getPendingMigrations();
    let migrationsToApply = pendingMigrations;

    if (targetMigrations) {
      migrationsToApply = pendingMigrations.filter(m => 
        targetMigrations.includes(m.id) || targetMigrations.includes(m.name)
      );
    }

    // Sort by dependencies and creation date
    const orderedMigrations = this.resolveDependencies(migrationsToApply);
    
    // Calculate risk assessment
    const riskAssessment = this.assessRisk(orderedMigrations);
    
    // Estimate total duration
    const estimatedDuration = orderedMigrations.reduce(
      (total, migration) => total + migration.estimatedDuration, 0
    );

    const plan: MigrationPlan = {
      migrations: orderedMigrations,
      estimatedDuration,
      riskAssessment,
      rollbackStrategy: this.generateRollbackStrategy(orderedMigrations)
    };

    return plan;
  }

  /**
   * Apply migrations
   */
  async applyMigrations(migrationIds?: string[], dryRun: boolean = false): Promise<void> {
    console.log(`🚀 ${dryRun ? 'Simulating' : 'Applying'} migrations...`);

    const plan = await this.createMigrationPlan(migrationIds);
    
    if (plan.migrations.length === 0) {
      console.log('✅ No migrations to apply');
      return;
    }

    // Display migration plan
    this.displayMigrationPlan(plan);

    if (dryRun) {
      console.log('✅ Dry run completed');
      return;
    }

    // Confirm high-risk migrations
    if (plan.riskAssessment.overall === 'high') {
      console.log('⚠️  High-risk migration detected!');
      plan.riskAssessment.concerns.forEach(concern => {
        console.log(`  • ${concern}`);
      });
      // In a real implementation, you might want to add user confirmation here
    }

    // Create backup before applying migrations
    await this.createBackup();

    // Apply migrations one by one
    for (const migration of plan.migrations) {
      try {
        console.log(`\n🔄 Applying migration: ${migration.name} (${migration.id})`);
        
        const result = await this.applyMigration(migration);
        
        if (result.success) {
          // Mark as applied
          this.markMigrationAsApplied(migration);
          console.log(`✅ Migration applied successfully in ${result.duration}s`);
        } else {
          console.error(`❌ Migration failed: ${result.error}`);
          throw new Error(`Migration ${migration.id} failed: ${result.error}`);
        }
        
      } catch (error) {
        console.error(`❌ Migration ${migration.id} failed:`, error.message);
        
        // Rollback if possible
        if (migration.rollbackable) {
          console.log('🔄 Rolling back failed migration...');
          await this.rollbackMigration(migration);
        }
        
        throw error;
      }
    }

    console.log('\n✅ All migrations applied successfully!');
  }

  /**
   * Rollback migrations
   */
  async rollbackMigrations(count: number = 1): Promise<void> {
    console.log(`🔄 Rolling back ${count} migration(s)...`);

    const appliedMigrations = this.getAppliedMigrations()
      .sort((a, b) => new Date(b.appliedAt!).getTime() - new Date(a.appliedAt!).getTime())
      .slice(0, count);

    if (appliedMigrations.length === 0) {
      console.log('✅ No migrations to rollback');
      return;
    }

    // Create backup before rollback
    await this.createBackup();

    for (const migration of appliedMigrations) {
      try {
        console.log(`\n🔄 Rolling back migration: ${migration.name} (${migration.id})`);
        
        if (!migration.rollbackable) {
          console.log(`⚠️  Migration ${migration.id} is not rollbackable, skipping...`);
          continue;
        }

        const result = await this.rollbackMigration(migration);
        
        if (result.success) {
          this.markMigrationAsRolledBack(migration);
          console.log(`✅ Migration rolled back successfully in ${result.duration}s`);
        } else {
          console.error(`❌ Rollback failed: ${result.error}`);
          throw new Error(`Rollback of ${migration.id} failed: ${result.error}`);
        }
        
      } catch (error) {
        console.error(`❌ Rollback of ${migration.id} failed:`, error.message);
        throw error;
      }
    }

    console.log('\n✅ All migrations rolled back successfully!');
  }

  /**
   * Apply single migration
   */
  private async applyMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      const migrationDir = join(this.migrationsDir, migration.id);
      const upScriptPath = join(migrationDir, 'up.ts');
      
      if (!existsSync(upScriptPath)) {
        throw new Error(`Up script not found: ${upScriptPath}`);
      }

      // Execute migration script
      const output = execSync(`tsx ${upScriptPath}`, { 
        encoding: 'utf8',
        cwd: process.cwd()
      });

      // Run validation if available
      const validationPath = join(migrationDir, 'validate.ts');
      if (existsSync(validationPath)) {
        const validationOutput = execSync(`tsx ${validationPath}`, { 
          encoding: 'utf8',
          cwd: process.cwd()
        });
        
        if (validationOutput.includes('false')) {
          throw new Error('Migration validation failed');
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      
      return {
        success: true,
        duration,
        output
      };
      
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      return {
        success: false,
        duration,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Rollback single migration
   */
  private async rollbackMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      const migrationDir = join(this.migrationsDir, migration.id);
      const downScriptPath = join(migrationDir, 'down.ts');
      
      if (!existsSync(downScriptPath)) {
        throw new Error(`Down script not found: ${downScriptPath}`);
      }

      // Execute rollback script
      const output = execSync(`tsx ${downScriptPath}`, { 
        encoding: 'utf8',
        cwd: process.cwd()
      });

      const duration = (Date.now() - startTime) / 1000;
      
      return {
        success: true,
        duration,
        output
      };
      
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      return {
        success: false,
        duration,
        output: '',
        error: error.message
      };
    }
  }

  /**
   * Resolve migration dependencies
   */
  private resolveDependencies(migrations: Migration[]): Migration[] {
    const resolved: Migration[] = [];
    const remaining = [...migrations];
    
    while (remaining.length > 0) {
      const canApply = remaining.filter(migration => 
        migration.dependencies.every(dep => 
          resolved.find(r => r.id === dep || r.name === dep)
        )
      );
      
      if (canApply.length === 0) {
        throw new Error('Circular dependency detected in migrations');
      }
      
      // Sort by creation date for deterministic order
      canApply.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      resolved.push(...canApply);
      remaining.splice(0, remaining.length, ...remaining.filter(m => !canApply.includes(m)));
    }
    
    return resolved;
  }

  /**
   * Assess migration risk
   */
  private assessRisk(migrations: Migration[]): MigrationPlan['riskAssessment'] {
    const concerns: string[] = [];
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    
    const riskCounts = { low: 0, medium: 0, high: 0 };
    migrations.forEach(m => riskCounts[m.riskLevel]++);
    
    if (riskCounts.high > 0) {
      overallRisk = 'high';
      concerns.push(`${riskCounts.high} high-risk migration(s)`);
    } else if (riskCounts.medium > 2) {
      overallRisk = 'high';
      concerns.push(`Multiple medium-risk migrations (${riskCounts.medium})`);
    } else if (riskCounts.medium > 0) {
      overallRisk = 'medium';
      concerns.push(`${riskCounts.medium} medium-risk migration(s)`);
    }
    
    const nonRollbackable = migrations.filter(m => !m.rollbackable);
    if (nonRollbackable.length > 0) {
      concerns.push(`${nonRollbackable.length} non-rollbackable migration(s)`);
    }
    
    const totalDuration = migrations.reduce((sum, m) => sum + m.estimatedDuration, 0);
    if (totalDuration > 300) { // 5 minutes
      concerns.push(`Long estimated duration: ${Math.round(totalDuration / 60)} minutes`);
    }
    
    return { overall: overallRisk, concerns };
  }

  /**
   * Generate rollback strategy
   */
  private generateRollbackStrategy(migrations: Migration[]): string {
    const rollbackable = migrations.filter(m => m.rollbackable);
    const nonRollbackable = migrations.filter(m => !m.rollbackable);
    
    let strategy = `Rollback Strategy:\n`;
    
    if (rollbackable.length > 0) {
      strategy += `• ${rollbackable.length} migration(s) can be automatically rolled back\n`;
    }
    
    if (nonRollbackable.length > 0) {
      strategy += `• ${nonRollbackable.length} migration(s) require manual rollback:\n`;
      nonRollbackable.forEach(m => {
        strategy += `  - ${m.name} (${m.id})\n`;
      });
    }
    
    strategy += `• Full backup will be created before applying migrations\n`;
    strategy += `• Use 'tsx scripts/migration-framework.ts rollback <count>' to rollback`;
    
    return strategy;
  }

  /**
   * Display migration plan
   */
  private displayMigrationPlan(plan: MigrationPlan): void {
    console.log('\n📋 Migration Plan:');
    console.log(`• Total migrations: ${plan.migrations.length}`);
    console.log(`• Estimated duration: ${Math.round(plan.estimatedDuration / 60)} minutes`);
    console.log(`• Risk level: ${plan.riskAssessment.overall.toUpperCase()}`);
    
    if (plan.riskAssessment.concerns.length > 0) {
      console.log('• Concerns:');
      plan.riskAssessment.concerns.forEach(concern => {
        console.log(`  - ${concern}`);
      });
    }
    
    console.log('\n📝 Migrations to apply:');
    plan.migrations.forEach((migration, index) => {
      const riskIndicator = migration.riskLevel === 'high' ? '🔴' : 
                           migration.riskLevel === 'medium' ? '🟡' : '🟢';
      const rollbackIndicator = migration.rollbackable ? '↩️' : '⚠️';
      
      console.log(`  ${index + 1}. ${riskIndicator} ${rollbackIndicator} ${migration.name}`);
      console.log(`     ${migration.description}`);
      console.log(`     Type: ${migration.type}, Duration: ~${migration.estimatedDuration}s`);
    });
    
    console.log(`\n${plan.rollbackStrategy}`);
  }

  /**
   * Create backup
   */
  private async createBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(this.backupsDir, `backup_${timestamp}`);
    
    mkdirSync(backupDir, { recursive: true });
    
    try {
      // Backup database
      if (existsSync('local.db')) {
        execSync(`cp local.db ${backupDir}/local.db`);
      }
      
      // Backup configuration
      if (existsSync('config')) {
        execSync(`cp -r config ${backupDir}/config`);
      }
      
      // Backup important files
      const importantFiles = ['package.json', '.env.local', 'docker-compose.yml'];
      importantFiles.forEach(file => {
        if (existsSync(file)) {
          execSync(`cp ${file} ${backupDir}/${file}`);
        }
      });
      
      console.log(`💾 Backup created: ${backupDir}`);
    } catch (error) {
      console.warn(`⚠️  Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Get applied migrations
   */
  private getAppliedMigrations(): Migration[] {
    if (!existsSync(this.appliedMigrationsFile)) {
      return [];
    }
    
    return JSON.parse(readFileSync(this.appliedMigrationsFile, 'utf8'));
  }

  /**
   * Mark migration as applied
   */
  private markMigrationAsApplied(migration: Migration): void {
    const appliedMigrations = this.getAppliedMigrations();
    
    migration.appliedAt = new Date();
    appliedMigrations.push(migration);
    
    writeFileSync(
      this.appliedMigrationsFile,
      JSON.stringify(appliedMigrations, null, 2)
    );
  }

  /**
   * Mark migration as rolled back
   */
  private markMigrationAsRolledBack(migration: Migration): void {
    const appliedMigrations = this.getAppliedMigrations();
    const index = appliedMigrations.findIndex(m => m.id === migration.id);
    
    if (index !== -1) {
      appliedMigrations.splice(index, 1);
      writeFileSync(
        this.appliedMigrationsFile,
        JSON.stringify(appliedMigrations, null, 2)
      );
    }
  }

  /**
   * Get current version
   */
  private getCurrentVersion(): string {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      return packageJson.version || '0.0.1';
    } catch {
      return '0.0.1';
    }
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    [this.migrationsDir, this.backupsDir, this.templatesDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }
}

// CLI Interface
if (require.main === module) {
  const framework = new MigrationFramework();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      framework.initialize().catch(error => {
        console.error('Initialization failed:', error);
        process.exit(1);
      });
      break;
    
    case 'create':
      const name = args[1];
      const type = args[2] as Migration['type'];
      const description = args.slice(3).join(' ');
      
      if (!name || !type || !description) {
        console.error('Usage: create <name> <type> <description>');
        console.error('Types: database, config, code, data');
        process.exit(1);
      }
      
      framework.createMigration(name, type, description).catch(error => {
        console.error('Migration creation failed:', error);
        process.exit(1);
      });
      break;
    
    case 'status':
      framework.getPendingMigrations().then(pending => {
        console.log(`📋 Pending migrations: ${pending.length}`);
        pending.forEach(m => {
          console.log(`  • ${m.name} (${m.type})`);
        });
      }).catch(error => {
        console.error('Status check failed:', error);
        process.exit(1);
      });
      break;
    
    case 'plan':
      framework.createMigrationPlan().then(plan => {
        framework['displayMigrationPlan'](plan);
      }).catch(error => {
        console.error('Plan creation failed:', error);
        process.exit(1);
      });
      break;
    
    case 'apply':
      const dryRun = args.includes('--dry-run');
      const migrationIds = args.filter(arg => arg !== '--dry-run').slice(1);
      
      framework.applyMigrations(migrationIds.length > 0 ? migrationIds : undefined, dryRun)
        .catch(error => {
          console.error('Migration application failed:', error);
          process.exit(1);
        });
      break;
    
    case 'rollback':
      const count = parseInt(args[1]) || 1;
      framework.rollbackMigrations(count).catch(error => {
        console.error('Rollback failed:', error);
        process.exit(1);
      });
      break;
    
    default:
      console.log(`
🔄 Migration Framework

Usage:
  tsx scripts/migration-framework.ts <command> [options]

Commands:
  init                                    - Initialize migration framework
  create <name> <type> <description>      - Create new migration
  status                                  - Show pending migrations
  plan                                    - Show migration plan
  apply [migration-ids...] [--dry-run]    - Apply migrations
  rollback [count]                        - Rollback migrations

Migration Types:
  database                               - Database schema or data changes
  config                                 - Configuration changes
  code                                   - Code structure changes
  data                                   - Data transformation

Examples:
  tsx scripts/migration-framework.ts init
  tsx scripts/migration-framework.ts create "Add user table" database "Create users table with auth fields"
  tsx scripts/migration-framework.ts plan
  tsx scripts/migration-framework.ts apply --dry-run
  tsx scripts/migration-framework.ts apply
  tsx scripts/migration-framework.ts rollback 2
      `);
  }
}

export { MigrationFramework, Migration, MigrationResult, MigrationPlan }; 
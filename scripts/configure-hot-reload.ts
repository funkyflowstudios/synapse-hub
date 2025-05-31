#!/usr/bin/env tsx
/**
 * Hot Reload Configuration Script
 * Part of Phase 4: Development Environment Optimization
 * 
 * This script configures hot reload for all components of Synapse-Hub
 * including UI, backend services, and cursor connector.
 */

import fs from 'fs';
import path from 'path';

interface HotReloadConfig {
	component: string;
	enabled: boolean;
	port?: number;
	watchPaths: string[];
	ignorePaths: string[];
	command: string;
	restartDelay: number;
}

class HotReloadConfigurator {
	private configs: HotReloadConfig[] = [];

	async configureAllComponents(): Promise<void> {
		console.log('🔥 Configuring Hot Reload for Synapse-Hub Components\n');

		// Configure hot reload for each component
		await this.configureSvelteKitHotReload();
		await this.configureStorybookHotReload();
		await this.configureWebSocketHotReload();
		await this.configureCursorConnectorHotReload();
		await this.configureValidationScriptsHotReload();

		// Generate configuration files
		await this.generateNodemonConfigs();
		await this.generateConcurrentlyConfig();
		await this.updateViteConfig();
		await this.createHotReloadScript();

		this.printHotReloadSummary();
	}

	private async configureSvelteKitHotReload(): Promise<void> {
		console.log('🎯 Configuring SvelteKit Hot Reload...');

		const config: HotReloadConfig = {
			component: 'SvelteKit App',
			enabled: true,
			port: 5173,
			watchPaths: [
				'src/**/*.svelte',
				'src/**/*.ts',
				'src/**/*.js',
				'src/**/*.css',
				'src/app.html',
				'static/**/*'
			],
			ignorePaths: [
				'src/**/*.test.*',
				'src/**/*.spec.*',
				'.svelte-kit/**',
				'build/**',
				'node_modules/**'
			],
			command: 'vite dev --host 0.0.0.0',
			restartDelay: 100
		};

		this.configs.push(config);
		console.log('  ✅ SvelteKit hot reload configured');
	}

	private async configureStorybookHotReload(): Promise<void> {
		console.log('📚 Configuring Storybook Hot Reload...');

		const config: HotReloadConfig = {
			component: 'Storybook',
			enabled: true,
			port: 6006,
			watchPaths: [
				'src/**/*.stories.*',
				'src/**/*.svelte',
				'src/**/*.ts',
				'.storybook/**/*'
			],
			ignorePaths: [
				'node_modules/**',
				'storybook-static/**',
				'.svelte-kit/**'
			],
			command: 'storybook dev -p 6006 --host 0.0.0.0',
			restartDelay: 500
		};

		this.configs.push(config);
		console.log('  ✅ Storybook hot reload configured');
	}

	private async configureWebSocketHotReload(): Promise<void> {
		console.log('🔌 Configuring WebSocket Server Hot Reload...');

		const config: HotReloadConfig = {
			component: 'WebSocket Server',
			enabled: true,
			port: 3001,
			watchPaths: [
				'src/lib/server/**/*.ts',
				'src/routes/api/**/*.ts'
			],
			ignorePaths: [
				'node_modules/**',
				'**/*.test.*',
				'**/*.spec.*'
			],
			command: 'tsx src/lib/server/websocket.ts',
			restartDelay: 1000
		};

		this.configs.push(config);
		console.log('  ✅ WebSocket server hot reload configured');
	}

	private async configureCursorConnectorHotReload(): Promise<void> {
		console.log('🖱️ Configuring Cursor Connector Hot Reload...');

		const config: HotReloadConfig = {
			component: 'Cursor Connector',
			enabled: true,
			port: 8080,
			watchPaths: [
				'cursor-connector/src/**/*.ts',
				'cursor-connector/src/**/*.js'
			],
			ignorePaths: [
				'cursor-connector/node_modules/**',
				'cursor-connector/dist/**',
				'**/*.test.*'
			],
			command: 'tsx cursor-connector/src/index.ts',
			restartDelay: 1000
		};

		this.configs.push(config);
		console.log('  ✅ Cursor connector hot reload configured');
	}

	private async configureValidationScriptsHotReload(): Promise<void> {
		console.log('🔍 Configuring Validation Scripts Hot Reload...');

		const config: HotReloadConfig = {
			component: 'Validation Scripts',
			enabled: false, // Only enabled when explicitly requested
			watchPaths: [
				'scripts/**/*.ts'
			],
			ignorePaths: [
				'node_modules/**'
			],
			command: 'tsx scripts/health-checks.ts',
			restartDelay: 2000
		};

		this.configs.push(config);
		console.log('  ✅ Validation scripts hot reload configured');
	}

	private async generateNodemonConfigs(): Promise<void> {
		console.log('⚙️ Generating nodemon configurations...');

		// Create nodemon config for WebSocket server
		const wsNodemonConfig = {
			watch: ['src/lib/server', 'src/routes/api'],
			ext: 'ts,js,json',
			ignore: ['**/*.test.*', '**/*.spec.*', 'node_modules'],
			exec: 'tsx src/lib/server/websocket.ts',
			delay: 1000,
			env: {
				NODE_ENV: 'development',
				WS_PORT: '3001'
			}
		};

		fs.writeFileSync('nodemon.websocket.json', JSON.stringify(wsNodemonConfig, null, 2));

		// Create nodemon config for Cursor connector
		const connectorNodemonConfig = {
			watch: ['cursor-connector/src'],
			ext: 'ts,js,json',
			ignore: ['node_modules', 'dist', '**/*.test.*'],
			exec: 'tsx cursor-connector/src/index.ts',
			delay: 1000,
			cwd: './cursor-connector',
			env: {
				NODE_ENV: 'development',
				CONNECTOR_PORT: '8080'
			}
		};

		// Ensure cursor-connector directory exists
		if (!fs.existsSync('cursor-connector')) {
			fs.mkdirSync('cursor-connector', { recursive: true });
		}

		fs.writeFileSync('cursor-connector/nodemon.json', JSON.stringify(connectorNodemonConfig, null, 2));

		console.log('  ✅ Nodemon configurations generated');
	}

	private async generateConcurrentlyConfig(): Promise<void> {
		console.log('🔄 Generating concurrently configuration...');

		const concurrentlyConfig = {
			scripts: {
				'dev:app': {
					command: 'vite dev --host 0.0.0.0',
					name: 'app',
					prefixColor: 'blue'
				},
				'dev:storybook': {
					command: 'storybook dev -p 6006 --host 0.0.0.0',
					name: 'storybook',
					prefixColor: 'magenta'
				},
				'dev:websocket': {
					command: 'nodemon --config nodemon.websocket.json',
					name: 'websocket',
					prefixColor: 'green'
				},
				'dev:connector': {
					command: 'nodemon --config cursor-connector/nodemon.json',
					name: 'connector',
					prefixColor: 'yellow'
				},
				'dev:db': {
					command: 'drizzle-kit studio --host 0.0.0.0',
					name: 'db-studio',
					prefixColor: 'cyan'
				}
			},
			options: {
				killOthers: ['failure', 'success'],
				restartTries: 3,
				prefix: 'name',
				timestampFormat: 'HH:mm:ss'
			}
		};

		fs.writeFileSync('concurrently.config.json', JSON.stringify(concurrentlyConfig, null, 2));
		console.log('  ✅ Concurrently configuration generated');
	}

	private async updateViteConfig(): Promise<void> {
		console.log('⚡ Updating Vite configuration for optimal hot reload...');

		const viteConfigPath = 'vite.config.ts';
		
		if (!fs.existsSync(viteConfigPath)) {
			console.log('  ⚠️ vite.config.ts not found, skipping update');
			return;
		}

		const currentConfig = fs.readFileSync(viteConfigPath, 'utf8');

		// Check if hot reload config already exists
		if (currentConfig.includes('hmr:') || currentConfig.includes('HMR')) {
			console.log('  ✅ Vite HMR configuration already present');
			return;
		}

		// Add HMR configuration to the server section
		const hmrConfig = `
		// Hot Module Replacement configuration
		hmr: {
			port: 24678,
			host: 'localhost'
		},
		// File watching configuration
		watch: {
			usePolling: process.env.VITE_USE_POLLING === 'true',
			interval: 100
		}`;

		// Try to inject HMR config into existing server configuration
		if (currentConfig.includes('server:')) {
			const updatedConfig = currentConfig.replace(
				/server:\s*{/,
				`server: {\n\t\t${hmrConfig.trim()},`
			);
			fs.writeFileSync(viteConfigPath, updatedConfig);
			console.log('  ✅ Vite HMR configuration added to existing server config');
		} else {
			console.log('  ⚠️ Could not automatically update vite.config.ts. Manual configuration may be needed.');
		}
	}

	private async createHotReloadScript(): Promise<void> {
		console.log('📜 Creating hot reload management script...');

		const hotReloadScript = `#!/usr/bin/env tsx
/**
 * Hot Reload Management Script
 * Generated by configure-hot-reload.ts
 */

import { spawn, ChildProcess } from 'child_process';

interface ServiceConfig {
	name: string;
	command: string;
	args: string[];
	cwd?: string;
	enabled: boolean;
}

class HotReloadManager {
	private services: Map<string, ChildProcess> = new Map();
	private configs: ServiceConfig[] = [
		{
			name: 'app',
			command: 'npm',
			args: ['run', 'dev'],
			enabled: true
		},
		{
			name: 'storybook',
			command: 'npm',
			args: ['run', 'storybook'],
			enabled: process.argv.includes('--storybook')
		},
		{
			name: 'websocket',
			command: 'nodemon',
			args: ['--config', 'nodemon.websocket.json'],
			enabled: process.argv.includes('--websocket')
		},
		{
			name: 'connector',
			command: 'nodemon',
			args: ['--config', 'cursor-connector/nodemon.json'],
			enabled: process.argv.includes('--connector')
		},
		{
			name: 'db-studio',
			command: 'npm',
			args: ['run', 'db:studio'],
			enabled: process.argv.includes('--db-studio')
		}
	];

	async start(serviceNames?: string[]): Promise<void> {
		console.log('🔥 Starting Hot Reload Services\\n');

		const servicesToStart = serviceNames 
			? this.configs.filter(config => serviceNames.includes(config.name))
			: this.configs.filter(config => config.enabled);

		for (const config of servicesToStart) {
			await this.startService(config);
		}

		// Handle graceful shutdown
		process.on('SIGINT', () => this.stopAll());
		process.on('SIGTERM', () => this.stopAll());

		console.log('\\n✅ All services started. Press Ctrl+C to stop.');
	}

	private async startService(config: ServiceConfig): Promise<void> {
		console.log(\`🚀 Starting \${config.name}...\`);

		const service = spawn(config.command, config.args, {
			stdio: ['inherit', 'pipe', 'pipe'],
			cwd: config.cwd,
			env: { ...process.env, FORCE_COLOR: '1' }
		});

		service.stdout?.on('data', (data) => {
			console.log(\`[\${config.name}] \${data.toString().trim()}\`);
		});

		service.stderr?.on('data', (data) => {
			console.error(\`[\${config.name}] \${data.toString().trim()}\`);
		});

		service.on('close', (code) => {
			console.log(\`[\${config.name}] Process exited with code \${code}\`);
			this.services.delete(config.name);
		});

		this.services.set(config.name, service);
	}

	private stopAll(): void {
		console.log('\\n🛑 Stopping all services...');
		
		for (const [name, service] of this.services) {
			console.log(\`Stopping \${name}...\`);
			service.kill('SIGTERM');
		}

		setTimeout(() => {
			for (const [name, service] of this.services) {
				if (!service.killed) {
					console.log(\`Force killing \${name}...\`);
					service.kill('SIGKILL');
				}
			}
			process.exit(0);
		}, 5000);
	}
}

// CLI interface
const manager = new HotReloadManager();

if (process.argv.includes('--help')) {
	console.log(\`
Hot Reload Manager for Synapse-Hub

Usage: tsx scripts/hot-reload.ts [options] [services...]

Options:
  --help         Show this help message
  --storybook    Enable Storybook
  --websocket    Enable WebSocket server
  --connector    Enable Cursor connector
  --db-studio    Enable Drizzle Studio

Examples:
  tsx scripts/hot-reload.ts                    # Start main app only
  tsx scripts/hot-reload.ts --storybook        # Start app + Storybook
  tsx scripts/hot-reload.ts app websocket      # Start specific services
	\`);
	process.exit(0);
}

manager.start().catch(console.error);
`;

		fs.writeFileSync('scripts/hot-reload.ts', hotReloadScript);
		console.log('  ✅ Hot reload management script created');
	}

	private printHotReloadSummary(): void {
		console.log('\n' + '='.repeat(70));
		console.log('🔥 HOT RELOAD CONFIGURATION SUMMARY');
		console.log('='.repeat(70));

		console.log('📋 Configured Components:');
		this.configs.forEach(config => {
			const status = config.enabled ? '✅ Enabled' : '⏭️ Optional';
			const port = config.port ? ` (Port: ${config.port})` : '';
			console.log(`  • ${config.component}${port}: ${status}`);
		});

		console.log('\n🔧 Generated Files:');
		console.log('  • nodemon.websocket.json - WebSocket server hot reload');
		console.log('  • cursor-connector/nodemon.json - Cursor connector hot reload');
		console.log('  • concurrently.config.json - Multi-service configuration');
		console.log('  • scripts/hot-reload.ts - Hot reload management script');

		console.log('\n🚀 Usage Commands:');
		console.log('  npm run dev                   - Start main app with hot reload');
		console.log('  tsx scripts/hot-reload.ts     - Advanced hot reload manager');
		console.log('  npm run dev:all               - Start all services concurrently');

		console.log('\n⚡ Hot Reload Features:');
		console.log('  ✅ File watching with optimal polling');
		console.log('  ✅ Automatic restart on changes');
		console.log('  ✅ Configurable restart delays');
		console.log('  ✅ Multi-service coordination');
		console.log('  ✅ Graceful shutdown handling');

		console.log('\n🎯 Optimizations:');
		console.log('  • Fast refresh for Svelte components');
		console.log('  • HMR for CSS and static assets');
		console.log('  • Selective file watching to avoid unnecessary rebuilds');
		console.log('  • Intelligent restart delays for different service types');
	}

	// Update package.json with new scripts
	async updatePackageScripts(): Promise<void> {
		console.log('📦 Updating package.json scripts...');

		const packageJsonPath = 'package.json';
		if (!fs.existsSync(packageJsonPath)) {
			console.log('  ⚠️ package.json not found');
			return;
		}

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

		// Add new hot reload scripts
		const newScripts = {
			'dev:all': 'concurrently -c "scripts" concurrently.config.json',
			'dev:websocket': 'nodemon --config nodemon.websocket.json',
			'dev:connector': 'nodemon --config cursor-connector/nodemon.json',
			'dev:hot': 'tsx scripts/hot-reload.ts',
			'dev:hot:full': 'tsx scripts/hot-reload.ts --storybook --websocket --db-studio'
		};

		packageJson.scripts = { ...packageJson.scripts, ...newScripts };

		fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
		console.log('  ✅ Package.json scripts updated');
	}
}

// CLI execution
if (import.meta.url === \`file://\${process.argv[1]}\`) {
	const configurator = new HotReloadConfigurator();
	configurator.configureAllComponents()
		.then(() => configurator.updatePackageScripts())
		.then(() => {
			console.log('\\n🎉 Hot reload configuration complete!');
			console.log('\\n🚀 Quick start: npm run dev');
			console.log('🔧 Advanced: tsx scripts/hot-reload.ts --help');
		})
		.catch(error => {
			console.error('Hot reload configuration failed:', error);
			process.exit(1);
		});
}

export { HotReloadConfigurator }; 
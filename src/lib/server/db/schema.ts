import { 
	sqliteTable, 
	integer, 
	text, 
	real,
	blob,
	index,
	unique,
	primaryKey
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ========================================
// USER MANAGEMENT TABLES
// ========================================

export const user = sqliteTable('users', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	email: text('email').unique(),
	displayName: text('display_name'),
	avatar: text('avatar'),
	role: text('role', { enum: ['admin', 'developer', 'user', 'guest', 'connector'] }).notNull().default('user'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).notNull().default(false),
	lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	usernameIdx: index('idx_users_username').on(table.username),
	emailIdx: index('idx_users_email').on(table.email),
	roleIdx: index('idx_users_role').on(table.role),
	activeIdx: index('idx_users_active').on(table.isActive)
}));

export const session = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	refreshToken: text('refresh_token'),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	lastActiveAt: integer('last_active_at', { mode: 'timestamp' }).notNull(),
	deviceInfo: text('device_info', { mode: 'json' }).notNull(), // JSON string for DeviceInfo
	location: text('location', { mode: 'json' }), // JSON string for Location
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	userIdIdx: index('idx_sessions_user_id').on(table.userId),
	tokenIdx: index('idx_sessions_token').on(table.token),
	expiresAtIdx: index('idx_sessions_expires_at').on(table.expiresAt),
	activeIdx: index('idx_sessions_active').on(table.isActive)
}));

export const userPreferences = sqliteTable('user_preferences', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	theme: text('theme', { enum: ['light', 'dark', 'system'] }).notNull().default('system'),
	language: text('language').notNull().default('en'),
	timezone: text('timezone').notNull().default('UTC'),
	notifications: text('notifications', { mode: 'json' }).notNull(), // NotificationPreferences JSON
	accessibility: text('accessibility', { mode: 'json' }).notNull(), // AccessibilityPreferences JSON
	privacy: text('privacy', { mode: 'json' }).notNull(), // PrivacyPreferences JSON
	ui: text('ui', { mode: 'json' }).notNull(), // UIPreferences JSON
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	userIdIdx: unique('unique_user_preferences').on(table.userId)
}));

export const userPermissions = sqliteTable('user_permissions', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	resource: text('resource', { 
		enum: ['user', 'session', 'workflow', 'connector', 'project', 'system', 'analytics', 'integrations'] 
	}).notNull(),
	actions: text('actions', { mode: 'json' }).notNull(), // Array of AuthAction
	conditions: text('conditions', { mode: 'json' }), // Array of PermissionCondition
	grantedBy: text('granted_by').notNull().references(() => user.id),
	grantedAt: integer('granted_at', { mode: 'timestamp' }).notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	userResourceIdx: index('idx_user_permissions_user_resource').on(table.userId, table.resource),
	resourceIdx: index('idx_user_permissions_resource').on(table.resource)
}));

// ========================================
// WORKFLOW MANAGEMENT TABLES
// ========================================

export const workflows = sqliteTable('workflows', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	status: text('status', { 
		enum: ['running', 'paused', 'completed', 'failed', 'draft'] 
	}).notNull().default('draft'),
	progress: integer('progress').notNull().default(0), // 0-100
	configuration: text('configuration', { mode: 'json' }).notNull(),
	metadata: text('metadata', { mode: 'json' }),
	createdBy: text('created_by').notNull().references(() => user.id),
	startedAt: integer('started_at', { mode: 'timestamp' }),
	completedAt: integer('completed_at', { mode: 'timestamp' }),
	estimatedDuration: integer('estimated_duration'), // seconds
	actualDuration: integer('actual_duration'), // seconds
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	statusIdx: index('idx_workflows_status').on(table.status),
	createdByIdx: index('idx_workflows_created_by').on(table.createdBy),
	nameIdx: index('idx_workflows_name').on(table.name)
}));

export const workflowSteps = sqliteTable('workflow_steps', {
	id: text('id').primaryKey(),
	workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	type: text('type', { enum: ['action', 'condition', 'loop', 'parallel', 'delay'] }).notNull(),
	status: text('status', { 
		enum: ['pending', 'running', 'completed', 'failed', 'skipped'] 
	}).notNull().default('pending'),
	order: integer('order').notNull(),
	configuration: text('configuration', { mode: 'json' }).notNull(),
	dependencies: text('dependencies', { mode: 'json' }), // Array of step IDs
	duration: integer('duration'), // milliseconds
	output: text('output', { mode: 'json' }),
	error: text('error'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	workflowIdIdx: index('idx_workflow_steps_workflow_id').on(table.workflowId),
	orderIdx: index('idx_workflow_steps_order').on(table.workflowId, table.order),
	statusIdx: index('idx_workflow_steps_status').on(table.status)
}));

export const workflowTriggers = sqliteTable('workflow_triggers', {
	id: text('id').primaryKey(),
	workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
	type: text('type', { 
		enum: ['manual', 'schedule', 'event', 'webhook', 'file', 'api'] 
	}).notNull(),
	configuration: text('configuration', { mode: 'json' }).notNull(),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	lastTriggered: integer('last_triggered', { mode: 'timestamp' }),
	nextTrigger: integer('next_trigger', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	workflowIdIdx: index('idx_workflow_triggers_workflow_id').on(table.workflowId),
	typeIdx: index('idx_workflow_triggers_type').on(table.type),
	activeIdx: index('idx_workflow_triggers_active').on(table.isActive),
	nextTriggerIdx: index('idx_workflow_triggers_next_trigger').on(table.nextTrigger)
}));

export const workflowExecutions = sqliteTable('workflow_executions', {
	id: text('id').primaryKey(),
	workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
	status: text('status', { 
		enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] 
	}).notNull().default('pending'),
	priority: text('priority', { enum: ['low', 'normal', 'high'] }).notNull().default('normal'),
	parameters: text('parameters', { mode: 'json' }),
	results: text('results', { mode: 'json' }),
	error: text('error'),
	triggeredBy: text('triggered_by').references(() => user.id),
	startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
	completedAt: integer('completed_at', { mode: 'timestamp' }),
	duration: integer('duration'), // milliseconds
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	workflowIdIdx: index('idx_workflow_executions_workflow_id').on(table.workflowId),
	statusIdx: index('idx_workflow_executions_status').on(table.status),
	startedAtIdx: index('idx_workflow_executions_started_at').on(table.startedAt)
}));

export const workflowStepExecutions = sqliteTable('workflow_step_executions', {
	id: text('id').primaryKey(),
	executionId: text('execution_id').notNull().references(() => workflowExecutions.id, { onDelete: 'cascade' }),
	stepId: text('step_id').notNull().references(() => workflowSteps.id),
	status: text('status', { 
		enum: ['pending', 'running', 'completed', 'failed', 'skipped'] 
	}).notNull().default('pending'),
	input: text('input', { mode: 'json' }),
	output: text('output', { mode: 'json' }),
	error: text('error'),
	startedAt: integer('started_at', { mode: 'timestamp' }),
	completedAt: integer('completed_at', { mode: 'timestamp' }),
	duration: integer('duration'), // milliseconds
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	executionIdIdx: index('idx_workflow_step_executions_execution_id').on(table.executionId),
	stepIdIdx: index('idx_workflow_step_executions_step_id').on(table.stepId),
	statusIdx: index('idx_workflow_step_executions_status').on(table.status)
}));

// ========================================
// CONNECTOR MANAGEMENT TABLES
// ========================================

export const connectors = sqliteTable('connectors', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	type: text('type', { 
		enum: ['ai_model', 'database', 'api', 'file_system', 'hardware', 'service'] 
	}).notNull(),
	status: text('status', { 
		enum: ['connected', 'disconnected', 'error', 'configuring'] 
	}).notNull().default('disconnected'),
	health: text('health', { enum: ['healthy', 'degraded', 'down'] }).notNull().default('down'),
	description: text('description'),
	configuration: text('configuration', { mode: 'json' }).notNull(),
	capabilities: text('capabilities', { mode: 'json' }).notNull(), // Array of capabilities
	version: text('version'),
	lastConnected: integer('last_connected', { mode: 'timestamp' }),
	lastHeartbeat: integer('last_heartbeat', { mode: 'timestamp' }),
	errorCount: integer('error_count').notNull().default(0),
	createdBy: text('created_by').notNull().references(() => user.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	statusIdx: index('idx_connectors_status').on(table.status),
	typeIdx: index('idx_connectors_type').on(table.type),
	healthIdx: index('idx_connectors_health').on(table.health),
	nameIdx: index('idx_connectors_name').on(table.name)
}));

export const connectorLogs = sqliteTable('connector_logs', {
	id: text('id').primaryKey(),
	connectorId: text('connector_id').notNull().references(() => connectors.id, { onDelete: 'cascade' }),
	level: text('level', { enum: ['debug', 'info', 'warn', 'error', 'fatal'] }).notNull(),
	message: text('message').notNull(),
	metadata: text('metadata', { mode: 'json' }),
	correlationId: text('correlation_id'),
	timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	connectorIdIdx: index('idx_connector_logs_connector_id').on(table.connectorId),
	levelIdx: index('idx_connector_logs_level').on(table.level),
	timestampIdx: index('idx_connector_logs_timestamp').on(table.timestamp),
	correlationIdIdx: index('idx_connector_logs_correlation_id').on(table.correlationId)
}));

export const connectorMetrics = sqliteTable('connector_metrics', {
	id: text('id').primaryKey(),
	connectorId: text('connector_id').notNull().references(() => connectors.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	value: real('value').notNull(),
	unit: text('unit').notNull(),
	category: text('category', { 
		enum: ['cpu', 'memory', 'disk', 'network', 'sensor', 'actuator', 'system'] 
	}).notNull(),
	threshold: real('threshold'),
	status: text('status', { enum: ['normal', 'warning', 'critical'] }).notNull().default('normal'),
	tags: text('tags', { mode: 'json' }), // Key-value pairs
	timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	connectorIdIdx: index('idx_connector_metrics_connector_id').on(table.connectorId),
	nameIdx: index('idx_connector_metrics_name').on(table.name),
	categoryIdx: index('idx_connector_metrics_category').on(table.category),
	timestampIdx: index('idx_connector_metrics_timestamp').on(table.timestamp),
	statusIdx: index('idx_connector_metrics_status').on(table.status)
}));

// ========================================
// MESSAGING AND CHAT TABLES
// ========================================

export const messages = sqliteTable('messages', {
	id: text('id').primaryKey(),
	type: text('type', { enum: ['user', 'assistant', 'system', 'error'] }).notNull(),
	content: text('content').notNull(),
	userId: text('user_id').references(() => user.id),
	workflowId: text('workflow_id').references(() => workflows.id),
	threadId: text('thread_id'),
	replyTo: text('reply_to').references(() => messages.id),
	metadata: text('metadata', { mode: 'json' }), // tokens, model, temperature, etc.
	editedAt: integer('edited_at', { mode: 'timestamp' }),
	timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	typeIdx: index('idx_messages_type').on(table.type),
	userIdIdx: index('idx_messages_user_id').on(table.userId),
	workflowIdIdx: index('idx_messages_workflow_id').on(table.workflowId),
	threadIdIdx: index('idx_messages_thread_id').on(table.threadId),
	timestampIdx: index('idx_messages_timestamp').on(table.timestamp)
}));

export const messageAttachments = sqliteTable('message_attachments', {
	id: text('id').primaryKey(),
	messageId: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
	type: text('type', { enum: ['file', 'image', 'code', 'link', 'data'] }).notNull(),
	name: text('name').notNull(),
	url: text('url'),
	content: text('content'),
	metadata: text('metadata', { mode: 'json' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	messageIdIdx: index('idx_message_attachments_message_id').on(table.messageId),
	typeIdx: index('idx_message_attachments_type').on(table.type)
}));

export const messageReactions = sqliteTable('message_reactions', {
	id: text('id').primaryKey(),
	messageId: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	emoji: text('emoji').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	messageUserEmojiIdx: unique('unique_message_user_emoji').on(table.messageId, table.userId, table.emoji),
	messageIdIdx: index('idx_message_reactions_message_id').on(table.messageId),
	userIdIdx: index('idx_message_reactions_user_id').on(table.userId)
}));

// ========================================
// FILE MANAGEMENT TABLES
// ========================================

export const files = sqliteTable('files', {
	id: text('id').primaryKey(),
	filename: text('filename').notNull(),
	originalName: text('original_name').notNull(),
	path: text('path').notNull(),
	mimeType: text('mime_type').notNull(),
	size: integer('size').notNull(),
	checksum: text('checksum').notNull(),
	url: text('url'),
	tags: text('tags', { mode: 'json' }), // Array of strings
	metadata: text('metadata', { mode: 'json' }),
	uploadedBy: text('uploaded_by').notNull().references(() => user.id),
	uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	filenameIdx: index('idx_files_filename').on(table.filename),
	pathIdx: index('idx_files_path').on(table.path),
	mimeTypeIdx: index('idx_files_mime_type').on(table.mimeType),
	uploadedByIdx: index('idx_files_uploaded_by').on(table.uploadedBy),
	checksumIdx: unique('unique_file_checksum').on(table.checksum)
}));

// ========================================
// ANALYTICS AND MONITORING TABLES
// ========================================

export const alerts = sqliteTable('alerts', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	severity: text('severity', { enum: ['info', 'warning', 'error', 'critical'] }).notNull(),
	status: text('status', { enum: ['active', 'acknowledged', 'resolved'] }).notNull().default('active'),
	source: text('source').notNull(),
	assignee: text('assignee').references(() => user.id),
	metadata: text('metadata', { mode: 'json' }),
	acknowledgedBy: text('acknowledged_by').references(() => user.id),
	acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
	resolvedBy: text('resolved_by').references(() => user.id),
	resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	severityIdx: index('idx_alerts_severity').on(table.severity),
	statusIdx: index('idx_alerts_status').on(table.status),
	sourceIdx: index('idx_alerts_source').on(table.source),
	assigneeIdx: index('idx_alerts_assignee').on(table.assignee),
	createdAtIdx: index('idx_alerts_created_at').on(table.createdAt)
}));

export const metrics = sqliteTable('metrics', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	value: real('value').notNull(),
	unit: text('unit').notNull(),
	tags: text('tags', { mode: 'json' }), // Key-value pairs
	source: text('source').notNull(),
	timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	nameIdx: index('idx_metrics_name').on(table.name),
	sourceIdx: index('idx_metrics_source').on(table.source),
	timestampIdx: index('idx_metrics_timestamp').on(table.timestamp),
	nameTimestampIdx: index('idx_metrics_name_timestamp').on(table.name, table.timestamp)
}));

export const systemLogs = sqliteTable('system_logs', {
	id: text('id').primaryKey(),
	level: text('level', { enum: ['debug', 'info', 'warn', 'error', 'fatal'] }).notNull(),
	message: text('message').notNull(),
	source: text('source').notNull(),
	metadata: text('metadata', { mode: 'json' }),
	correlationId: text('correlation_id'),
	userId: text('user_id').references(() => user.id),
	timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	levelIdx: index('idx_system_logs_level').on(table.level),
	sourceIdx: index('idx_system_logs_source').on(table.source),
	timestampIdx: index('idx_system_logs_timestamp').on(table.timestamp),
	correlationIdIdx: index('idx_system_logs_correlation_id').on(table.correlationId),
	userIdIdx: index('idx_system_logs_user_id').on(table.userId)
}));

// ========================================
// AUTOMATION TABLES
// ========================================

export const automationRules = sqliteTable('automation_rules', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	trigger: text('trigger', { mode: 'json' }).notNull(), // AutomationTrigger
	conditions: text('conditions', { mode: 'json' }).notNull(), // Array of AutomationCondition
	actions: text('actions', { mode: 'json' }).notNull(), // Array of AutomationAction
	executionCount: integer('execution_count').notNull().default(0),
	lastExecuted: integer('last_executed', { mode: 'timestamp' }),
	createdBy: text('created_by').notNull().references(() => user.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	nameIdx: index('idx_automation_rules_name').on(table.name),
	activeIdx: index('idx_automation_rules_active').on(table.isActive),
	createdByIdx: index('idx_automation_rules_created_by').on(table.createdBy)
}));

// ========================================
// PROJECTS AND TASKS TABLES
// ========================================

export const projects = sqliteTable('projects', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	status: text('status', { enum: ['active', 'inactive', 'archived'] }).notNull().default('active'),
	settings: text('settings', { mode: 'json' }).notNull(),
	createdBy: text('created_by').notNull().references(() => user.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	nameIdx: index('idx_projects_name').on(table.name),
	statusIdx: index('idx_projects_status').on(table.status),
	createdByIdx: index('idx_projects_created_by').on(table.createdBy)
}));

export const tasks = sqliteTable('tasks', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	status: text('status', { enum: ['pending', 'in_progress', 'completed', 'cancelled'] }).notNull().default('pending'),
	priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('medium'),
	projectId: text('project_id').references(() => projects.id),
	workflowId: text('workflow_id').references(() => workflows.id),
	assignedTo: text('assigned_to').references(() => user.id),
	createdBy: text('created_by').notNull().references(() => user.id),
	dueDate: integer('due_date', { mode: 'timestamp' }),
	completedAt: integer('completed_at', { mode: 'timestamp' }),
	metadata: text('metadata', { mode: 'json' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(Date.now())
}, (table) => ({
	statusIdx: index('idx_tasks_status').on(table.status),
	priorityIdx: index('idx_tasks_priority').on(table.priority),
	projectIdIdx: index('idx_tasks_project_id').on(table.projectId),
	assignedToIdx: index('idx_tasks_assigned_to').on(table.assignedTo),
	createdByIdx: index('idx_tasks_created_by').on(table.createdBy),
	dueDateIdx: index('idx_tasks_due_date').on(table.dueDate)
}));

// ========================================
// RELATIONSHIPS
// ========================================

export const userRelations = relations(user, ({ many, one }) => ({
	sessions: many(session),
	preferences: one(userPreferences),
	permissions: many(userPermissions),
	createdWorkflows: many(workflows),
	createdConnectors: many(connectors),
	uploadedFiles: many(files),
	sentMessages: many(messages),
	messageReactions: many(messageReactions),
	assignedTasks: many(tasks, { relationName: 'assignedTasks' }),
	createdTasks: many(tasks, { relationName: 'createdTasks' }),
	createdProjects: many(projects),
	automationRules: many(automationRules)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
	user: one(user, {
		fields: [userPreferences.userId],
		references: [user.id]
	})
}));

export const workflowRelations = relations(workflows, ({ one, many }) => ({
	creator: one(user, {
		fields: [workflows.createdBy],
		references: [user.id]
	}),
	steps: many(workflowSteps),
	triggers: many(workflowTriggers),
	executions: many(workflowExecutions),
	messages: many(messages),
	tasks: many(tasks)
}));

export const workflowStepRelations = relations(workflowSteps, ({ one, many }) => ({
	workflow: one(workflows, {
		fields: [workflowSteps.workflowId],
		references: [workflows.id]
	}),
	executions: many(workflowStepExecutions)
}));

export const workflowExecutionRelations = relations(workflowExecutions, ({ one, many }) => ({
	workflow: one(workflows, {
		fields: [workflowExecutions.workflowId],
		references: [workflows.id]
	}),
	triggeredBy: one(user, {
		fields: [workflowExecutions.triggeredBy],
		references: [user.id]
	}),
	stepExecutions: many(workflowStepExecutions)
}));

export const connectorRelations = relations(connectors, ({ one, many }) => ({
	creator: one(user, {
		fields: [connectors.createdBy],
		references: [user.id]
	}),
	logs: many(connectorLogs),
	metrics: many(connectorMetrics)
}));

export const messageRelations = relations(messages, ({ one, many }) => ({
	user: one(user, {
		fields: [messages.userId],
		references: [user.id]
	}),
	workflow: one(workflows, {
		fields: [messages.workflowId],
		references: [workflows.id]
	}),
	replyToMessage: one(messages, {
		fields: [messages.replyTo],
		references: [messages.id],
		relationName: 'messageReplies'
	}),
	replies: many(messages, { relationName: 'messageReplies' }),
	attachments: many(messageAttachments),
	reactions: many(messageReactions)
}));

export const taskRelations = relations(tasks, ({ one }) => ({
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
	workflow: one(workflows, {
		fields: [tasks.workflowId],
		references: [workflows.id]
	}),
	assignedUser: one(user, {
		fields: [tasks.assignedTo],
		references: [user.id],
		relationName: 'assignedTasks'
	}),
	creator: one(user, {
		fields: [tasks.createdBy],
		references: [user.id],
		relationName: 'createdTasks'
	})
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
	creator: one(user, {
		fields: [projects.createdBy],
		references: [user.id]
	}),
	tasks: many(tasks)
}));

export const fileRelations = relations(files, ({ one }) => ({
	uploader: one(user, {
		fields: [files.uploadedBy],
		references: [user.id]
	})
}));

// ========================================
// TYPE EXPORTS
// ========================================

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

export type UserPermission = typeof userPermissions.$inferSelect;
export type NewUserPermission = typeof userPermissions.$inferInsert;

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type NewWorkflowStep = typeof workflowSteps.$inferInsert;

export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;
export type NewWorkflowTrigger = typeof workflowTriggers.$inferInsert;

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;

export type WorkflowStepExecution = typeof workflowStepExecutions.$inferSelect;
export type NewWorkflowStepExecution = typeof workflowStepExecutions.$inferInsert;

export type Connector = typeof connectors.$inferSelect;
export type NewConnector = typeof connectors.$inferInsert;

export type ConnectorLog = typeof connectorLogs.$inferSelect;
export type NewConnectorLog = typeof connectorLogs.$inferInsert;

export type ConnectorMetric = typeof connectorMetrics.$inferSelect;
export type NewConnectorMetric = typeof connectorMetrics.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type NewMessageAttachment = typeof messageAttachments.$inferInsert;

export type MessageReaction = typeof messageReactions.$inferSelect;
export type NewMessageReaction = typeof messageReactions.$inferInsert;

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export type Metric = typeof metrics.$inferSelect;
export type NewMetric = typeof metrics.$inferInsert;

export type SystemLog = typeof systemLogs.$inferSelect;
export type NewSystemLog = typeof systemLogs.$inferInsert;

export type AutomationRule = typeof automationRules.$inferSelect;
export type NewAutomationRule = typeof automationRules.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

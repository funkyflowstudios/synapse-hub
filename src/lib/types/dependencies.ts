// Component dependency map and architectural boundaries
// Defines clear hierarchies, import rules, and component relationships

import type { ComponentType } from './ui';

// ==============================================
// COMPONENT DEPENDENCY ARCHITECTURE
// ==============================================

export interface ComponentDependencyMap {
  layers: ArchitecturalLayer[];
  components: ComponentDefinition[];
  dependencies: ComponentDependency[];
  importRules: ImportRule[];
  boundaries: ArchitecturalBoundary[];
  violations: DependencyViolation[];
}

export interface ArchitecturalLayer {
  name: string;
  level: number;
  description: string;
  allowedDependencies: string[]; // layer names this layer can depend on
  restrictions: LayerRestriction[];
  components: string[]; // component names in this layer
}

export enum LayerLevel {
  PRESENTATION = 1,    // UI Components, Panels
  APPLICATION = 2,     // Stores, Services, Business Logic
  DOMAIN = 3,          // Core Types, Entities, Workflows
  INFRASTRUCTURE = 4,  // Database, API, External Services
  FRAMEWORK = 5        // Svelte, Third-party Libraries
}

export interface LayerRestriction {
  type: RestrictionType;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export enum RestrictionType {
  NO_IMPORT = 'no_import',
  CONDITIONAL_IMPORT = 'conditional_import',
  INTERFACE_ONLY = 'interface_only',
  ASYNC_ONLY = 'async_only'
}

export interface ComponentDefinition {
  name: string;
  path: string;
  type: ComponentArchType;
  layer: string;
  exports: ComponentExport[];
  imports: ComponentImport[];
  dependencies: string[];
  dependents: string[];
  size: ComponentSize;
  complexity: ComponentComplexity;
  stability: ComponentStability;
}

export enum ComponentArchType {
  // Presentation Layer
  PAGE = 'page',
  PANEL = 'panel',
  COMPONENT = 'component',
  LAYOUT = 'layout',
  WIDGET = 'widget',
  
  // Application Layer
  STORE = 'store',
  SERVICE = 'service',
  CONTROLLER = 'controller',
  MIDDLEWARE = 'middleware',
  UTILITY = 'utility',
  
  // Domain Layer
  ENTITY = 'entity',
  VALUE_OBJECT = 'value_object',
  AGGREGATE = 'aggregate',
  DOMAIN_SERVICE = 'domain_service',
  REPOSITORY = 'repository',
  
  // Infrastructure Layer
  API_CLIENT = 'api_client',
  DATABASE = 'database',
  CONNECTOR = 'connector',
  EXTERNAL_SERVICE = 'external_service',
  ADAPTER = 'adapter',
  
  // Framework Layer
  FRAMEWORK = 'framework',
  LIBRARY = 'library',
  PLUGIN = 'plugin',
  CONFIGURATION = 'configuration'
}

export interface ComponentExport {
  name: string;
  type: ExportType;
  public: boolean;
  deprecated: boolean;
  description?: string;
}

export enum ExportType {
  DEFAULT = 'default',
  NAMED = 'named',
  TYPE = 'type',
  INTERFACE = 'interface',
  CLASS = 'class',
  FUNCTION = 'function',
  CONSTANT = 'constant'
}

export interface ComponentImport {
  source: string;
  imports: string[];
  type: ImportType;
  conditional: boolean;
  lazy: boolean;
}

export enum ImportType {
  ES6_IMPORT = 'es6_import',
  DYNAMIC_IMPORT = 'dynamic_import',
  TYPE_IMPORT = 'type_import',
  SIDE_EFFECT = 'side_effect'
}

export interface ComponentSize {
  linesOfCode: number;
  complexity: number;
  dependencies: number;
  exports: number;
}

export interface ComponentComplexity {
  cyclomatic: number;
  cognitive: number;
  nesting: number;
  fanIn: number;
  fanOut: number;
}

export interface ComponentStability {
  abstractness: number; // 0-1
  instability: number; // 0-1
  distance: number; // 0-1
  changeFrequency: number;
  bugCount: number;
}

// ==============================================
// DEPENDENCY RULES AND VALIDATION
// ==============================================

export interface ComponentDependency {
  from: string;
  to: string;
  type: DependencyType;
  relationship: DependencyRelationship;
  strength: DependencyStrength;
  direction: DependencyDirection;
  required: boolean;
  transitive: boolean;
}

export enum DependencyType {
  IMPORT = 'import',
  INHERITANCE = 'inheritance',
  COMPOSITION = 'composition',
  AGGREGATION = 'aggregation',
  USAGE = 'usage',
  INSTANTIATION = 'instantiation',
  METHOD_CALL = 'method_call',
  EVENT = 'event'
}

export enum DependencyRelationship {
  USES = 'uses',
  EXTENDS = 'extends',
  IMPLEMENTS = 'implements',
  CONTAINS = 'contains',
  REFERENCES = 'references',
  OBSERVES = 'observes',
  CONFIGURES = 'configures'
}

export enum DependencyStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
  TIGHT = 'tight'
}

export enum DependencyDirection {
  UNIDIRECTIONAL = 'unidirectional',
  BIDIRECTIONAL = 'bidirectional',
  CIRCULAR = 'circular'
}

export interface ImportRule {
  name: string;
  pattern: string; // regex pattern
  allowed: boolean;
  message: string;
  severity: RuleSeverity;
  scope: RuleScope;
  exceptions: string[];
}

export enum RuleSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface RuleScope {
  layers: string[];
  components: string[];
  paths: string[];
  types: ComponentArchType[];
}

export interface ArchitecturalBoundary {
  name: string;
  description: string;
  includes: BoundaryDefinition;
  excludes: BoundaryDefinition;
  rules: BoundaryRule[];
  enforcement: BoundaryEnforcement;
}

export interface BoundaryDefinition {
  layers: string[];
  components: string[];
  paths: string[];
  patterns: string[];
}

export interface BoundaryRule {
  type: BoundaryRuleType;
  condition: string;
  action: BoundaryAction;
  message: string;
}

export enum BoundaryRuleType {
  CROSS_BOUNDARY_IMPORT = 'cross_boundary_import',
  BOUNDARY_VIOLATION = 'boundary_violation',
  CIRCULAR_DEPENDENCY = 'circular_dependency',
  LAYER_VIOLATION = 'layer_violation'
}

export enum BoundaryAction {
  ALLOW = 'allow',
  DENY = 'deny',
  WARN = 'warn',
  REQUIRE_INTERFACE = 'require_interface'
}

export interface BoundaryEnforcement {
  enabled: boolean;
  strictMode: boolean;
  autoFix: boolean;
  reporting: boolean;
}

export interface DependencyViolation {
  id: string;
  type: ViolationType;
  severity: RuleSeverity;
  component: string;
  dependency: string;
  rule: string;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
  timestamp: Date;
}

export enum ViolationType {
  CIRCULAR_DEPENDENCY = 'circular_dependency',
  LAYER_VIOLATION = 'layer_violation',
  FORBIDDEN_IMPORT = 'forbidden_import',
  MISSING_INTERFACE = 'missing_interface',
  TIGHT_COUPLING = 'tight_coupling',
  ARCHITECTURE_DRIFT = 'architecture_drift'
}

// ==============================================
// SPECIFIC COMPONENT HIERARCHIES
// ==============================================

export const SYNAPSE_HUB_LAYERS: ArchitecturalLayer[] = [
  {
    name: 'presentation',
    level: LayerLevel.PRESENTATION,
    description: 'UI components, panels, and user interface logic',
    allowedDependencies: ['application', 'domain'],
    restrictions: [
      {
        type: RestrictionType.NO_IMPORT,
        rule: 'infrastructure/**',
        message: 'Presentation layer cannot directly import infrastructure components',
        severity: 'error'
      }
    ],
    components: [
      'routes/**',
      'components/panels/**',
      'components/ui/**',
      'components/layout/**'
    ]
  },
  {
    name: 'application',
    level: LayerLevel.APPLICATION,
    description: 'Application services, stores, and business logic',
    allowedDependencies: ['domain', 'infrastructure'],
    restrictions: [
      {
        type: RestrictionType.INTERFACE_ONLY,
        rule: 'presentation/**',
        message: 'Application layer should only reference presentation interfaces',
        severity: 'warning'
      }
    ],
    components: [
      'lib/stores/**',
      'lib/services/**',
      'lib/utils/**'
    ]
  },
  {
    name: 'domain',
    level: LayerLevel.DOMAIN,
    description: 'Core business entities, types, and domain logic',
    allowedDependencies: [],
    restrictions: [
      {
        type: RestrictionType.NO_IMPORT,
        rule: 'infrastructure/**',
        message: 'Domain layer must remain pure and independent',
        severity: 'error'
      },
      {
        type: RestrictionType.NO_IMPORT,
        rule: 'application/**',
        message: 'Domain layer cannot depend on application layer',
        severity: 'error'
      }
    ],
    components: [
      'lib/types/**'
    ]
  },
  {
    name: 'infrastructure',
    level: LayerLevel.INFRASTRUCTURE,
    description: 'External systems, APIs, database, and connectors',
    allowedDependencies: ['domain'],
    restrictions: [
      {
        type: RestrictionType.INTERFACE_ONLY,
        rule: 'application/**',
        message: 'Infrastructure should implement application interfaces',
        severity: 'warning'
      }
    ],
    components: [
      'lib/server/**',
      'lib/api/**',
      'workers/**'
    ]
  },
  {
    name: 'framework',
    level: LayerLevel.FRAMEWORK,
    description: 'Framework code, external libraries, and configuration',
    allowedDependencies: [],
    restrictions: [],
    components: [
      'svelte.config.js',
      'vite.config.ts',
      'package.json'
    ]
  }
];

export const PANEL_DEPENDENCIES: ComponentDependency[] = [
  // Input Control Nexus Dependencies
  {
    from: 'components/panels/InputControlNexus.svelte',
    to: 'lib/stores/workflow.ts',
    type: DependencyType.IMPORT,
    relationship: DependencyRelationship.USES,
    strength: DependencyStrength.STRONG,
    direction: DependencyDirection.UNIDIRECTIONAL,
    required: true,
    transitive: false
  },
  {
    from: 'components/panels/InputControlNexus.svelte',
    to: 'lib/types/workflow.ts',
    type: DependencyType.IMPORT,
    relationship: DependencyRelationship.REFERENCES,
    strength: DependencyStrength.MEDIUM,
    direction: DependencyDirection.UNIDIRECTIONAL,
    required: true,
    transitive: false
  },
  {
    from: 'components/panels/InputControlNexus.svelte',
    to: 'components/ui/Button.svelte',
    type: DependencyType.IMPORT,
    relationship: DependencyRelationship.CONTAINS,
    strength: DependencyStrength.WEAK,
    direction: DependencyDirection.UNIDIRECTIONAL,
    required: false,
    transitive: false
  },

  // Co-Creation Canvas Dependencies
  {
    from: 'components/panels/CoCreationCanvas.svelte',
    to: 'lib/stores/message.ts',
    type: DependencyType.IMPORT,
    relationship: DependencyRelationship.USES,
    strength: DependencyStrength.STRONG,
    direction: DependencyDirection.UNIDIRECTIONAL,
    required: true,
    transitive: false
  },
  {
    from: 'components/panels/CoCreationCanvas.svelte',
    to: 'lib/types/api.ts',
    type: DependencyType.IMPORT,
    relationship: DependencyRelationship.REFERENCES,
    strength: DependencyStrength.MEDIUM,
    direction: DependencyDirection.UNIDIRECTIONAL,
    required: true,
    transitive: false
  },

  // Orchestration Foresight Dependencies  
  {
    from: 'components/panels/OrchestrationForesight.svelte',
    to: 'lib/stores/connector.ts',
    type: DependencyType.IMPORT,
    relationship: DependencyRelationship.USES,
    strength: DependencyStrength.STRONG,
    direction: DependencyDirection.UNIDIRECTIONAL,
    required: true,
    transitive: false
  },
  {
    from: 'components/panels/OrchestrationForesight.svelte',
    to: 'lib/types/connector.ts',
    type: DependencyType.IMPORT,
    relationship: DependencyRelationship.REFERENCES,
    strength: DependencyStrength.MEDIUM,
    direction: DependencyDirection.UNIDIRECTIONAL,
    required: true,
    transitive: false
  }
];

export const IMPORT_RULES: ImportRule[] = [
  {
    name: 'no-presentation-to-infrastructure',
    pattern: '^(components|routes)/.*/lib/server/',
    allowed: false,
    message: 'Presentation components cannot directly import server infrastructure',
    severity: RuleSeverity.ERROR,
    scope: {
      layers: ['presentation'],
      components: [],
      paths: ['components/**', 'routes/**'],
      types: [ComponentArchType.COMPONENT, ComponentArchType.PAGE, ComponentArchType.PANEL]
    },
    exceptions: []
  },
  {
    name: 'types-only-imports',
    pattern: '^lib/types/',
    allowed: true,
    message: 'Type imports are allowed from any layer',
    severity: RuleSeverity.INFO,
    scope: {
      layers: ['presentation', 'application', 'infrastructure'],
      components: [],
      paths: ['**/*'],
      types: []
    },
    exceptions: []
  },
  {
    name: 'no-circular-store-dependencies',
    pattern: '^lib/stores/.*lib/stores/',
    allowed: false,
    message: 'Stores should not create circular dependencies',
    severity: RuleSeverity.WARNING,
    scope: {
      layers: ['application'],
      components: [],
      paths: ['lib/stores/**'],
      types: [ComponentArchType.STORE]
    },
    exceptions: ['lib/stores/index.ts']
  },
  {
    name: 'domain-independence',
    pattern: '^lib/types/.*(lib/stores|lib/server|components)/',
    allowed: false,
    message: 'Domain types must remain independent of application and infrastructure',
    severity: RuleSeverity.ERROR,
    scope: {
      layers: ['domain'],
      components: [],
      paths: ['lib/types/**'],
      types: [ComponentArchType.ENTITY, ComponentArchType.VALUE_OBJECT]
    },
    exceptions: []
  },
  {
    name: 'server-side-only',
    pattern: '^lib/server/',
    allowed: true,
    message: 'Server imports only allowed in server-side code',
    severity: RuleSeverity.ERROR,
    scope: {
      layers: ['infrastructure'],
      components: [],
      paths: ['lib/server/**', 'workers/**'],
      types: [ComponentArchType.API_CLIENT, ComponentArchType.DATABASE, ComponentArchType.CONNECTOR]
    },
    exceptions: []
  }
];

// ==============================================
// DEPENDENCY ANALYSIS UTILITIES
// ==============================================

export interface DependencyAnalysis {
  cycles: CircularDependency[];
  violations: DependencyViolation[];
  metrics: DependencyMetrics;
  suggestions: ArchitecturalSuggestion[];
}

export interface CircularDependency {
  id: string;
  components: string[];
  path: string[];
  severity: RuleSeverity;
  impact: CycleImpact;
  suggestions: string[];
}

export enum CycleImpact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface DependencyMetrics {
  totalComponents: number;
  totalDependencies: number;
  averageDependencies: number;
  maxDependencies: number;
  circularDependencies: number;
  layerViolations: number;
  couplingMetrics: CouplingMetrics;
  cohesionMetrics: CohesionMetrics;
}

export interface CouplingMetrics {
  afferentCoupling: Map<string, number>; // fan-in
  efferentCoupling: Map<string, number>; // fan-out
  instability: Map<string, number>; // Ce / (Ca + Ce)
  abstractness: Map<string, number>;
  distance: Map<string, number>; // |A + I - 1|
}

export interface CohesionMetrics {
  functionalCohesion: Map<string, number>;
  sequentialCohesion: Map<string, number>;
  communicationalCohesion: Map<string, number>;
  proceduralCohesion: Map<string, number>;
}

export interface ArchitecturalSuggestion {
  type: SuggestionType;
  component: string;
  message: string;
  priority: SuggestionPriority;
  effort: EstimatedEffort;
  impact: SuggestionImpact;
  details: SuggestionDetails;
}

export enum SuggestionType {
  EXTRACT_INTERFACE = 'extract_interface',
  MOVE_COMPONENT = 'move_component',
  SPLIT_COMPONENT = 'split_component',
  MERGE_COMPONENTS = 'merge_components',
  INTRODUCE_ABSTRACTION = 'introduce_abstraction',
  REMOVE_DEPENDENCY = 'remove_dependency',
  INVERT_DEPENDENCY = 'invert_dependency'
}

export enum SuggestionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface EstimatedEffort {
  hours: number;
  difficulty: EffortDifficulty;
  riskLevel: RiskLevel;
}

export enum EffortDifficulty {
  TRIVIAL = 'trivial',
  EASY = 'easy',
  MODERATE = 'moderate',
  HARD = 'hard',
  VERY_HARD = 'very_hard'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface SuggestionImpact {
  maintainability: number; // -5 to +5
  performance: number; // -5 to +5
  testability: number; // -5 to +5
  reusability: number; // -5 to +5
}

export interface SuggestionDetails {
  currentState: string;
  proposedState: string;
  steps: string[];
  codeExamples: CodeExample[];
  references: string[];
}

export interface CodeExample {
  title: string;
  before: string;
  after: string;
  language: string;
}

// ==============================================
// COMPONENT CATALOG
// ==============================================

export interface ComponentCatalog {
  components: CatalogComponent[];
  categories: ComponentCategory[];
  patterns: ArchitecturalPattern[];
  standards: CodingStandard[];
}

export interface CatalogComponent {
  name: string;
  description: string;
  category: string;
  type: ComponentArchType;
  status: ComponentStatus;
  version: string;
  author: string;
  documentation: ComponentDocumentation;
  api: ComponentAPI;
  examples: ComponentExample[];
  dependencies: string[];
  tags: string[];
  metrics: ComponentMetrics;
}

export enum ComponentStatus {
  STABLE = 'stable',
  BETA = 'beta',
  ALPHA = 'alpha',
  DEPRECATED = 'deprecated',
  EXPERIMENTAL = 'experimental'
}

export interface ComponentDocumentation {
  description: string;
  purpose: string;
  usage: string;
  bestPractices: string[];
  antiPatterns: string[];
  troubleshooting: TroubleshootingSection[];
}

export interface TroubleshootingSection {
  problem: string;
  symptoms: string[];
  causes: string[];
  solutions: string[];
}

export interface ComponentAPI {
  props: APIProperty[];
  events: APIEvent[];
  slots: APISlot[];
  methods: APIMethod[];
}

export interface APIProperty {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: unknown;
  description: string;
  examples: unknown[];
}

export interface APIEvent {
  name: string;
  payload: string;
  description: string;
  when: string;
}

export interface APISlot {
  name: string;
  props: string;
  description: string;
  fallback?: string;
}

export interface APIMethod {
  name: string;
  signature: string;
  description: string;
  parameters: MethodParameter[];
  returns: string;
}

export interface MethodParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ComponentExample {
  title: string;
  description: string;
  code: string;
  props?: Record<string, unknown>;
  preview?: string;
}

export interface ComponentMetrics {
  usage: UsageMetrics;
  quality: QualityMetrics;
  maintenance: MaintenanceMetrics;
}

export interface UsageMetrics {
  usedBy: string[];
  importCount: number;
  popularity: number;
  lastUsed: Date;
}

export interface QualityMetrics {
  testCoverage: number;
  bugCount: number;
  performanceScore: number;
  accessibilityScore: number;
}

export interface MaintenanceMetrics {
  lastModified: Date;
  changeFrequency: number;
  maintainer: string;
  issueCount: number;
}

export interface ComponentCategory {
  name: string;
  description: string;
  icon: string;
  components: string[];
  subcategories: ComponentCategory[];
}

export interface ArchitecturalPattern {
  name: string;
  description: string;
  context: string;
  problem: string;
  solution: string;
  structure: PatternStructure;
  participants: PatternParticipant[];
  collaborations: PatternCollaboration[];
  consequences: PatternConsequence[];
  implementation: PatternImplementation;
  examples: PatternExample[];
  relatedPatterns: string[];
}

export interface PatternStructure {
  diagram: string;
  components: string[];
  relationships: string[];
}

export interface PatternParticipant {
  name: string;
  role: string;
  responsibilities: string[];
}

export interface PatternCollaboration {
  participants: string[];
  interaction: string;
  sequence: string[];
}

export interface PatternConsequence {
  type: ConsequenceType;
  description: string;
  impact: string;
}

export enum ConsequenceType {
  BENEFIT = 'benefit',
  DRAWBACK = 'drawback',
  TRADEOFF = 'tradeoff'
}

export interface PatternImplementation {
  languages: string[];
  frameworks: string[];
  codeSnippets: CodeSnippet[];
  guidelines: string[];
}

export interface CodeSnippet {
  language: string;
  title: string;
  code: string;
  explanation: string;
}

export interface PatternExample {
  title: string;
  context: string;
  implementation: string;
  outcome: string;
}

export interface CodingStandard {
  name: string;
  description: string;
  scope: StandardScope;
  rules: CodingRule[];
  tools: string[];
  enforcement: StandardEnforcement;
}

export interface StandardScope {
  languages: string[];
  fileTypes: string[];
  components: ComponentArchType[];
  layers: string[];
}

export interface CodingRule {
  name: string;
  description: string;
  rationale: string;
  examples: RuleExample[];
  exceptions: string[];
  enforcement: RuleEnforcement;
}

export interface RuleExample {
  title: string;
  good: string;
  bad: string;
  explanation: string;
}

export interface RuleEnforcement {
  automatic: boolean;
  tooling: string[];
  severity: RuleSeverity;
}

export interface StandardEnforcement {
  mandatory: boolean;
  exceptions: string[];
  reviewRequired: boolean;
  automated: boolean;
} 
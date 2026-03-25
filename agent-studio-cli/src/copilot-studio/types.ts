export type EvaluationMode =
  | 'csv-upload'
  | 'quick-question-set'
  | 'full-question-set'
  | 'test-chat-conversation'
  | 'manual-questions';

export type AuditSeverity = 'pass' | 'info' | 'warn' | 'fail';

export type CopilotStudioSourceKind =
  | 'unknown'
  | 'bot-create-request'
  | 'dataverse-bot-record'
  | 'botcomponents-response'
  | 'normalized-agent-definition'
  | 'merged';

export type BuiltInSchemaName =
  | 'groundtruth-audit-config'
  | 'copilot-studio-agent-definition'
  | 'copilot-studio-environment-summary';

export interface ValidationIssue {
  path: string;
  message: string;
  expected?: string;
  actual?: unknown;
}

export interface ValidationResult<T = unknown> {
  schema: BuiltInSchemaName;
  valid: boolean;
  issues: ValidationIssue[];
  value?: T;
}

export interface GroundTruthAuditDefaults {
  mode?: 'hybrid' | 'backend' | 'direct';
  backendBaseUrl?: string;
  timeoutSeconds?: number;
  throttleLimit?: number;
  questionCount?: number;
  outputRoot?: string;
}

export interface GroundTruthAuditAgentRef {
  name: string;
  botId?: string;
  pvaBotId?: string;
  schemaName?: string;
  published?: boolean;
  publishedOn?: string;
  dlTokenEndpoint?: string;
  studioUrl?: string;
}

export interface CopilotStudioEnvironmentContext {
  name?: string;
  environmentId?: string;
  organizationId?: string;
  orgUrl?: string;
  instanceAliases?: readonly string[];
  gatewayUrl?: string;
  runtimeUrl?: string;
  tenantId?: string;
}

export interface GroundTruthAuditEnvironment extends CopilotStudioEnvironmentContext {
  name: string;
  orgUrl: string;
  agents?: readonly GroundTruthAuditAgentRef[];
}

export interface GroundTruthAuditConfig {
  $schema?: string;
  defaults?: GroundTruthAuditDefaults;
  environments: readonly GroundTruthAuditEnvironment[];
}

export interface CopilotStudioConversationContent {
  displayName?: string;
  description?: string;
  instructions?: string;
  conversationStarters: string[];
  capabilityNames: string[];
}

export interface CopilotStudioAISettings {
  useModelKnowledge?: boolean;
  isFileAnalysisEnabled?: boolean;
  isSemanticSearchEnabled?: boolean;
  optInUseLatestModels?: boolean;
  modelNameHint?: string;
}

export interface CopilotStudioEvaluationSupport {
  supportedModes: EvaluationMode[];
  quickQuestionCount: number;
  fullQuestionCountMax: number;
  supportsBatchGeneration: boolean;
  source: 'image-mapped-default';
}

export interface CopilotStudioAgentAuditMatch {
  environmentName: string;
  agentName: string;
  hasDirectLineEndpoint: boolean;
  hasStudioUrl: boolean;
}

export interface CopilotStudioAgentDefinition {
  source: CopilotStudioSourceKind;
  name: string;
  schemaName?: string;
  botId?: string;
  pvaBotId?: string;
  template?: string;
  language?: number;
  authenticationMode?: string;
  rawAuthenticationMode?: string | number;
  authenticationTrigger?: string;
  rawAuthenticationTrigger?: string | number;
  accessControlPolicy?: string;
  rawAccessControlPolicy?: string | number;
  published?: boolean;
  publishedOn?: string;
  publishState?: string;
  provisioningStatus?: string;
  synchronizationState?: string;
  runtimeProvider?: string;
  isCustomizable?: boolean;
  isManaged?: boolean;
  isAgentConnectable?: boolean;
  iconBase64Present: boolean;
  channels: string[];
  connectors: string[];
  knowledgeSources: string[];
  recognizerKind?: string;
  conversation: CopilotStudioConversationContent;
  aiSettings?: CopilotStudioAISettings;
  evaluation: CopilotStudioEvaluationSupport;
  environment?: CopilotStudioEnvironmentContext;
  auditConfigMatch?: CopilotStudioAgentAuditMatch;
}

export interface CopilotStudioEnvironmentMetrics {
  agentsInEnvironment: number;
  provisioned: number;
  published: number;
  questionsGenerated: number;
}

export interface CopilotStudioEnvironmentAgentRow {
  name: string;
  schemaName: string;
  status?: string;
  publishState?: string;
  publishedOn?: string;
}

export interface CopilotStudioEnvironmentSummary {
  environmentName?: string;
  metrics: CopilotStudioEnvironmentMetrics;
  evaluation: {
    batchScope: 'all-agents' | 'selected-agents';
    questionsPerAgentDefault: number;
    supportedModes: EvaluationMode[];
  };
  agents: CopilotStudioEnvironmentAgentRow[];
}

export interface AuditFinding {
  checkId: string;
  severity: AuditSeverity;
  message: string;
  path?: string;
  expected?: string;
  actual?: unknown;
}

export interface AgentAuditSummary {
  pass: number;
  info: number;
  warn: number;
  fail: number;
  overallSeverity: AuditSeverity;
}

export interface AgentAuditReport {
  agent: CopilotStudioAgentDefinition;
  findings: AuditFinding[];
  summary: AgentAuditSummary;
  configValidation?: ValidationResult<GroundTruthAuditConfig>;
}

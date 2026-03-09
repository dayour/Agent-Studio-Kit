// Agent spec types extracted from Elevate for CLI-based agent generation

export interface AgentCapability {
  name: string;
  type: 'knowledge' | 'action' | 'connector' | 'trigger';
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'ai-action' | 'agent' | 'condition' | 'action';
  label: string;
  icon?: string;
  connector?: string;
  config?: Record<string, unknown>;
  branch?: 'true' | 'false';
}

export interface KnowledgeConfig {
  files: FileUpload[];
  webSearch: boolean;
  specificSources: boolean;
  referenceOrgChart: boolean;
  customAPIs: APIConnection[];
}

export interface FileUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export interface APIConnection {
  id: string;
  name: string;
  endpoint: string;
  enabled: boolean;
}

export interface AgentConfig {
  id: string;
  type: 'agent' | 'workflow' | 'placeholder';
  name: string;
  icon?: string;
  iconKey?: string;
  gradientKey?: string;
  description: string;
  purpose: string;
  audience?: 'customers' | 'employees' | null;
  channel?: string;
  agentType?: 'CA' | 'DA';
  guidelines: string[];
  skills: string[];
  model: string;
  knowledge: KnowledgeConfig;
  instructions: string;
  capabilities?: AgentCapability[];
  workflowNodes?: WorkflowNode[];
  published: boolean;
  version?: string;
  createdAt: Date;

  // Copilot Studio integration
  copilotStudioBotId?: string;
  copilotStudioSchemaName?: string;
  copilotStudioEnvId?: string;
  copilotStudioOrgUrl?: string;
  copilotStudioUploadedAt?: Date;
}

export interface AgentSpec {
  name: string;
  description: string;
  purpose: string;
  instructions: string;
  capabilities: AgentCapability[];
  iconKey?: string;
  gradientKey?: string;
}

export interface LLMIntentResult {
  type: 'agent' | 'workflow' | 'unclear';
  audience?: 'customers' | 'employees';
  confidence: 'high' | 'medium' | 'low';
  confidenceReason: string;
  channel?: string;
  agentType?: 'CA' | 'DA';
  suggestedName?: string;
  suggestedDescription?: string;
  suggestedInstructions?: string;
  iconKey?: string;
  gradientKey?: string;
}

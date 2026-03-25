export const evaluationModes = [
  'csv-upload',
  'quick-question-set',
  'full-question-set',
  'test-chat-conversation',
  'manual-questions',
] as const;

export const groundTruthAuditConfigSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: './groundtruth-audit.schema.json',
  title: 'Copilot Studio Ground Truth Audit Config',
  description: 'Configuration schema for local and hybrid Copilot Studio ground-truth auditing.',
  type: 'object',
  additionalProperties: false,
  properties: {
    $schema: { type: 'string' },
    defaults: {
      type: 'object',
      additionalProperties: false,
      properties: {
        mode: {
          type: 'string',
          enum: ['hybrid', 'backend', 'direct'],
        },
        backendBaseUrl: {
          type: 'string',
          format: 'uri',
        },
        timeoutSeconds: {
          type: 'integer',
          minimum: 5,
          maximum: 600,
        },
        throttleLimit: {
          type: 'integer',
          minimum: 1,
          maximum: 16,
        },
        questionCount: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        },
        outputRoot: {
          type: 'string',
          minLength: 1,
        },
      },
    },
    environments: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          environmentId: { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' },
          organizationId: { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' },
          orgUrl: { type: 'string', format: 'uri' },
          instanceAliases: {
            type: 'array',
            items: { type: 'string', format: 'uri' },
          },
          gatewayUrl: { type: 'string', format: 'uri' },
          runtimeUrl: { type: 'string', format: 'uri' },
          tenantId: { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' },
          agents: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string', minLength: 1 },
                botId: { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' },
                pvaBotId: { type: 'string', pattern: '^[0-9a-fA-F-]{36}$' },
                schemaName: { type: 'string', minLength: 1 },
                published: { type: 'boolean' },
                publishedOn: { type: 'string', format: 'date-time' },
                dlTokenEndpoint: { type: 'string', format: 'uri' },
                studioUrl: { type: 'string', format: 'uri' },
              },
              required: ['name'],
            },
          },
        },
        required: ['name', 'orgUrl'],
      },
    },
  },
  required: ['environments'],
} as const;

export const copilotStudioAgentDefinitionSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'agent-studio://schemas/copilot-studio-agent-definition',
  title: 'Copilot Studio Agent Definition',
  description: 'Normalized Agent Studio CLI view of a Copilot Studio agent backed by Dataverse and Bot Management payloads.',
  type: 'object',
  additionalProperties: false,
  properties: {
    source: {
      type: 'string',
      enum: ['unknown', 'bot-create-request', 'dataverse-bot-record', 'botcomponents-response', 'normalized-agent-definition', 'merged'],
    },
    name: { type: 'string', minLength: 1 },
    schemaName: { type: 'string' },
    botId: { type: 'string' },
    pvaBotId: { type: 'string' },
    template: { type: 'string' },
    language: { type: 'integer' },
    authenticationMode: { type: 'string' },
    rawAuthenticationMode: {
      oneOf: [{ type: 'string' }, { type: 'integer' }],
    },
    authenticationTrigger: { type: 'string' },
    rawAuthenticationTrigger: {
      oneOf: [{ type: 'string' }, { type: 'integer' }],
    },
    accessControlPolicy: { type: 'string' },
    rawAccessControlPolicy: {
      oneOf: [{ type: 'string' }, { type: 'integer' }],
    },
    published: { type: 'boolean' },
    publishedOn: { type: 'string', format: 'date-time' },
    publishState: { type: 'string' },
    provisioningStatus: { type: 'string' },
    synchronizationState: { type: 'string' },
    runtimeProvider: { type: 'string' },
    isCustomizable: { type: 'boolean' },
    isManaged: { type: 'boolean' },
    isAgentConnectable: { type: 'boolean' },
    iconBase64Present: { type: 'boolean' },
    channels: {
      type: 'array',
      items: { type: 'string' },
    },
    connectors: {
      type: 'array',
      items: { type: 'string' },
    },
    knowledgeSources: {
      type: 'array',
      items: { type: 'string' },
    },
    recognizerKind: { type: 'string' },
    conversation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        displayName: { type: 'string' },
        description: { type: 'string' },
        instructions: { type: 'string' },
        conversationStarters: {
          type: 'array',
          items: { type: 'string' },
        },
        capabilityNames: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['conversationStarters', 'capabilityNames'],
    },
    aiSettings: {
      type: 'object',
      additionalProperties: false,
      properties: {
        useModelKnowledge: { type: 'boolean' },
        isFileAnalysisEnabled: { type: 'boolean' },
        isSemanticSearchEnabled: { type: 'boolean' },
        optInUseLatestModels: { type: 'boolean' },
        modelNameHint: { type: 'string' },
      },
    },
    evaluation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        supportedModes: {
          type: 'array',
          items: {
            type: 'string',
            enum: evaluationModes,
          },
        },
        quickQuestionCount: { type: 'integer', minimum: 1 },
        fullQuestionCountMax: { type: 'integer', minimum: 1 },
        supportsBatchGeneration: { type: 'boolean' },
        source: {
          type: 'string',
          enum: ['image-mapped-default'],
        },
      },
      required: ['supportedModes', 'quickQuestionCount', 'fullQuestionCountMax', 'supportsBatchGeneration', 'source'],
    },
    environment: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string' },
        environmentId: { type: 'string' },
        organizationId: { type: 'string' },
        orgUrl: { type: 'string', format: 'uri' },
        instanceAliases: {
          type: 'array',
          items: { type: 'string', format: 'uri' },
        },
        gatewayUrl: { type: 'string', format: 'uri' },
        runtimeUrl: { type: 'string', format: 'uri' },
        tenantId: { type: 'string' },
      },
    },
    auditConfigMatch: {
      type: 'object',
      additionalProperties: false,
      properties: {
        environmentName: { type: 'string' },
        agentName: { type: 'string' },
        hasDirectLineEndpoint: { type: 'boolean' },
        hasStudioUrl: { type: 'boolean' },
      },
      required: ['environmentName', 'agentName', 'hasDirectLineEndpoint', 'hasStudioUrl'],
    },
  },
  required: ['source', 'name', 'iconBase64Present', 'channels', 'connectors', 'knowledgeSources', 'conversation', 'evaluation'],
} as const;

export const copilotStudioEnvironmentSummarySchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'agent-studio://schemas/copilot-studio-environment-summary',
  title: 'Copilot Studio Environment Summary',
  description: 'Environment-level aggregate view mapped from the Copilot Studio evaluation dashboard and agent inventory UI.',
  type: 'object',
  additionalProperties: false,
  properties: {
    environmentName: { type: 'string' },
    metrics: {
      type: 'object',
      additionalProperties: false,
      properties: {
        agentsInEnvironment: { type: 'integer', minimum: 0 },
        provisioned: { type: 'integer', minimum: 0 },
        published: { type: 'integer', minimum: 0 },
        questionsGenerated: { type: 'integer', minimum: 0 },
      },
      required: ['agentsInEnvironment', 'provisioned', 'published', 'questionsGenerated'],
    },
    evaluation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        batchScope: {
          type: 'string',
          enum: ['all-agents', 'selected-agents'],
        },
        questionsPerAgentDefault: { type: 'integer', minimum: 1 },
        supportedModes: {
          type: 'array',
          items: {
            type: 'string',
            enum: evaluationModes,
          },
        },
      },
      required: ['batchScope', 'questionsPerAgentDefault', 'supportedModes'],
    },
    agents: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1 },
          schemaName: { type: 'string', minLength: 1 },
          status: { type: 'string' },
          publishState: { type: 'string' },
          publishedOn: { type: 'string', format: 'date-time' },
        },
        required: ['name', 'schemaName'],
      },
    },
  },
  required: ['metrics', 'evaluation', 'agents'],
} as const;

export const groundTruthAuditSampleConfig = {
  $schema: './groundtruth-audit.schema.json',
  defaults: {
    mode: 'hybrid',
    backendBaseUrl: 'http://localhost:3004',
    timeoutSeconds: 60,
    throttleLimit: 4,
    questionCount: 10,
    outputRoot: './out',
  },
  environments: [
    {
      name: 'sample',
      environmentId: '00000000-0000-0000-0000-000000000000',
      organizationId: '00000000-0000-0000-0000-000000000000',
      orgUrl: 'https://example.crm.dynamics.com/',
      gatewayUrl: 'https://powervamg.example.gateway.prod.island.powerapps.com',
      runtimeUrl: 'https://pvaruntime.example.gateway.prod.island.powerapps.com',
      tenantId: '00000000-0000-0000-0000-000000000000',
      agents: [
        {
          name: 'Sample Agent',
          botId: '00000000-0000-0000-0000-000000000001',
          pvaBotId: '00000000-0000-0000-0000-000000000002',
          schemaName: 'sample_agent',
          published: true,
          dlTokenEndpoint: 'https://powervamg.example.gateway.prod.island.powerapps.com/api/botmanagement/v1/directline/directlinetoken?botId=00000000-0000-0000-0000-000000000002',
          studioUrl: 'https://copilotstudio.microsoft.com/environments/00000000-0000-0000-0000-000000000000/bots/00000000-0000-0000-0000-000000000001/overview',
        },
      ],
    },
  ],
} as const;

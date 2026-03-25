import {
  BuiltInSchemaName,
  ValidationResult,
} from './types';
import {
  copilotStudioAgentDefinitionSchema,
  copilotStudioEnvironmentSummarySchema,
  groundTruthAuditConfigSchema,
} from './schemas';
import {
  validateCopilotStudioAgentDefinition,
  validateCopilotStudioEnvironmentSummary,
  validateGroundTruthAuditConfig,
} from './validators';

interface RegisteredSchema {
  name: BuiltInSchemaName;
  title: string;
  description: string;
  jsonSchema: Record<string, unknown>;
  validate: (value: unknown) => ValidationResult;
}

const schemaRegistry: Record<BuiltInSchemaName, RegisteredSchema> = {
  'groundtruth-audit-config': {
    name: 'groundtruth-audit-config',
    title: 'Ground Truth Audit Config',
    description: 'Hybrid/direct/backend audit configuration with environment and agent identity mapping.',
    jsonSchema: groundTruthAuditConfigSchema as unknown as Record<string, unknown>,
    validate: validateGroundTruthAuditConfig,
  },
  'copilot-studio-agent-definition': {
    name: 'copilot-studio-agent-definition',
    title: 'Copilot Studio Agent Definition',
    description: 'Normalized Copilot Studio agent definition derived from Dataverse and Bot Management payloads.',
    jsonSchema: copilotStudioAgentDefinitionSchema as unknown as Record<string, unknown>,
    validate: validateCopilotStudioAgentDefinition,
  },
  'copilot-studio-environment-summary': {
    name: 'copilot-studio-environment-summary',
    title: 'Copilot Studio Environment Summary',
    description: 'Environment aggregate metrics and agent inventory model aligned to the evaluation dashboard UI.',
    jsonSchema: copilotStudioEnvironmentSummarySchema as unknown as Record<string, unknown>,
    validate: validateCopilotStudioEnvironmentSummary,
  },
};

export function listRegisteredSchemas(): RegisteredSchema[] {
  return Object.values(schemaRegistry);
}

export function getRegisteredSchema(name: string): RegisteredSchema | undefined {
  return schemaRegistry[name as BuiltInSchemaName];
}

export function validateRegisteredSchema(name: string, value: unknown): ValidationResult {
  const schema = getRegisteredSchema(name);
  if (!schema) {
    return {
      schema: 'groundtruth-audit-config',
      valid: false,
      issues: [
        {
          path: '$',
          message: `Unknown schema: ${name}`,
        },
      ],
    };
  }

  return schema.validate(value);
}

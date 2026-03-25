import {
  BuiltInSchemaName,
  CopilotStudioAgentDefinition,
  CopilotStudioEnvironmentSummary,
  GroundTruthAuditConfig,
  ValidationIssue,
  ValidationResult,
} from './types';
import {
  evaluationModes,
} from './schemas';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isGuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

function isDateTime(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function isUri(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function pushIssue(
  issues: ValidationIssue[],
  path: string,
  message: string,
  expected?: string,
  actual?: unknown,
): void {
  issues.push({ path, message, expected, actual });
}

function validateString(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  options: {
    required?: boolean;
    minLength?: number;
    uri?: boolean;
    guid?: boolean;
    dateTime?: boolean;
    allowedValues?: readonly string[];
  } = {},
): value is string {
  if (value === undefined || value === null) {
    if (options.required) {
      pushIssue(issues, path, 'Missing required value', 'string', value);
    }
    return false;
  }

  if (typeof value !== 'string') {
    pushIssue(issues, path, 'Expected a string', 'string', value);
    return false;
  }

  if (options.minLength !== undefined && value.length < options.minLength) {
    pushIssue(issues, path, 'String is shorter than the minimum length', `minLength ${options.minLength}`, value);
  }

  if (options.uri && !isUri(value)) {
    pushIssue(issues, path, 'Expected a valid URI', 'uri', value);
  }

  if (options.guid && !isGuid(value)) {
    pushIssue(issues, path, 'Expected a valid GUID', 'guid', value);
  }

  if (options.dateTime && !isDateTime(value)) {
    pushIssue(issues, path, 'Expected a valid date-time string', 'date-time', value);
  }

  if (options.allowedValues && !options.allowedValues.includes(value)) {
    pushIssue(
      issues,
      path,
      'Expected one of the allowed values',
      options.allowedValues.join(', '),
      value,
    );
  }

  return true;
}

function validateBoolean(value: unknown, path: string, issues: ValidationIssue[], required = false): value is boolean {
  if (value === undefined || value === null) {
    if (required) {
      pushIssue(issues, path, 'Missing required value', 'boolean', value);
    }
    return false;
  }

  if (typeof value !== 'boolean') {
    pushIssue(issues, path, 'Expected a boolean', 'boolean', value);
    return false;
  }

  return true;
}

function validateInteger(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  options: { required?: boolean; min?: number; max?: number } = {},
): value is number {
  if (value === undefined || value === null) {
    if (options.required) {
      pushIssue(issues, path, 'Missing required value', 'integer', value);
    }
    return false;
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    pushIssue(issues, path, 'Expected an integer', 'integer', value);
    return false;
  }

  if (options.min !== undefined && value < options.min) {
    pushIssue(issues, path, 'Integer is below the minimum', `>= ${options.min}`, value);
  }

  if (options.max !== undefined && value > options.max) {
    pushIssue(issues, path, 'Integer is above the maximum', `<= ${options.max}`, value);
  }

  return true;
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  options: { required?: boolean; allowedValues?: readonly string[] } = {},
): value is string[] {
  if (value === undefined || value === null) {
    if (options.required) {
      pushIssue(issues, path, 'Missing required value', 'string[]', value);
    }
    return false;
  }

  if (!Array.isArray(value)) {
    pushIssue(issues, path, 'Expected an array', 'array', value);
    return false;
  }

  value.forEach((item, index) => {
    validateString(item, `${path}[${index}]`, issues, { allowedValues: options.allowedValues });
  });

  return true;
}

function finalizeResult<T>(schema: BuiltInSchemaName, issues: ValidationIssue[], value?: T): ValidationResult<T> {
  return {
    schema,
    valid: issues.length === 0,
    issues,
    value,
  };
}

export function validateGroundTruthAuditConfig(value: unknown): ValidationResult<GroundTruthAuditConfig> {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    pushIssue(issues, '$', 'Expected an object', 'object', value);
    return finalizeResult('groundtruth-audit-config', issues);
  }

  if (value.$schema !== undefined) {
    validateString(value.$schema, '$.$schema', issues);
  }

  if (value.defaults !== undefined) {
    if (!isRecord(value.defaults)) {
      pushIssue(issues, '$.defaults', 'Expected an object', 'object', value.defaults);
    } else {
      validateString(value.defaults.mode, '$.defaults.mode', issues, {
        allowedValues: ['hybrid', 'backend', 'direct'],
      });
      validateString(value.defaults.backendBaseUrl, '$.defaults.backendBaseUrl', issues, { uri: true });
      validateInteger(value.defaults.timeoutSeconds, '$.defaults.timeoutSeconds', issues, { min: 5, max: 600 });
      validateInteger(value.defaults.throttleLimit, '$.defaults.throttleLimit', issues, { min: 1, max: 16 });
      validateInteger(value.defaults.questionCount, '$.defaults.questionCount', issues, { min: 1, max: 100 });
      validateString(value.defaults.outputRoot, '$.defaults.outputRoot', issues, { minLength: 1 });
    }
  }

  if (!Array.isArray(value.environments) || value.environments.length === 0) {
    pushIssue(issues, '$.environments', 'Expected at least one environment', 'non-empty array', value.environments);
  } else {
    value.environments.forEach((environment, index) => {
      const envPath = `$.environments[${index}]`;
      if (!isRecord(environment)) {
        pushIssue(issues, envPath, 'Expected an object', 'object', environment);
        return;
      }

      validateString(environment.name, `${envPath}.name`, issues, { required: true, minLength: 1 });
      validateString(environment.orgUrl, `${envPath}.orgUrl`, issues, { required: true, uri: true });
      validateString(environment.environmentId, `${envPath}.environmentId`, issues, { guid: true });
      validateString(environment.organizationId, `${envPath}.organizationId`, issues, { guid: true });
      validateString(environment.gatewayUrl, `${envPath}.gatewayUrl`, issues, { uri: true });
      validateString(environment.runtimeUrl, `${envPath}.runtimeUrl`, issues, { uri: true });
      validateString(environment.tenantId, `${envPath}.tenantId`, issues, { guid: true });

      if (environment.instanceAliases !== undefined) {
        if (!Array.isArray(environment.instanceAliases)) {
          pushIssue(issues, `${envPath}.instanceAliases`, 'Expected an array', 'array', environment.instanceAliases);
        } else {
          environment.instanceAliases.forEach((alias, aliasIndex) => {
            validateString(alias, `${envPath}.instanceAliases[${aliasIndex}]`, issues, { uri: true });
          });
        }
      }

      if (environment.agents !== undefined) {
        if (!Array.isArray(environment.agents)) {
          pushIssue(issues, `${envPath}.agents`, 'Expected an array', 'array', environment.agents);
        } else {
          environment.agents.forEach((agent, agentIndex) => {
            const agentPath = `${envPath}.agents[${agentIndex}]`;
            if (!isRecord(agent)) {
              pushIssue(issues, agentPath, 'Expected an object', 'object', agent);
              return;
            }

            validateString(agent.name, `${agentPath}.name`, issues, { required: true, minLength: 1 });
            validateString(agent.botId, `${agentPath}.botId`, issues, { guid: true });
            validateString(agent.pvaBotId, `${agentPath}.pvaBotId`, issues, { guid: true });
            validateString(agent.schemaName, `${agentPath}.schemaName`, issues, { minLength: 1 });
            validateBoolean(agent.published, `${agentPath}.published`, issues);
            validateString(agent.publishedOn, `${agentPath}.publishedOn`, issues, { dateTime: true });
            validateString(agent.dlTokenEndpoint, `${agentPath}.dlTokenEndpoint`, issues, { uri: true });
            validateString(agent.studioUrl, `${agentPath}.studioUrl`, issues, { uri: true });

            if (!agent.botId && !agent.schemaName) {
              pushIssue(
                issues,
                agentPath,
                'Each agent entry must provide botId or schemaName',
                'botId or schemaName',
                agent,
              );
            }
          });
        }
      }
    });
  }

  return finalizeResult('groundtruth-audit-config', issues, value as unknown as GroundTruthAuditConfig);
}

export function validateCopilotStudioAgentDefinition(value: unknown): ValidationResult<CopilotStudioAgentDefinition> {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    pushIssue(issues, '$', 'Expected an object', 'object', value);
    return finalizeResult('copilot-studio-agent-definition', issues);
  }

  validateString(value.source, '$.source', issues, {
    required: true,
    allowedValues: ['unknown', 'bot-create-request', 'dataverse-bot-record', 'botcomponents-response', 'normalized-agent-definition', 'merged'],
  });
  validateString(value.name, '$.name', issues, { required: true, minLength: 1 });
  validateBoolean(value.iconBase64Present, '$.iconBase64Present', issues, true);
  validateString(value.schemaName, '$.schemaName', issues);
  validateString(value.botId, '$.botId', issues);
  validateString(value.pvaBotId, '$.pvaBotId', issues);
  validateString(value.template, '$.template', issues);
  validateInteger(value.language, '$.language', issues);
  validateString(value.authenticationMode, '$.authenticationMode', issues);
  validateString(value.authenticationTrigger, '$.authenticationTrigger', issues);
  validateString(value.accessControlPolicy, '$.accessControlPolicy', issues);
  validateBoolean(value.published, '$.published', issues);
  validateString(value.publishedOn, '$.publishedOn', issues, { dateTime: true });
  validateString(value.publishState, '$.publishState', issues);
  validateString(value.provisioningStatus, '$.provisioningStatus', issues);
  validateString(value.synchronizationState, '$.synchronizationState', issues);
  validateString(value.runtimeProvider, '$.runtimeProvider', issues);
  validateBoolean(value.isCustomizable, '$.isCustomizable', issues);
  validateBoolean(value.isManaged, '$.isManaged', issues);
  validateBoolean(value.isAgentConnectable, '$.isAgentConnectable', issues);
  validateStringArray(value.channels, '$.channels', issues, { required: true });
  validateStringArray(value.connectors, '$.connectors', issues, { required: true });
  validateStringArray(value.knowledgeSources, '$.knowledgeSources', issues, { required: true });

  if (!isRecord(value.conversation)) {
    pushIssue(issues, '$.conversation', 'Expected an object', 'object', value.conversation);
  } else {
    validateString(value.conversation.displayName, '$.conversation.displayName', issues);
    validateString(value.conversation.description, '$.conversation.description', issues);
    validateString(value.conversation.instructions, '$.conversation.instructions', issues);
    validateStringArray(value.conversation.conversationStarters, '$.conversation.conversationStarters', issues, { required: true });
    validateStringArray(value.conversation.capabilityNames, '$.conversation.capabilityNames', issues, { required: true });
  }

  if (value.aiSettings !== undefined) {
    if (!isRecord(value.aiSettings)) {
      pushIssue(issues, '$.aiSettings', 'Expected an object', 'object', value.aiSettings);
    } else {
      validateBoolean(value.aiSettings.useModelKnowledge, '$.aiSettings.useModelKnowledge', issues);
      validateBoolean(value.aiSettings.isFileAnalysisEnabled, '$.aiSettings.isFileAnalysisEnabled', issues);
      validateBoolean(value.aiSettings.isSemanticSearchEnabled, '$.aiSettings.isSemanticSearchEnabled', issues);
      validateBoolean(value.aiSettings.optInUseLatestModels, '$.aiSettings.optInUseLatestModels', issues);
      validateString(value.aiSettings.modelNameHint, '$.aiSettings.modelNameHint', issues);
    }
  }

  if (!isRecord(value.evaluation)) {
    pushIssue(issues, '$.evaluation', 'Expected an object', 'object', value.evaluation);
  } else {
    validateStringArray(value.evaluation.supportedModes, '$.evaluation.supportedModes', issues, {
      required: true,
      allowedValues: evaluationModes,
    });
    validateInteger(value.evaluation.quickQuestionCount, '$.evaluation.quickQuestionCount', issues, {
      required: true,
      min: 1,
    });
    validateInteger(value.evaluation.fullQuestionCountMax, '$.evaluation.fullQuestionCountMax', issues, {
      required: true,
      min: 1,
    });
    validateBoolean(value.evaluation.supportsBatchGeneration, '$.evaluation.supportsBatchGeneration', issues, true);
    validateString(value.evaluation.source, '$.evaluation.source', issues, {
      required: true,
      allowedValues: ['image-mapped-default'],
    });
  }

  if (value.environment !== undefined) {
    if (!isRecord(value.environment)) {
      pushIssue(issues, '$.environment', 'Expected an object', 'object', value.environment);
    } else {
      validateString(value.environment.name, '$.environment.name', issues);
      validateString(value.environment.environmentId, '$.environment.environmentId', issues);
      validateString(value.environment.organizationId, '$.environment.organizationId', issues);
      validateString(value.environment.orgUrl, '$.environment.orgUrl', issues, { uri: true });
      if (value.environment.instanceAliases !== undefined) {
        validateStringArray(value.environment.instanceAliases, '$.environment.instanceAliases', issues);
      }
      validateString(value.environment.gatewayUrl, '$.environment.gatewayUrl', issues, { uri: true });
      validateString(value.environment.runtimeUrl, '$.environment.runtimeUrl', issues, { uri: true });
      validateString(value.environment.tenantId, '$.environment.tenantId', issues);
    }
  }

  return finalizeResult('copilot-studio-agent-definition', issues, value as unknown as CopilotStudioAgentDefinition);
}

export function validateCopilotStudioEnvironmentSummary(value: unknown): ValidationResult<CopilotStudioEnvironmentSummary> {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    pushIssue(issues, '$', 'Expected an object', 'object', value);
    return finalizeResult('copilot-studio-environment-summary', issues);
  }

  validateString(value.environmentName, '$.environmentName', issues);

  if (!isRecord(value.metrics)) {
    pushIssue(issues, '$.metrics', 'Expected an object', 'object', value.metrics);
  } else {
    validateInteger(value.metrics.agentsInEnvironment, '$.metrics.agentsInEnvironment', issues, { required: true, min: 0 });
    validateInteger(value.metrics.provisioned, '$.metrics.provisioned', issues, { required: true, min: 0 });
    validateInteger(value.metrics.published, '$.metrics.published', issues, { required: true, min: 0 });
    validateInteger(value.metrics.questionsGenerated, '$.metrics.questionsGenerated', issues, { required: true, min: 0 });
  }

  if (!isRecord(value.evaluation)) {
    pushIssue(issues, '$.evaluation', 'Expected an object', 'object', value.evaluation);
  } else {
    validateString(value.evaluation.batchScope, '$.evaluation.batchScope', issues, {
      required: true,
      allowedValues: ['all-agents', 'selected-agents'],
    });
    validateInteger(value.evaluation.questionsPerAgentDefault, '$.evaluation.questionsPerAgentDefault', issues, {
      required: true,
      min: 1,
    });
    validateStringArray(value.evaluation.supportedModes, '$.evaluation.supportedModes', issues, {
      required: true,
      allowedValues: evaluationModes,
    });
  }

  if (!Array.isArray(value.agents)) {
    pushIssue(issues, '$.agents', 'Expected an array', 'array', value.agents);
  } else {
    value.agents.forEach((agent, index) => {
      const agentPath = `$.agents[${index}]`;
      if (!isRecord(agent)) {
        pushIssue(issues, agentPath, 'Expected an object', 'object', agent);
        return;
      }

      validateString(agent.name, `${agentPath}.name`, issues, { required: true, minLength: 1 });
      validateString(agent.schemaName, `${agentPath}.schemaName`, issues, { required: true, minLength: 1 });
      validateString(agent.status, `${agentPath}.status`, issues);
      validateString(agent.publishState, `${agentPath}.publishState`, issues);
      validateString(agent.publishedOn, `${agentPath}.publishedOn`, issues, { dateTime: true });
    });
  }

  return finalizeResult('copilot-studio-environment-summary', issues, value as unknown as CopilotStudioEnvironmentSummary);
}

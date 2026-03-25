import {
  CopilotStudioAgentDefinition,
  CopilotStudioEnvironmentContext,
  CopilotStudioSourceKind,
  GroundTruthAuditAgentRef,
  GroundTruthAuditConfig,
  GroundTruthAuditEnvironment,
} from './types';
import { evaluationModes } from './schemas';

type UnknownRecord = Record<string, unknown>;

const authenticationModeMap: Record<number, string> = {
  1: 'Manual',
  2: 'Integrated',
};

const authenticationTriggerMap: Record<number, string> = {
  0: 'OnDemand',
  1: 'Always',
};

const accessControlPolicyMap: Record<number, string> = {
  0: 'Everyone',
  1: 'Readers',
};

const accessControlAliases: Record<string, string> = {
  GroupMembership: 'Readers',
  Readers: 'Readers',
  Everyone: 'Everyone',
};

const runtimeProviderMap: Record<number, string> = {
  0: 'PowerVirtualAgents',
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter((item): item is string => Boolean(item));
}

function tryParseJson<T>(value: unknown): T | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function readPath(source: unknown, path: string[]): unknown {
  let current = source;
  for (const key of path) {
    if (!isRecord(current) || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function readCandidate<T>(source: unknown, candidates: string[]): T | undefined {
  if (!isRecord(source)) {
    return undefined;
  }

  for (const candidate of candidates) {
    if (candidate in source) {
      return source[candidate] as T;
    }
  }
  return undefined;
}

function normalizeEnum(rawValue: unknown, numericMap: Record<number, string>, aliases: Record<string, string> = {}): string | undefined {
  if (typeof rawValue === 'string') {
    return aliases[rawValue] || rawValue;
  }

  if (typeof rawValue === 'number') {
    return numericMap[rawValue] || `Unknown(${rawValue})`;
  }

  return undefined;
}

function extractConfiguration(bot: UnknownRecord): UnknownRecord {
  const rawConfiguration = readCandidate<unknown>(bot, ['configuration']);
  const parsed = tryParseJson<UnknownRecord>(rawConfiguration);
  if (parsed && isRecord(parsed)) {
    return parsed;
  }
  return isRecord(rawConfiguration) ? rawConfiguration : {};
}

function extractSynchronizationStatus(bot: UnknownRecord): UnknownRecord {
  const rawStatus = readCandidate<unknown>(bot, ['synchronizationStatus', 'synchronizationstatus']);
  const parsed = tryParseJson<UnknownRecord>(rawStatus);
  if (parsed && isRecord(parsed)) {
    return parsed;
  }
  return isRecord(rawStatus) ? rawStatus : {};
}

function extractCreatePayload(source: UnknownRecord): UnknownRecord {
  const requestBody = readCandidate<unknown>(source, ['requestBody']);
  if (isRecord(requestBody)) {
    return requestBody;
  }
  return source;
}

function extractBotEntity(source: UnknownRecord): UnknownRecord {
  const responseBody = readCandidate<unknown>(source, ['responseBody']);
  if (isRecord(responseBody) && isRecord(responseBody.bot)) {
    return responseBody.bot;
  }

  if (isRecord(source.bot)) {
    return source.bot;
  }

  if (Array.isArray(source.value) && source.value.length > 0 && isRecord(source.value[0])) {
    return source.value[0];
  }

  return source;
}

function detectSourceKind(source: unknown): CopilotStudioSourceKind {
  if (!isRecord(source)) {
    return 'unknown';
  }

  if ('source' in source && 'evaluation' in source) {
    return 'normalized-agent-definition';
  }

  if (isRecord(source.requestBody) && 'schemaname' in source.requestBody) {
    return 'bot-create-request';
  }

  if (isRecord(source.responseBody) && isRecord(source.responseBody.bot)) {
    return 'botcomponents-response';
  }

  if (Array.isArray(source.value) && source.value.length > 0) {
    return 'dataverse-bot-record';
  }

  if ('schemaname' in source || 'schemaName' in source || 'botid' in source || 'cdsBotId' in source) {
    return 'dataverse-bot-record';
  }

  return 'unknown';
}

function extractCapabilityNames(rawCapabilities: unknown): string[] {
  if (!isRecord(rawCapabilities)) {
    return [];
  }

  return Object.entries(rawCapabilities)
    .filter(([key, value]) => key !== '$kind' && key !== 'diagnostics' && Boolean(value))
    .map(([key]) => key);
}

function toEnvironmentContext(environment: GroundTruthAuditEnvironment): CopilotStudioEnvironmentContext {
  return {
    name: environment.name,
    environmentId: environment.environmentId,
    organizationId: environment.organizationId,
    orgUrl: environment.orgUrl,
    instanceAliases: environment.instanceAliases,
    gatewayUrl: environment.gatewayUrl,
    runtimeUrl: environment.runtimeUrl,
    tenantId: environment.tenantId,
  };
}

function matchAuditAgent(
  config: GroundTruthAuditConfig | undefined,
  normalized: CopilotStudioAgentDefinition,
): { environment?: GroundTruthAuditEnvironment; agent?: GroundTruthAuditAgentRef } {
  if (!config) {
    return {};
  }

  for (const environment of config.environments) {
    for (const agent of environment.agents || []) {
      const matchesBotId = Boolean(normalized.botId && agent.botId && normalized.botId === agent.botId);
      const matchesSchemaName = Boolean(normalized.schemaName && agent.schemaName && normalized.schemaName === agent.schemaName);
      const matchesName = normalized.name === agent.name;
      if (matchesBotId || matchesSchemaName || matchesName) {
        return { environment, agent };
      }
    }
  }

  return {};
}

function buildBaseDefinition(source: CopilotStudioSourceKind): CopilotStudioAgentDefinition {
  return {
    source,
    name: 'Unknown Agent',
    iconBase64Present: false,
    channels: [],
    connectors: [],
    knowledgeSources: [],
    conversation: {
      conversationStarters: [],
      capabilityNames: [],
    },
    evaluation: {
      supportedModes: [...evaluationModes],
      quickQuestionCount: 10,
      fullQuestionCountMax: 100,
      supportsBatchGeneration: true,
      source: 'image-mapped-default',
    },
  };
}

function mapNormalizedAgent(source: UnknownRecord): CopilotStudioAgentDefinition {
  return {
    ...buildBaseDefinition('normalized-agent-definition'),
    ...(source as unknown as CopilotStudioAgentDefinition),
  };
}

function mapCreatePayload(source: UnknownRecord): CopilotStudioAgentDefinition {
  const payload = extractCreatePayload(source);
  const configuration = extractConfiguration(payload);
  const defaultContent = readPath(configuration, ['settings', 'default-2.1.0', 'content']);
  const defaultSpec = readPath(configuration, ['settings', 'default-2.1.0', 'spec']);
  const aiSettings = readPath(configuration, ['aISettings']);
  const gptSettings = readPath(configuration, ['gPTSettings']);
  const channels = asStringArray(readCandidate<unknown>(payload, ['channels']));
  const connectors = isRecord(defaultSpec) ? asStringArray(readCandidate<unknown>(defaultSpec, ['connectors'])) : [];
  const knowledgeSources = [
    ...asStringArray(readCandidate<unknown>(configuration, ['knowledgeSources'])),
    ...asStringArray(readCandidate<unknown>(gptSettings as UnknownRecord, ['defaultSchemaName']) ? [readCandidate<unknown>(gptSettings as UnknownRecord, ['defaultSchemaName'])] : []),
  ];

  return {
    ...buildBaseDefinition('bot-create-request'),
    name: asString(readCandidate<unknown>(payload, ['name'])) || 'Agent',
    schemaName: asString(readCandidate<unknown>(payload, ['schemaname'])),
    template: asString(readCandidate<unknown>(payload, ['template'])),
    language: asNumber(readCandidate<unknown>(payload, ['language'])),
    authenticationMode: normalizeEnum(readCandidate<unknown>(payload, ['authenticationmode']), authenticationModeMap),
    rawAuthenticationMode: readCandidate<string | number>(payload, ['authenticationmode']),
    authenticationTrigger: normalizeEnum(readCandidate<unknown>(payload, ['authenticationtrigger']), authenticationTriggerMap),
    rawAuthenticationTrigger: readCandidate<string | number>(payload, ['authenticationtrigger']),
    accessControlPolicy: normalizeEnum(readCandidate<unknown>(payload, ['accesscontrolpolicy']), accessControlPolicyMap, accessControlAliases),
    rawAccessControlPolicy: readCandidate<string | number>(payload, ['accesscontrolpolicy']),
    isCustomizable: isRecord(readCandidate<unknown>(payload, ['iscustomizable']))
      ? asBoolean(readPath(payload, ['iscustomizable', 'Value']))
      : asBoolean(readCandidate<unknown>(payload, ['iscustomizable'])),
    iconBase64Present: Boolean(asString(readCandidate<unknown>(payload, ['iconbase64']))),
    isAgentConnectable: asBoolean(readCandidate<unknown>(configuration, ['isAgentConnectable'])),
    channels,
    connectors,
    knowledgeSources,
    recognizerKind: asString(readPath(configuration, ['recognizer', '$kind'])),
    conversation: {
      displayName: asString(readPath(defaultContent, ['displayName'])),
      description: asString(readPath(defaultContent, ['description'])),
      instructions: asString(readPath(defaultContent, ['instructions'])),
      conversationStarters: asStringArray(readPath(defaultContent, ['conversationStarters'])),
      capabilityNames: extractCapabilityNames(readPath(defaultContent, ['capabilities'])),
    },
    aiSettings: isRecord(aiSettings)
      ? {
          useModelKnowledge: asBoolean(readCandidate<unknown>(aiSettings, ['useModelKnowledge'])),
          isFileAnalysisEnabled: asBoolean(readCandidate<unknown>(aiSettings, ['isFileAnalysisEnabled'])),
          isSemanticSearchEnabled: asBoolean(readCandidate<unknown>(aiSettings, ['isSemanticSearchEnabled'])),
          optInUseLatestModels: asBoolean(readCandidate<unknown>(aiSettings, ['optInUseLatestModels'])),
          modelNameHint: asString(readPath(aiSettings, ['model', 'modelNameHint'])),
        }
      : undefined,
  };
}

function mapDataverseBotRecord(source: UnknownRecord): CopilotStudioAgentDefinition {
  const bot = extractBotEntity(source);
  const configuration = extractConfiguration(bot);
  const defaultContent = readPath(configuration, ['settings', 'default-2.1.0', 'content']);
  const defaultSpec = readPath(configuration, ['settings', 'default-2.1.0', 'spec']);
  const aiSettings = readPath(configuration, ['aISettings']);
  const gptSettings = readPath(configuration, ['gPTSettings']);
  const synchronizationStatus = extractSynchronizationStatus(bot);
  const currentSyncState = readPath(synchronizationStatus, ['currentSynchronizationState']);
  const rawRuntimeProvider = readCandidate<unknown>(bot, ['runtimeProvider', 'runtimeprovider']);
  const publishState = asString(readCandidate<unknown>(currentSyncState as UnknownRecord, ['state']));
  const provisioningStatus = asString(readCandidate<unknown>(currentSyncState as UnknownRecord, ['provisioningStatus']));
  const publishedOn = asString(readCandidate<unknown>(bot, ['publishedOn', 'publishedon']));
  const channels = asStringArray(readCandidate<unknown>(configuration, ['channels']));
  const connectors = isRecord(defaultSpec) ? asStringArray(readCandidate<unknown>(defaultSpec, ['connectors'])) : [];
  const knowledgeSources = [
    ...asStringArray(readCandidate<unknown>(configuration, ['knowledgeSources'])),
    ...asStringArray(readCandidate<unknown>(gptSettings as UnknownRecord, ['defaultSchemaName']) ? [readCandidate<unknown>(gptSettings as UnknownRecord, ['defaultSchemaName'])] : []),
  ];

  return {
    ...buildBaseDefinition('dataverse-bot-record'),
    name: asString(readCandidate<unknown>(bot, ['displayName', 'name'])) || 'Agent',
    schemaName: asString(readCandidate<unknown>(bot, ['schemaName', 'schemaname'])),
    botId: asString(readCandidate<unknown>(bot, ['cdsBotId', 'botid'])),
    template: asString(readCandidate<unknown>(bot, ['template'])),
    language: asNumber(readCandidate<unknown>(bot, ['language'])),
    authenticationMode: normalizeEnum(readCandidate<unknown>(bot, ['authenticationMode', 'authenticationmode']), authenticationModeMap),
    rawAuthenticationMode: readCandidate<string | number>(bot, ['authenticationMode', 'authenticationmode']),
    authenticationTrigger: normalizeEnum(readCandidate<unknown>(bot, ['authenticationTrigger', 'authenticationtrigger']), authenticationTriggerMap),
    rawAuthenticationTrigger: readCandidate<string | number>(bot, ['authenticationTrigger', 'authenticationtrigger']),
    accessControlPolicy: normalizeEnum(readCandidate<unknown>(bot, ['accessControlPolicy', 'accesscontrolpolicy']), accessControlPolicyMap, accessControlAliases),
    rawAccessControlPolicy: readCandidate<string | number>(bot, ['accessControlPolicy', 'accesscontrolpolicy']),
    published: publishedOn !== undefined || asBoolean(readCandidate<unknown>(bot, ['published'])),
    publishedOn,
    publishState,
    provisioningStatus,
    synchronizationState: asString(readCandidate<unknown>(currentSyncState as UnknownRecord, ['state'])),
    runtimeProvider: typeof rawRuntimeProvider === 'number' ? runtimeProviderMap[rawRuntimeProvider] || `Unknown(${rawRuntimeProvider})` : asString(rawRuntimeProvider),
    isCustomizable: isRecord(readCandidate<unknown>(bot, ['managedProperties']))
      ? asBoolean(readPath(bot, ['managedProperties', 'isCustomizable']))
      : isRecord(readCandidate<unknown>(bot, ['iscustomizable']))
      ? asBoolean(readPath(bot, ['iscustomizable', 'Value']))
      : asBoolean(readCandidate<unknown>(bot, ['iscustomizable'])),
    isManaged: asBoolean(readCandidate<unknown>(bot, ['isManaged', 'ismanaged'])),
    isAgentConnectable: asBoolean(readCandidate<unknown>(configuration, ['isAgentConnectable'])),
    iconBase64Present: Boolean(asString(readCandidate<unknown>(bot, ['iconBase64', 'iconbase64']))),
    channels,
    connectors,
    knowledgeSources,
    recognizerKind: asString(readPath(configuration, ['recognizer', '$kind'])),
    conversation: {
      displayName: asString(readPath(defaultContent, ['displayName'])) || asString(readCandidate<unknown>(bot, ['displayName', 'name'])),
      description: asString(readPath(defaultContent, ['description'])),
      instructions: asString(readPath(defaultContent, ['instructions'])),
      conversationStarters: asStringArray(readPath(defaultContent, ['conversationStarters'])),
      capabilityNames: extractCapabilityNames(readPath(defaultContent, ['capabilities'])),
    },
    aiSettings: isRecord(aiSettings)
      ? {
          useModelKnowledge: asBoolean(readCandidate<unknown>(aiSettings, ['useModelKnowledge'])),
          isFileAnalysisEnabled: asBoolean(readCandidate<unknown>(aiSettings, ['isFileAnalysisEnabled'])),
          isSemanticSearchEnabled: asBoolean(readCandidate<unknown>(aiSettings, ['isSemanticSearchEnabled'])),
          optInUseLatestModels: asBoolean(readCandidate<unknown>(aiSettings, ['optInUseLatestModels'])),
          modelNameHint: asString(readPath(aiSettings, ['model', 'modelNameHint'])),
        }
      : undefined,
  };
}

function mapSingleInput(input: unknown): CopilotStudioAgentDefinition {
  const sourceKind = detectSourceKind(input);
  if (!isRecord(input)) {
    return buildBaseDefinition('unknown');
  }

  if (sourceKind === 'normalized-agent-definition') {
    return mapNormalizedAgent(input);
  }

  if (sourceKind === 'bot-create-request') {
    return mapCreatePayload(input);
  }

  if (sourceKind === 'botcomponents-response' || sourceKind === 'dataverse-bot-record') {
    return {
      ...mapDataverseBotRecord(input),
      source: sourceKind,
    };
  }

  return buildBaseDefinition('unknown');
}

function mergeString(primary?: string, secondary?: string): string | undefined {
  return secondary || primary;
}

function mergeBoolean(primary?: boolean, secondary?: boolean): boolean | undefined {
  return secondary ?? primary;
}

function mergeNumber(primary?: number, secondary?: number): number | undefined {
  return secondary ?? primary;
}

function mergeArray(primary: string[], secondary: string[]): string[] {
  return Array.from(new Set([...primary, ...secondary]));
}

function mergeConversation(
  primary: CopilotStudioAgentDefinition['conversation'],
  secondary: CopilotStudioAgentDefinition['conversation'],
): CopilotStudioAgentDefinition['conversation'] {
  return {
    displayName: mergeString(primary.displayName, secondary.displayName),
    description: mergeString(primary.description, secondary.description),
    instructions: mergeString(primary.instructions, secondary.instructions),
    conversationStarters: mergeArray(primary.conversationStarters, secondary.conversationStarters),
    capabilityNames: mergeArray(primary.capabilityNames, secondary.capabilityNames),
  };
}

function mergeDefinitions(
  primary: CopilotStudioAgentDefinition,
  secondary?: CopilotStudioAgentDefinition,
): CopilotStudioAgentDefinition {
  if (!secondary) {
    return primary;
  }

  return {
    ...primary,
    source: 'merged',
    name: mergeString(primary.name, secondary.name) || 'Unknown Agent',
    schemaName: mergeString(primary.schemaName, secondary.schemaName),
    botId: mergeString(primary.botId, secondary.botId),
    pvaBotId: mergeString(primary.pvaBotId, secondary.pvaBotId),
    template: mergeString(primary.template, secondary.template),
    language: mergeNumber(primary.language, secondary.language),
    authenticationMode: mergeString(primary.authenticationMode, secondary.authenticationMode),
    rawAuthenticationMode: secondary.rawAuthenticationMode ?? primary.rawAuthenticationMode,
    authenticationTrigger: mergeString(primary.authenticationTrigger, secondary.authenticationTrigger),
    rawAuthenticationTrigger: secondary.rawAuthenticationTrigger ?? primary.rawAuthenticationTrigger,
    accessControlPolicy: mergeString(primary.accessControlPolicy, secondary.accessControlPolicy),
    rawAccessControlPolicy: secondary.rawAccessControlPolicy ?? primary.rawAccessControlPolicy,
    published: mergeBoolean(primary.published, secondary.published),
    publishedOn: mergeString(primary.publishedOn, secondary.publishedOn),
    publishState: mergeString(primary.publishState, secondary.publishState),
    provisioningStatus: mergeString(primary.provisioningStatus, secondary.provisioningStatus),
    synchronizationState: mergeString(primary.synchronizationState, secondary.synchronizationState),
    runtimeProvider: mergeString(primary.runtimeProvider, secondary.runtimeProvider),
    isCustomizable: mergeBoolean(primary.isCustomizable, secondary.isCustomizable),
    isManaged: mergeBoolean(primary.isManaged, secondary.isManaged),
    isAgentConnectable: mergeBoolean(primary.isAgentConnectable, secondary.isAgentConnectable),
    iconBase64Present: primary.iconBase64Present || secondary.iconBase64Present,
    channels: mergeArray(primary.channels, secondary.channels),
    connectors: mergeArray(primary.connectors, secondary.connectors),
    knowledgeSources: mergeArray(primary.knowledgeSources, secondary.knowledgeSources),
    recognizerKind: mergeString(primary.recognizerKind, secondary.recognizerKind),
    conversation: mergeConversation(primary.conversation, secondary.conversation),
    aiSettings: {
      useModelKnowledge: mergeBoolean(primary.aiSettings?.useModelKnowledge, secondary.aiSettings?.useModelKnowledge),
      isFileAnalysisEnabled: mergeBoolean(primary.aiSettings?.isFileAnalysisEnabled, secondary.aiSettings?.isFileAnalysisEnabled),
      isSemanticSearchEnabled: mergeBoolean(primary.aiSettings?.isSemanticSearchEnabled, secondary.aiSettings?.isSemanticSearchEnabled),
      optInUseLatestModels: mergeBoolean(primary.aiSettings?.optInUseLatestModels, secondary.aiSettings?.optInUseLatestModels),
      modelNameHint: mergeString(primary.aiSettings?.modelNameHint, secondary.aiSettings?.modelNameHint),
    },
    environment: secondary.environment || primary.environment,
    auditConfigMatch: secondary.auditConfigMatch || primary.auditConfigMatch,
  };
}

function enrichWithAuditConfig(
  definition: CopilotStudioAgentDefinition,
  config?: GroundTruthAuditConfig,
): CopilotStudioAgentDefinition {
  const match = matchAuditAgent(config, definition);
  if (!match.environment || !match.agent) {
    return definition;
  }

  return {
    ...definition,
    pvaBotId: definition.pvaBotId || match.agent.pvaBotId,
    published: definition.published ?? match.agent.published,
    publishedOn: definition.publishedOn || match.agent.publishedOn,
    environment: toEnvironmentContext(match.environment),
    auditConfigMatch: {
      environmentName: match.environment.name,
      agentName: match.agent.name,
      hasDirectLineEndpoint: Boolean(match.agent.dlTokenEndpoint),
      hasStudioUrl: Boolean(match.agent.studioUrl),
    },
  };
}

export function mapDataverseAgentInputs(
  botInput: unknown,
  settingsInput?: unknown,
  config?: GroundTruthAuditConfig,
): CopilotStudioAgentDefinition {
  const primary = mapSingleInput(botInput);
  const merged = mergeDefinitions(primary, settingsInput ? mapSingleInput(settingsInput) : undefined);
  return enrichWithAuditConfig(merged, config);
}

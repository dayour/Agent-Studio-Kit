import { mapDataverseAgentInputs } from '../../src/copilot-studio/dataverse-mapper';
import { groundTruthAuditSampleConfig } from '../../src/copilot-studio/schemas';

const createPayload = {
  requestBody: {
    configuration: JSON.stringify({
      $kind: 'BotConfiguration',
      settings: {
        'default-2.1.0': {
          spec: {
            connectors: [
              'Dataverse - List rows',
              'Teams - Post message in a chat or channel',
            ],
          },
          content: {
            displayName: 'Sample Agent',
            description: 'Reasoning agent',
            instructions: 'Help with reasoning and drafting.',
            conversationStarters: ['Help me reason through this'],
            capabilities: {
              $kind: 'GptCapabilities',
              webBrowsing: true,
            },
          },
        },
        GenerativeActionsEnabled: true,
      },
      isAgentConnectable: true,
      gPTSettings: {
        $kind: 'GPTSettings',
        defaultSchemaName: 'sample_agent.gpt.default',
      },
      aISettings: {
        $kind: 'AISettings',
        useModelKnowledge: true,
        isFileAnalysisEnabled: true,
        isSemanticSearchEnabled: true,
        optInUseLatestModels: false,
      },
      recognizer: {
        $kind: 'GenerativeAIRecognizer',
      },
    }),
    name: 'Sample Agent',
    iconbase64: 'abc123',
    language: 1033,
    schemaname: 'sample_agent',
    template: 'default-2.1.0',
    accesscontrolpolicy: 1,
    authenticationmode: 2,
    authenticationtrigger: 1,
    iscustomizable: {
      Value: false,
    },
  },
};

const botComponentsPayload = {
  responseBody: {
    bot: {
      displayName: 'Sample Agent',
      schemaName: 'sample_agent',
      cdsBotId: '00000000-0000-0000-0000-000000000001',
      accessControlPolicy: 'GroupMembership',
      authenticationMode: 'Integrated',
      authenticationTrigger: 'Always',
      configuration: {
        $kind: 'BotConfiguration',
        settings: {
          'default-2.1.0': {
            spec: {
              connectors: ['Dataverse - List rows'],
            },
            content: {
              displayName: 'Sample Agent',
              description: 'Reasoning agent',
              instructions: 'Help with reasoning and drafting.',
              conversationStarters: ['Start here'],
              capabilities: {
                $kind: 'GptCapabilities',
                webBrowsing: true,
              },
            },
          },
          GenerativeActionsEnabled: true,
        },
        isAgentConnectable: true,
        aISettings: {
          $kind: 'AISettings',
          useModelKnowledge: true,
          isFileAnalysisEnabled: true,
          isSemanticSearchEnabled: true,
          optInUseLatestModels: false,
        },
        recognizer: {
          $kind: 'GenerativeAIRecognizer',
        },
      },
      synchronizationStatus: {
        $kind: 'BotSynchronizationDetails',
        currentSynchronizationState: {
          $kind: 'SynchronizationState',
          provisioningStatus: 'Provisioned',
          state: 'Published',
        },
      },
      template: 'default-2.1.0',
      language: 1033,
      runtimeProvider: 'PowerVirtualAgents',
      publishedOn: '2026-03-11T00:00:00Z',
      iconBase64: 'xyz789',
    },
  },
};

describe('mapDataverseAgentInputs', () => {
  it('normalizes and enriches Dataverse inputs into a Copilot Studio agent definition', () => {
    const mapped = mapDataverseAgentInputs(
      createPayload,
      botComponentsPayload,
      groundTruthAuditSampleConfig,
    );

    expect(mapped.source).toBe('merged');
    expect(mapped.name).toBe('Sample Agent');
    expect(mapped.schemaName).toBe('sample_agent');
    expect(mapped.botId).toBe('00000000-0000-0000-0000-000000000001');
    expect(mapped.accessControlPolicy).toBe('Readers');
    expect(mapped.authenticationMode).toBe('Integrated');
    expect(mapped.authenticationTrigger).toBe('Always');
    expect(mapped.connectors).toEqual(
      expect.arrayContaining([
        'Dataverse - List rows',
        'Teams - Post message in a chat or channel',
      ]),
    );
    expect(mapped.knowledgeSources).toContain('sample_agent.gpt.default');
    expect(mapped.evaluation.supportedModes).toContain('quick-question-set');
    expect(mapped.environment?.name).toBe('sample');
    expect(mapped.auditConfigMatch?.hasDirectLineEndpoint).toBe(true);
  });
});

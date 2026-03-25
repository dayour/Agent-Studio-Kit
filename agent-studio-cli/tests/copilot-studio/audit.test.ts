import { runLocalAgentAudit } from '../../src/copilot-studio/audit';
import { mapDataverseAgentInputs } from '../../src/copilot-studio/dataverse-mapper';
import { groundTruthAuditSampleConfig } from '../../src/copilot-studio/schemas';
import { validateGroundTruthAuditConfig } from '../../src/copilot-studio/validators';

const mappedAgent = mapDataverseAgentInputs(
  {
    requestBody: {
      configuration: JSON.stringify({
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
      }),
      name: 'Sample Agent',
      iconbase64: 'abc',
      schemaname: 'sample_agent',
      template: 'default-2.1.0',
      accesscontrolpolicy: 1,
      authenticationmode: 2,
      authenticationtrigger: 1,
    },
  },
  {
    responseBody: {
      bot: {
        displayName: 'Sample Agent',
        schemaName: 'sample_agent',
        cdsBotId: '00000000-0000-0000-0000-000000000001',
        accessControlPolicy: 'GroupMembership',
        authenticationMode: 'Integrated',
        authenticationTrigger: 'Always',
        publishedOn: '2026-03-11T00:00:00Z',
        synchronizationStatus: {
          currentSynchronizationState: {
            provisioningStatus: 'Provisioned',
            state: 'Published',
          },
        },
        configuration: {
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
          },
          aISettings: {
            useModelKnowledge: true,
            isFileAnalysisEnabled: true,
            isSemanticSearchEnabled: true,
            optInUseLatestModels: false,
          },
        },
      },
    },
  },
  groundTruthAuditSampleConfig,
);

describe('runLocalAgentAudit', () => {
  it('returns a clean audit report for a well-formed mapped agent', () => {
    const configValidation = validateGroundTruthAuditConfig(groundTruthAuditSampleConfig);
    const report = runLocalAgentAudit(mappedAgent, configValidation);

    expect(report.summary.fail).toBe(0);
    expect(report.summary.warn).toBe(0);
    expect(report.summary.overallSeverity).toBe('pass');
  });

  it('flags critical issues for incomplete agent definitions', () => {
    const report = runLocalAgentAudit({
      ...mappedAgent,
      schemaName: undefined,
      authenticationMode: undefined,
      conversation: {
        ...mappedAgent.conversation,
        description: '',
        instructions: '',
      },
    });

    expect(report.summary.fail).toBeGreaterThan(0);
    expect(report.summary.overallSeverity).toBe('fail');
  });
});

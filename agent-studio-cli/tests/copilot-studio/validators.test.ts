import {
  validateCopilotStudioEnvironmentSummary,
  validateGroundTruthAuditConfig,
} from '../../src/copilot-studio/validators';
import { groundTruthAuditSampleConfig } from '../../src/copilot-studio/schemas';

describe('copilot-studio validators', () => {
  it('accepts the sample ground-truth audit config', () => {
    const result = validateGroundTruthAuditConfig(groundTruthAuditSampleConfig);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects an invalid audit config', () => {
    const result = validateGroundTruthAuditConfig({
      environments: [
        {
          name: '',
          orgUrl: 'not-a-uri',
          agents: [{ name: '' }],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('accepts an image-mapped environment summary shape', () => {
    const result = validateCopilotStudioEnvironmentSummary({
      environmentName: 'Copilot-Dydev25',
      metrics: {
        agentsInEnvironment: 31,
        provisioned: 31,
        published: 6,
        questionsGenerated: 155,
      },
      evaluation: {
        batchScope: 'all-agents',
        questionsPerAgentDefault: 5,
        supportedModes: [
          'csv-upload',
          'quick-question-set',
          'full-question-set',
          'test-chat-conversation',
          'manual-questions',
        ],
      },
      agents: [
        {
          name: 'API-Created Agent',
          schemaName: 'auto_agent_sample',
          status: 'Provisioned',
          publishState: 'Published',
          publishedOn: '2026-03-11T00:00:00Z',
        },
      ],
    });

    expect(result.valid).toBe(true);
  });
});

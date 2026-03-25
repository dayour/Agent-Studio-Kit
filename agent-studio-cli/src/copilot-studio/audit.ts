import {
  AgentAuditReport,
  AgentAuditSummary,
  AuditFinding,
  AuditSeverity,
  CopilotStudioAgentDefinition,
  GroundTruthAuditConfig,
  ValidationResult,
} from './types';

function addFinding(
  findings: AuditFinding[],
  severity: AuditSeverity,
  checkId: string,
  message: string,
  detail?: Pick<AuditFinding, 'path' | 'expected' | 'actual'>,
): void {
  findings.push({
    checkId,
    severity,
    message,
    ...detail,
  });
}

function calculateSummary(findings: AuditFinding[]): AgentAuditSummary {
  const summary: AgentAuditSummary = {
    pass: 0,
    info: 0,
    warn: 0,
    fail: 0,
    overallSeverity: 'pass',
  };

  findings.forEach((finding) => {
    summary[finding.severity] += 1;
  });

  if (summary.fail > 0) {
    summary.overallSeverity = 'fail';
  } else if (summary.warn > 0) {
    summary.overallSeverity = 'warn';
  } else if (summary.info > 0) {
    summary.overallSeverity = 'info';
  }

  return summary;
}

function evaluateConfigBinding(
  findings: AuditFinding[],
  agent: CopilotStudioAgentDefinition,
  configValidation?: ValidationResult<GroundTruthAuditConfig>,
): void {
  if (configValidation && !configValidation.valid) {
    addFinding(findings, 'fail', 'audit-config-valid', 'Audit config validation failed.', {
      path: '$',
      actual: configValidation.issues,
    });
    return;
  }

  if (agent.auditConfigMatch) {
    addFinding(
      findings,
      'pass',
      'audit-config-match',
      `Matched audit config agent "${agent.auditConfigMatch.agentName}" in environment "${agent.auditConfigMatch.environmentName}".`,
    );
  } else {
    addFinding(
      findings,
      'info',
      'audit-config-match',
      'No audit config match was found. Environment enrichment and direct-line metadata may be incomplete.',
    );
  }
}

function evaluateIdentity(findings: AuditFinding[], agent: CopilotStudioAgentDefinition): void {
  if (!agent.name || !agent.schemaName) {
    addFinding(findings, 'fail', 'identity', 'Agent identity is incomplete. Name and schemaName are required for reliable audit mapping.', {
      expected: 'name and schemaName',
      actual: { name: agent.name, schemaName: agent.schemaName },
    });
    return;
  }

  addFinding(findings, 'pass', 'identity', `Resolved agent identity for "${agent.name}" (${agent.schemaName}).`);
}

function evaluateAuthentication(findings: AuditFinding[], agent: CopilotStudioAgentDefinition): void {
  if (!agent.authenticationMode) {
    addFinding(findings, 'fail', 'authentication-mode', 'Authentication mode is missing from the mapped payload.');
  } else if (agent.rawAuthenticationMode === 1 || agent.authenticationMode === 'Manual') {
    addFinding(
      findings,
      'warn',
      'authentication-mode',
      'Authentication mode is set to Dataverse auth mode 1 / Manual. Adjacent research indicates this may be reverted by DLP enforcement on publish.',
      {
        actual: agent.rawAuthenticationMode ?? agent.authenticationMode,
      },
    );
  } else {
    addFinding(findings, 'pass', 'authentication-mode', `Authentication mode is ${agent.authenticationMode}.`);
  }

  if (!agent.authenticationTrigger) {
    addFinding(findings, 'warn', 'authentication-trigger', 'Authentication trigger is missing from the mapped payload.');
  } else {
    addFinding(findings, 'pass', 'authentication-trigger', `Authentication trigger is ${agent.authenticationTrigger}.`);
  }
}

function evaluateAccessControl(findings: AuditFinding[], agent: CopilotStudioAgentDefinition): void {
  if (!agent.accessControlPolicy) {
    addFinding(findings, 'warn', 'access-control', 'Access control policy is missing.');
    return;
  }

  if (agent.accessControlPolicy === 'Everyone') {
    addFinding(findings, 'warn', 'access-control', 'Access control policy appears to be public/everyone. Review governance expectations.');
    return;
  }

  addFinding(findings, 'pass', 'access-control', `Access control policy is ${agent.accessControlPolicy}.`);
}

function evaluateContent(findings: AuditFinding[], agent: CopilotStudioAgentDefinition): void {
  const hasDescription = Boolean(agent.conversation.description);
  const hasInstructions = Boolean(agent.conversation.instructions);
  const hasCapabilities = agent.conversation.capabilityNames.length > 0 || agent.connectors.length > 0;

  if (!hasDescription && !hasInstructions) {
    addFinding(findings, 'fail', 'content', 'Both description and instructions are empty.');
  } else if (!hasDescription || !hasInstructions) {
    addFinding(findings, 'warn', 'content', 'Description or instructions are partially missing.', {
      actual: {
        description: agent.conversation.description,
        instructions: agent.conversation.instructions,
      },
    });
  } else {
    addFinding(findings, 'pass', 'content', 'Description and instructions are present.');
  }

  if (!hasCapabilities) {
    addFinding(findings, 'warn', 'capabilities', 'No capability or connector evidence was found in the mapped payload.');
  } else {
    addFinding(findings, 'pass', 'capabilities', `Found ${agent.conversation.capabilityNames.length} capability markers and ${agent.connectors.length} connectors.`);
  }
}

function evaluateAiSettings(findings: AuditFinding[], agent: CopilotStudioAgentDefinition): void {
  if (!agent.aiSettings) {
    addFinding(findings, 'warn', 'ai-settings', 'AI settings were not present in the mapped payload.');
    return;
  }

  if (agent.aiSettings.useModelKnowledge === false) {
    addFinding(findings, 'info', 'ai-settings', 'Model knowledge is disabled.');
  }

  if (agent.aiSettings.isSemanticSearchEnabled === false) {
    addFinding(findings, 'info', 'ai-settings', 'Semantic search is disabled.');
  }

  addFinding(findings, 'pass', 'ai-settings', 'AI settings were mapped successfully.');
}

function evaluatePublishState(findings: AuditFinding[], agent: CopilotStudioAgentDefinition): void {
  if (agent.published === true || agent.publishedOn) {
    addFinding(findings, 'pass', 'publish-state', 'Agent appears to have a published state.');
    return;
  }

  if (agent.provisioningStatus) {
    addFinding(findings, 'info', 'publish-state', `Agent provisioning status is ${agent.provisioningStatus}.`, {
      actual: {
        provisioningStatus: agent.provisioningStatus,
        publishState: agent.publishState,
      },
    });
    return;
  }

  addFinding(findings, 'warn', 'publish-state', 'No publish or provisioning state could be inferred.');
}

function evaluateEvaluationSupport(findings: AuditFinding[], agent: CopilotStudioAgentDefinition): void {
  const expectedModes = [
    'csv-upload',
    'quick-question-set',
    'full-question-set',
    'test-chat-conversation',
    'manual-questions',
  ];

  const missingModes = expectedModes.filter((mode) => !agent.evaluation.supportedModes.includes(mode as typeof agent.evaluation.supportedModes[number]));
  if (missingModes.length > 0) {
    addFinding(findings, 'warn', 'evaluation-support', 'Mapped evaluation support is missing one or more Copilot Studio evaluation modes shown in the reference UI.', {
      expected: expectedModes.join(', '),
      actual: agent.evaluation.supportedModes,
    });
    return;
  }

  addFinding(
    findings,
    'pass',
    'evaluation-support',
    `Evaluation support includes image-mapped modes with quick=${agent.evaluation.quickQuestionCount} and fullMax=${agent.evaluation.fullQuestionCountMax}.`,
  );
}

export function runLocalAgentAudit(
  agent: CopilotStudioAgentDefinition,
  configValidation?: ValidationResult<GroundTruthAuditConfig>,
): AgentAuditReport {
  const findings: AuditFinding[] = [];

  evaluateConfigBinding(findings, agent, configValidation);
  evaluateIdentity(findings, agent);
  evaluateAuthentication(findings, agent);
  evaluateAccessControl(findings, agent);
  evaluateContent(findings, agent);
  evaluateAiSettings(findings, agent);
  evaluatePublishState(findings, agent);
  evaluateEvaluationSupport(findings, agent);

  return {
    agent,
    findings,
    summary: calculateSummary(findings),
    configValidation,
  };
}

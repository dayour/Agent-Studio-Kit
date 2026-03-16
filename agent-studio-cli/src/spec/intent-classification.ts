import { LLMIntentResult } from './types';
import { createChatCompletion, getDefaultModel } from './llm-client';

export function normalizeChannelName(channel?: string): string | undefined {
  if (!channel) return undefined;
  const lower = channel.toLowerCase();
  const channelNameMap: Record<string, string> = {
    'teams': 'Microsoft 365',
    'microsoft teams': 'Microsoft 365',
    'teams & m365 copilot': 'Microsoft 365',
    'm365': 'Microsoft 365',
    'microsoft 365': 'Microsoft 365',
    'website': 'Web',
    'my website': 'Web',
    'webchat': 'Web',
    'web': 'Web',
    'slack': 'Slack',
    'sharepoint': 'SharePoint',
    'email': 'Email',
    'outlook': 'Email',
    'servicenow': 'ServiceNow',
    'onedrive': 'OneDrive',
    'excel': 'Excel',
    'word': 'Word',
    'powerpoint': 'PowerPoint',
    'dataverse': 'Dataverse',
    'whatsapp': 'WhatsApp',
  };
  return channelNameMap[lower] || channel;
}

function determineAgentType(channel?: string): 'CA' | 'DA' | undefined {
  if (!channel) return undefined;
  const channelLower = channel.toLowerCase();
  if (channelLower === 'teams' || channelLower === 'microsoft 365' || channelLower === 'microsoft teams') {
    return 'DA';
  }
  return 'CA';
}

export async function classifyIntentWithLLM(userInput: string, clarificationAttempt: number = 0): Promise<LLMIntentResult> {
  try {
    const response = await createChatCompletion({
      model: getDefaultModel(),
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: `Analyze this user request and determine if they need an AI agent, a workflow automation, or if the intent is unclear.

User request: "${userInput}"

**AI Agent** = Interactive, conversational, adapts to different situations
- Answers questions, provides recommendations, helps users with varying needs

**Workflow** = Automated process, follows same steps every time, no conversation
- Triggered by events, runs automatically, connects systems

**When to return "unclear":**
Be CONSERVATIVE - when in doubt, return "unclear".

**Explicit keywords override everything:**
- "AI agent", "chatbot", "virtual assistant" = AGENT
- "workflow automation", "automated workflow" = WORKFLOW
- BOTH = UNCLEAR

**Audience:** customers (external) or employees (internal)
**Channel:** website, teams, slack, outlook, sharepoint, onedrive, dataverse, servicenow
**Name and Description:** Suggest short name (2-5 words) and brief description.

${clarificationAttempt === 0 ? 'Keep clarifying questions concise.' : 'Provide more explanation with examples.'}

Respond in this exact JSON format:
{
  "type": "agent" or "workflow" or "unclear",
  "audience": "customers" or "employees" or null,
  "channel": "website" or "teams" or other, or null,
  "suggestedName": "short title" or null,
  "suggestedDescription": "brief summary" or null,
  "suggestedInstructions": "instructions for agents only" or null,
  "iconKey": "icon-key" or null,
  "gradientKey": "gradient-key" or null,
  "confidence": "high" or "medium" or "low",
  "confidenceReason": "brief explanation",
  "clarifyingQuestion": "question if unclear, otherwise null"
}`
      }]
    });

    const content = response.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    const agentType = determineAgentType(result.channel);

    return {
      type: result.type,
      audience: result.audience || undefined,
      channel: normalizeChannelName(result.channel) || undefined,
      agentType,
      suggestedName: result.suggestedName || undefined,
      suggestedDescription: result.suggestedDescription || undefined,
      suggestedInstructions: result.suggestedInstructions || undefined,
      iconKey: result.iconKey || undefined,
      gradientKey: result.gradientKey || undefined,
      confidence: result.confidence,
      confidenceReason: result.confidenceReason,
    };
  } catch (error) {
    return classifyIntentLocally(userInput);
  }
}

export function classifyIntentLocally(userInput: string): LLMIntentResult {
  const allResponses = userInput.toLowerCase();

  const explicitlyMentionsAgent = allResponses.includes(' agent') || allResponses.startsWith('agent') || allResponses.endsWith('agent');
  const explicitlyMentionsWorkflow = allResponses.includes('workflow');

  const scoringFactors = {
    customerWords: ['customer', 'client', 'user', 'patient', 'buyer', 'guest', 'visitor', 'shopper', 'student'],
    employeeWords: ['employee', 'staff', 'team', 'worker', 'personnel', 'member'],
    workflowVerbs: ['automate', 'streamline', 'orchestrate', 'route', 'triage'],
    workflowNouns: ['workflow', 'process', 'pipeline', 'steps', 'sequence', 'procedure', 'approval'],
    workflowAdverbs: ['automatically'],
    agentVerbs: ['help', 'assist', 'guide', 'answer', 'recommend', 'suggest', 'advise', 'support', 'find', 'book', 'manage', 'schedule'],
  };

  let customerScore = 0, employeeScore = 0, workflowScore = 0, agentScore = 0;

  scoringFactors.customerWords.forEach(w => { if (allResponses.includes(w)) customerScore += 2; });
  scoringFactors.employeeWords.forEach(w => { if (allResponses.includes(w)) employeeScore += 2; });
  scoringFactors.workflowVerbs.forEach(w => { if (allResponses.includes(w)) workflowScore += 3; });
  scoringFactors.workflowNouns.forEach(w => { if (allResponses.includes(w)) workflowScore += 2; });
  scoringFactors.workflowAdverbs.forEach(w => { if (allResponses.includes(w)) workflowScore += 4; });
  scoringFactors.agentVerbs.forEach(w => { if (allResponses.includes(w)) agentScore += 1; });

  if (explicitlyMentionsAgent) agentScore += 10;
  if (explicitlyMentionsWorkflow) workflowScore += 10;

  let recommendationType: 'agent' | 'workflow' = 'agent';
  let audience: 'customers' | 'employees' | undefined = undefined;

  if (workflowScore >= 3 && workflowScore > agentScore * 2) {
    recommendationType = 'workflow';
  } else if (Math.max(customerScore, employeeScore) > 0 && agentScore >= 2) {
    recommendationType = 'agent';
    audience = customerScore > employeeScore ? 'customers' : 'employees';
  } else if (workflowScore > agentScore && workflowScore >= 3) {
    recommendationType = 'workflow';
  } else {
    recommendationType = 'agent';
    if (customerScore > employeeScore && customerScore >= 2) audience = 'customers';
    else if (employeeScore > customerScore && employeeScore >= 2) audience = 'employees';
  }

  let confidence: 'high' | 'medium' | 'low' = 'medium';
  let confidenceReason = '';

  if (recommendationType === 'workflow') {
    if (explicitlyMentionsWorkflow || (workflowScore >= 6 && workflowScore > agentScore * 2)) {
      confidence = 'high';
      confidenceReason = explicitlyMentionsWorkflow ? 'user explicitly requested a workflow' : 'strong automation signals';
    } else { confidence = 'medium'; confidenceReason = 'workflow indicators present but could be agent-assisted'; }
  } else {
    if (explicitlyMentionsAgent || (Math.max(customerScore, employeeScore) >= 2 && agentScore >= 2)) {
      confidence = 'high';
      confidenceReason = explicitlyMentionsAgent ? 'user explicitly requested an agent' : 'clear audience and interactive signals';
    } else { confidence = 'medium'; confidenceReason = 'intent could be refined'; }
  }

  return { type: recommendationType, audience, confidence, confidenceReason };
}

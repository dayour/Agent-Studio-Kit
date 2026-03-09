import { AgentCapability, AgentSpec } from './types';
import { createChatCompletion } from './llm-client';

const buildInstructionGuidance = (audience?: 'customers' | 'employees' | null, channels?: string[] | null): string => {
  const audienceSection = audience === 'customers'
    ? `AUDIENCE: External Customer-Facing Agent
This agent will interact with CUSTOMERS (external users). Prioritize:
- Brand voice and consistent messaging
- Clear, friendly, accessible language - avoid internal jargon
- Privacy and data protection
- Escalation paths to human support
- Professional boundaries (what to share vs. keep internal)
- Empathy and patience with varied customer knowledge levels
- Clear explanations without assuming domain expertise`
    : audience === 'employees'
    ? `AUDIENCE: Internal Business-to-Employee (B2E) Agent
This agent will interact with EMPLOYEES (internal users). Prioritize:
- Direct, efficient communication
- Internal tools, systems, and terminology
- Company-specific processes and policies
- Integration with internal knowledge bases
- Focus on productivity and task completion
- Can assume familiarity with company context
- Proactive guidance on internal best practices`
    : `AUDIENCE: General Purpose Agent
Create flexible instructions that work well for various audiences.`;

  const communicationNote = audience === 'customers'
    ? ' (focus on empathy, clarity for customers)'
    : audience === 'employees'
    ? ' (focus on efficiency, directness for employees)'
    : '';

  const audienceDeployment = audience === 'customers'
    ? 'customer-facing deployment'
    : audience === 'employees'
    ? 'internal enterprise deployment'
    : 'enterprise deployment';

  const triggerGuidance = !channels || channels.length === 0
    ? `TRIGGERS: No channels selected. Write EXACTLY ONE trigger line in the instructions: the literal text "Add a trigger" -- no brackets, no additional description. Do NOT add any trigger-type entries in the capabilities array.`
    : `TRIGGERS: Write EXACTLY ${channels.length} trigger line(s) -- one per channel. The channel name is the PRIMARY signal -- match each channel to the trigger from this list whose service name most closely corresponds to that channel, regardless of the agent's purpose. If no trigger clearly matches a channel, write "Add a trigger" for that line. Do NOT add trigger-type entries in the capabilities array.
  Trigger list: Outlook - On new Email V3, Recurrence Trigger, Teams - On New Channel Message, SharePoint - On New Items, Sharepoint - GetOnNewFileItems, Sharepoint - On Updated Items, OneDrive - On New File V2, MS Forms - On Create new Form, Dataverse - Subscribe Web Hook, Sharepoint - On Change Items, Teams - OnNewChatMessage, Planner - On Completed Task V3, Teams - AtMention, OneDrive - On updated File V2, Outlook - On Flagged Email V4, OneDrive - On Updated File V2, SharePoint - On Updated File, Website - When a message is received
  Channels to match: ${channels.join(', ')}`;

  return `${audienceSection}

${triggerGuidance}

PURPOSE: Write 1-3 sentences explaining the agent's main objectives and use cases.

CAPABILITIES: Generate 2-5 specific capabilities (mix of knowledge, action, connector, trigger types)
- knowledge: Things the agent knows about or can reference (e.g., "Company policies", "Product catalog")
- action: Things the agent can do (e.g., "Send email notifications", "Create tickets")
- connector: External systems it integrates with (e.g., "Slack", "Salesforce", "SharePoint")
- action/connector tools -- ONLY use from this list (exact names):
  Office365 - Send an email (V2), Office365 - Get emails (V3), Teams - Post message in a chat or channel, Teams - Post adaptive card in a chat or channel, SharePoint - Get items, SharePoint - Create item, SharePoint - Update item, SharePoint - Get file content, SharePoint - Create file, OneDrive - Get file content, OneDrive - Create file, Dataverse - List rows, Dataverse - Get a row by ID, Dataverse - Add a new row, Dataverse - Update a row, Planner - Create a task, Planner - List my tasks, Approvals - Create an approval, Approvals - Start and wait for an approval, HTTP - HTTP, Excel Online - Get a row, Excel Online - Add a row into a table, Word Online - Populate a Microsoft Word template, PDF - Extract text from PDF, Power BI - Refresh a dataset, Azure DevOps - Create a work item, ServiceNow - Create Record, Salesforce - Create record, Slack - Post message
- knowledge: Free-form search terms the agent uses to find information (NOT from a fixed list)

INSTRUCTIONS: Write concise, actionable instructions following this MINIMAL structure. Brevity is paramount.

Start with one trigger line per channel -- NO heading -- in this exact format:
[Trigger Name] brief description of what the agent does when that trigger fires.

## Role & Purpose
- 1-3 sentences defining role and primary goal

## Capabilities & Responsibilities
- Reference capability names naturally in sentences
- Brief CAN/CANNOT list (2-5 items each max)

## Communication Style & Tone
- 2-5 bullet points ONLY${communicationNote}

## Key Guidelines
- 2-5 most critical principles ONLY
- When to escalate

CRITICAL: NO sub-sections, NO lengthy examples, NO detailed scenarios. Keep each section to 3-5 bullet points maximum.

QUALITY STANDARDS:
- Be SPECIFIC to the domain (e.g., "HR Benefits Specialist" not just "HR Agent")
- Include CONCRETE details about what the agent can do
- Write instructions that are ACTIONABLE and CLEAR
- Use professional language appropriate for ${audienceDeployment}
- ABSOLUTE LIMIT: 100-400 words for instructions
- REQUIRED: Reference each capability by name at least once in the instructions
- Focus on HIGH-IMPACT guidelines only
- ONLY use triggers and tools from the provided lists above (exact names). Knowledge items are free-form search terms.`;
};

export const generateAgentFromDescription = async (
  userDescription: string,
  audience?: 'customers' | 'employees' | null,
  channels?: string[] | null
): Promise<AgentSpec> => {
  const systemPrompt = `You are an expert AI agent architect who designs high-quality, production-ready AI agents. Your job is to take a user's description and create a comprehensive, professional agent specification.

CRITICAL REQUIREMENTS:
1. **Name**: Create a specific, professional name (2-4 words) that clearly identifies the agent's role
2. **Description**: Write a compelling one-liner (10-15 words) that captures exactly what the agent does and its value
${buildInstructionGuidance(audience, channels)}

ICON SELECTION:
Choose the most appropriate icon key from: hr, it, sales, finance, legal, marketing, customer-service, communications, healthcare, insurance, education, ecommerce, manufacturing, security, data, operations, automation, chatbot, scheduling, documents, approvals, monitoring, email, research, knowledge, onboarding, feedback, tickets, search, notifications, generic

COLOR SELECTION:
Choose the most appropriate gradient key from: rose, cerulean, lavendar, fuchsia, seafoam, gold, fern
- Rose: Compassionate, healthcare, wellness
- Cerulean: Trust, communication, collaboration
- Lavendar: Creative, strategic, analysis
- Fuchsia: Energetic, marketing, innovative
- Seafoam: Growth, sustainability, operations
- Gold: Finance, premium, achievement
- Fern: Growth, training, environmental

OUTPUT FORMAT:
Return ONLY valid JSON with no markdown formatting or extra text:
{
  "name": "Specific Agent Name",
  "description": "Concise value-focused description under 15 words",
  "purpose": "Clear 2-3 sentence explanation of objectives and use cases.",
  "iconKey": "icon-key-from-list-above",
  "gradientKey": "gradient-name-from-list-above",
  "capabilities": [
    {"name": "Capability name", "type": "knowledge|action|connector|trigger"}
  ],
  "instructions": "Comprehensive multi-paragraph instructions with sections, guidelines, and examples"
}`;

  try {
    const response = await createChatCompletion({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Create a professional agent configuration for: ${userDescription}`
        }
      ]
    });

    const content = response.content;
    let jsonStr = content.trim();

    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonStr.trim());

    return {
      name: parsed.name || 'New Agent',
      description: parsed.description || userDescription,
      purpose: parsed.purpose || userDescription,
      instructions: parsed.instructions || '',
      capabilities: parsed.capabilities || [],
      iconKey: parsed.iconKey || 'generic',
      gradientKey: parsed.gradientKey || 'cerulean'
    };
  } catch (error) {
    const cleanDescription = userDescription.split('\n\nAdditional context:')[0];
    return {
      name: 'Custom Agent',
      description: cleanDescription.slice(0, 100),
      purpose: cleanDescription,
      instructions: `You are a helpful AI assistant for: ${cleanDescription}\n\nProvide clear, accurate, and helpful responses.`,
      capabilities: []
    };
  }
};

export const updateAgentInstructionsFromBrief = async (
  brief: string,
  existingInstructions: string,
  audience?: 'customers' | 'employees' | null,
  channels?: string[] | null
): Promise<string> => {
  const response = await createChatCompletion({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    system: `You are updating AI agent instructions based on a refined description of what the agent should do.

Make the MINIMUM changes necessary to align the instructions with the updated description.
Preserve existing formatting, structure, and any sections that are still accurate.
Only modify content that is genuinely inconsistent with or missing from the new description.

${buildInstructionGuidance(audience, channels)}

Return ONLY the updated instructions text.`,
    messages: [
      {
        role: 'user',
        content: `Current instructions:\n${existingInstructions}\n\nUpdated description of what the agent should do:\n${brief}`,
      },
    ],
  });

  const text = response.content.trim();
  return text || existingInstructions;
};

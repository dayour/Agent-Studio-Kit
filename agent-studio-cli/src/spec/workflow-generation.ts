import { WorkflowNode } from './types';
import { createChatCompletion } from './llm-client';

export const generateWorkflowNodes = async (
  userDescription: string,
  agentName: string
): Promise<WorkflowNode[]> => {
  const systemPrompt = `You are an expert workflow architect who designs production-ready automation workflows. Your job is to take a user's workflow description and create a comprehensive, logical sequence of workflow nodes.

WORKFLOW NODE TYPES:
1. **trigger**: Events that start the workflow (e.g., "When a new file arrives", "When an email is received")
   - Common connectors: SharePoint, Outlook, OneDrive, Forms, Dataverse
   - Example: { "type": "trigger", "label": "When a new invoice arrives in SharePoint", "connector": "SharePoint" }

2. **ai-action**: AI-powered data processing steps (e.g., "Extract data", "Classify content", "Summarize text")
   - No connector needed - this is Claude AI processing
   - Include config with task description and entities
   - Example: { "type": "ai-action", "label": "Extract invoice data", "config": { "task": "Extract invoice details", "entities": ["Amount", "Date", "Vendor"] } }

3. **agent**: Delegated tasks to specialized AI agents (e.g., "Validate data", "Review content")
   - Include config with instructions, knowledge sources, and tools
   - Example: { "type": "agent", "label": "Agent - Compliance validation", "config": { "instructions": "Review for compliance", "knowledge": ["Company policies"], "tools": ["Dataverse MCP"] } }

4. **condition**: If/else branching logic to route workflow based on criteria
   - Creates two branches: 'true' and 'false'
   - Example: { "type": "condition", "label": "If/else" }

5. **action**: External system actions (e.g., "Send email", "Create record", "Update database")
   - Common connectors: Outlook, Teams, Dataverse, SharePoint, Slack
   - Include branch property if following a condition
   - Example: { "type": "action", "label": "Send approval email", "connector": "Outlook", "branch": "true" }

AVAILABLE CONNECTORS:
- SharePoint: Document storage and management
- Outlook: Email communication
- Dataverse: Database and CRM operations
- OneDrive: Personal file storage
- Teams: Team collaboration and notifications
- Forms: Data collection
- Slack: Team messaging

WORKFLOW DESIGN PRINCIPLES:
1. Start with exactly ONE trigger node
2. Arrange nodes in logical execution order
3. Use ai-action for data extraction/transformation, agents for complex decisions
4. Use conditions when the workflow needs different paths
5. End with actions like sending notifications or updating records
6. Generate 4-8 nodes total (quality over quantity)
7. Use specific, professional labels

Return ONLY a valid JSON array of WorkflowNode objects. No explanations, no markdown, just the JSON array.`;

  const userPrompt = `Design a workflow for: "${userDescription}"

Workflow name: ${agentName}

Generate a complete workflow with appropriate nodes. Return only the JSON array of nodes.`;

  try {
    const response = await createChatCompletion({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    let jsonText = response.content.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    return JSON.parse(jsonText) as WorkflowNode[];
  } catch (error) {
    return [
      { id: 'trigger-1', type: 'trigger', label: 'Workflow trigger', connector: 'SharePoint' },
      { id: 'ai-action-1', type: 'ai-action', label: 'Process data', config: { task: 'Process and extract relevant information', entities: ['Data', 'Content'] } },
      { id: 'action-1', type: 'action', label: 'Send notification', connector: 'Outlook' }
    ];
  }
};

import axios from 'axios';
import { config } from '../config';

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  system?: string;
  messages: LLMMessage[];
  max_tokens: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  raw?: unknown;
}

function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY || config.get('anthropicApiKey') as string | undefined;
}

function getProxyUrl(): string | undefined {
  return process.env.LLM_PROXY_URL || config.get('llmProxyUrl') as string | undefined;
}

export function getDefaultModel(): string {
  return (config.get('defaultModel') as string) || 'claude-sonnet-4-5-20250514';
}

export async function createChatCompletion(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = getApiKey();
  const proxyUrl = getProxyUrl();

  if (apiKey) {
    return callAnthropicDirect(request, apiKey);
  } else if (proxyUrl) {
    return callProxy(request, proxyUrl);
  } else {
    throw new Error(
      'No LLM provider configured. Set ANTHROPIC_API_KEY env var, or run:\n' +
      '  agent-studio config set-llm --api-key <key>\n' +
      '  agent-studio config set-llm --proxy-url <url>'
    );
  }
}

async function callAnthropicDirect(request: LLMRequest, apiKey: string): Promise<LLMResponse> {
  const body: Record<string, unknown> = {
    model: request.model,
    max_tokens: request.max_tokens,
    messages: request.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  };

  if (request.system) {
    body.system = request.system;
  }
  if (request.temperature !== undefined) {
    body.temperature = request.temperature;
  }

  const response = await axios.post('https://api.anthropic.com/v1/messages', body, {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    }
  });

  const textBlock = response.data.content?.find(
    (block: { type?: string; text?: string }) => block?.type === 'text'
  );
  return { content: textBlock?.text || '', raw: response.data };
}

async function callProxy(request: LLMRequest, proxyUrl: string): Promise<LLMResponse> {
  const body: Record<string, unknown> = {
    model: request.model,
    messages: request.messages,
    max_tokens: request.max_tokens
  };

  if (request.system) {
    body.system = request.system;
  }
  if (request.temperature !== undefined) {
    body.temperature = request.temperature;
  }

  const response = await axios.post(proxyUrl, body, {
    headers: { 'content-type': 'application/json' }
  });

  const data = response.data;
  const textBlock = data.content?.find(
    (block: { type?: string; text?: string }) => block?.type === 'text'
  );
  return { content: textBlock?.text || '', raw: data };
}

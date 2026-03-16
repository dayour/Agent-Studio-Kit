import {
  buildCopilotSdkPrompt,
  buildLlmLibPrompt,
  getProviderFallbackModel,
  parseLlmLibSseEvent,
} from '../../src/spec/llm-client';

describe('llm-client helpers', () => {
  it('returns a plain prompt for a single user message', () => {
    expect(buildLlmLibPrompt([
      { role: 'user', content: 'Create a support agent.' },
    ])).toBe('Create a support agent.');
  });

  it('formats multi-message prompts as a transcript for llm-lib', () => {
    expect(buildLlmLibPrompt([
      { role: 'user', content: 'Draft an HR bot.' },
      { role: 'assistant', content: 'What channels should it support?' },
      { role: 'user', content: 'Teams and email.' },
    ])).toBe(
      'User: Draft an HR bot.\n\nAssistant: What channels should it support?\n\nUser: Teams and email.'
    );
  });

  it('formats multi-message prompts for Copilot SDK sessions', () => {
    expect(buildCopilotSdkPrompt([
      { role: 'user', content: 'Draft an HR bot.' },
      { role: 'assistant', content: 'What channels should it support?' },
      { role: 'user', content: 'Teams and email.' },
    ])).toBe(
      'User: Draft an HR bot.\n\nAssistant: What channels should it support?\n\nUser: Teams and email.\n\nRespond to the final user message.'
    );
  });

  it('parses SSE data payloads emitted by llm-lib', () => {
    expect(parseLlmLibSseEvent('data: {"type":"delta","content":"Hello"}\n\n')).toEqual({
      type: 'delta',
      content: 'Hello',
    });
  });

  it('returns null for non-JSON SSE payloads', () => {
    expect(parseLlmLibSseEvent('event: ping\ndata: not-json\n\n')).toBeNull();
  });

  it('returns provider-specific fallback models', () => {
    expect(getProviderFallbackModel('copilot-sdk')).toBe('gpt-4.1');
    expect(getProviderFallbackModel('anthropic')).toBe('claude-sonnet-4-5-20250514');
  });
});

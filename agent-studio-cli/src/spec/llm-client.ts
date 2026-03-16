import axios from 'axios';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';
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

type LLMProvider = 'anthropic' | 'proxy' | 'llm-lib' | 'copilot-sdk';

interface CopilotAuthStatus {
  isAuthenticated: boolean;
  statusMessage?: string;
  authType?: string;
  login?: string;
}

interface CopilotMessageResponse {
  data?: {
    content?: string;
  };
}

interface CopilotSessionLike {
  sendAndWait(options: { prompt: string }): Promise<CopilotMessageResponse | undefined>;
}

interface CopilotClientLike {
  start(): Promise<void>;
  stop(): Promise<void>;
  getAuthStatus(): Promise<CopilotAuthStatus>;
  createSession(config: {
    model?: string;
    systemMessage?: { content: string; mode?: 'append' | 'replace' };
    availableTools?: string[];
    onPermissionRequest: unknown;
  }): Promise<CopilotSessionLike>;
}

interface CopilotSdkModule {
  CopilotClient: new (options?: Record<string, unknown>) => CopilotClientLike;
  approveAll: unknown;
}

const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250514';
const DEFAULT_COPILOT_MODEL = 'gpt-4.1';

const dynamicImport = new Function('specifier', 'return import(specifier);') as (
  specifier: string
) => Promise<unknown>;

let llmLibStartupPromise: Promise<void> | null = null;
let copilotSdkModulePromise: Promise<CopilotSdkModule> | null = null;

function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY || config.get('anthropicApiKey') as string | undefined;
}

function getProxyUrl(): string | undefined {
  return process.env.LLM_PROXY_URL || config.get('llmProxyUrl') as string | undefined;
}

function getConfiguredProvider(): LLMProvider | undefined {
  const provider = process.env.LLM_PROVIDER || config.get('llmProvider') as string | undefined;
  if (provider === 'anthropic' || provider === 'proxy' || provider === 'llm-lib' || provider === 'copilot-sdk') {
    return provider;
  }
  return undefined;
}

function getLlmLibPath(): string | undefined {
  return process.env.LLM_LIB_PATH || config.get('llmLibPath') as string | undefined;
}

function getLlmLibUrl(): string {
  return (process.env.LLM_LIB_URL || config.get('llmLibUrl') as string | undefined || 'http://127.0.0.1:4300').replace(/\/+$/, '');
}

function getLlmLibTool(): string {
  return process.env.LLM_LIB_TOOL || config.get('llmLibTool') as string | undefined || 'chat_model_router';
}

function getCopilotSdkGitHubToken(): string | undefined {
  return process.env.COPILOT_SDK_GITHUB_TOKEN
    || process.env.GITHUB_TOKEN
    || config.get('copilotSdkGithubToken') as string | undefined;
}

function parseBooleanValue(value: string | boolean | undefined, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function hasExplicitCopilotSdkConfig(): boolean {
  return process.env.COPILOT_SDK_GITHUB_TOKEN !== undefined
    || process.env.COPILOT_SDK_USE_LOGGED_IN_USER !== undefined
    || config.get('copilotSdkGithubToken') !== undefined
    || config.get('copilotSdkUseLoggedInUser') !== undefined;
}

function getCopilotSdkUseLoggedInUser(): boolean {
  const configured = process.env.COPILOT_SDK_USE_LOGGED_IN_USER
    ?? config.get('copilotSdkUseLoggedInUser') as boolean | string | undefined;
  const tokenPresent = !!getCopilotSdkGitHubToken();
  return parseBooleanValue(configured, !tokenPresent);
}

export function getProviderFallbackModel(provider?: LLMProvider): string {
  return provider === 'copilot-sdk' ? DEFAULT_COPILOT_MODEL : DEFAULT_ANTHROPIC_MODEL;
}

export function getDefaultModel(provider: LLMProvider | undefined = resolveLlmProvider()): string {
  return (config.get('defaultModel') as string | undefined) || getProviderFallbackModel(provider);
}

export function resolveLlmProvider(): LLMProvider | undefined {
  const configuredProvider = getConfiguredProvider();
  if (configuredProvider) {
    return configuredProvider;
  }

  if (getApiKey()) {
    return 'anthropic';
  }

  if (getLlmLibPath() || process.env.LLM_LIB_URL || config.get('llmLibUrl')) {
    return 'llm-lib';
  }

  if (getProxyUrl()) {
    return 'proxy';
  }

  if (hasExplicitCopilotSdkConfig()) {
    return 'copilot-sdk';
  }

  return undefined;
}

function buildTranscriptPrompt(messages: LLMMessage[]): string {
  const normalized = messages
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim(),
    }))
    .filter((message) => message.content.length > 0);

  if (normalized.length === 0) {
    return '';
  }

  if (normalized.length === 1 && normalized[0].role === 'user') {
    return normalized[0].content;
  }

  return normalized
    .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
    .join('\n\n');
}

export function buildLlmLibPrompt(messages: LLMMessage[]): string {
  return buildTranscriptPrompt(messages);
}

export function buildCopilotSdkPrompt(messages: LLMMessage[]): string {
  const prompt = buildTranscriptPrompt(messages);
  if (!prompt) {
    return '';
  }

  if (messages.length === 1 && messages[0].role === 'user') {
    return prompt;
  }

  return `${prompt}\n\nRespond to the final user message.`;
}

export function parseLlmLibSseEvent(eventBlock: string): { type?: string; content?: string; message?: string } | null {
  const dataLines = eventBlock
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart());

  if (dataLines.length === 0) {
    return null;
  }

  try {
    return JSON.parse(dataLines.join('\n')) as { type?: string; content?: string; message?: string };
  } catch {
    return null;
  }
}

export async function createChatCompletion(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = getApiKey();
  const proxyUrl = getProxyUrl();
  const provider = resolveLlmProvider();
  const normalizedRequest: LLMRequest = {
    ...request,
    model: request.model || getDefaultModel(provider),
  };

  switch (provider) {
    case 'anthropic':
      if (!apiKey) {
        throw new Error('Anthropic provider selected but no API key is configured.');
      }
      return callAnthropicDirect(normalizedRequest, apiKey);
    case 'copilot-sdk':
      return callCopilotSdk(normalizedRequest);
    case 'llm-lib':
      return callLlmLib(normalizedRequest);
    case 'proxy':
      if (!proxyUrl) {
        throw new Error('Proxy provider selected but no proxy URL is configured.');
      }
      return callProxy(normalizedRequest, proxyUrl);
    default:
      throw new Error(
        'No LLM provider configured. Use one of these commands:\n' +
        '  agent-studio spec config --provider copilot-sdk --use-logged-in-user true --model gpt-4.1\n' +
        '  agent-studio spec config --provider anthropic --api-key <key>\n' +
        '  agent-studio spec config --provider proxy --proxy-url <url>\n' +
        '  agent-studio spec config --provider llm-lib --llm-lib-path <path>'
      );
  }
}

async function callCopilotSdk(request: LLMRequest): Promise<LLMResponse> {
  ensureSupportedNodeVersion('copilot-sdk', 20);

  const { CopilotClient, approveAll } = await loadCopilotSdk();
  const client = new CopilotClient({
    autoStart: false,
    githubToken: getCopilotSdkGitHubToken(),
    useLoggedInUser: getCopilotSdkUseLoggedInUser(),
    logLevel: 'error',
  });

  try {
    await client.start();

    const authStatus = await client.getAuthStatus();
    if (!authStatus.isAuthenticated) {
      const statusDetails = authStatus.statusMessage ? ` ${authStatus.statusMessage}` : '';
      throw new Error(
        'GitHub Copilot authentication is required for the copilot-sdk provider.'
        + ` Run \`copilot auth login\` or configure \`--github-token\`.${statusDetails}`
      );
    }

    const prompt = buildCopilotSdkPrompt(request.messages);
    if (!prompt) {
      throw new Error('Copilot SDK requests require at least one non-empty message.');
    }

    const session = await client.createSession({
      model: request.model || getDefaultModel('copilot-sdk'),
      systemMessage: request.system ? { content: request.system } : undefined,
      availableTools: [],
      onPermissionRequest: approveAll,
    });

    const response = await session.sendAndWait({ prompt });
    return {
      content: extractCopilotSdkContent(response),
      raw: {
        authStatus,
        response,
      },
    };
  } catch (error) {
    throw new Error(formatCopilotSdkError(error));
  } finally {
    await client.stop();
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

async function callLlmLib(request: LLMRequest): Promise<LLMResponse> {
  const llmLibUrl = getLlmLibUrl();
  const llmLibPath = getLlmLibPath();
  const tool = getLlmLibTool();

  await ensureLlmLibReady(llmLibUrl, llmLibPath);

  const response = await axios.post(`${llmLibUrl}/api/chat`, {
    tool,
    arguments: {
      prompt: buildLlmLibPrompt(request.messages),
      system: request.system,
      max_tokens: request.max_tokens,
      temperature: request.temperature,
    },
  }, {
    responseType: 'stream',
    headers: {
      Accept: 'text/event-stream',
      'content-type': 'application/json',
    },
    timeout: 310000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  const data = await readLlmLibSse(response.data as NodeJS.ReadableStream);
  return { content: data, raw: { tool, url: llmLibUrl } };
}

function extractCopilotSdkContent(response: CopilotMessageResponse | undefined): string {
  const content = response?.data?.content;
  return typeof content === 'string' ? content.trim() : '';
}

async function loadCopilotSdk(): Promise<CopilotSdkModule> {
  if (!copilotSdkModulePromise) {
    copilotSdkModulePromise = dynamicImport('@github/copilot-sdk')
      .then((module) => module as CopilotSdkModule)
      .catch((error) => {
        copilotSdkModulePromise = null;
        throw error;
      });
  }

  return copilotSdkModulePromise;
}

function ensureSupportedNodeVersion(providerName: string, minimumMajor: number): void {
  const currentMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
  if (!Number.isNaN(currentMajor) && currentMajor < minimumMajor) {
    throw new Error(`${providerName} requires Node.js ${minimumMajor} or newer. Current runtime: ${process.versions.node}.`);
  }
}

function formatCopilotSdkError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Cannot find package') || message.includes('ERR_MODULE_NOT_FOUND')) {
    return 'Copilot SDK dependency is missing. Run `npm install` in agent-studio-cli before using the copilot-sdk provider.';
  }
  return `Copilot SDK request failed: ${message}`;
}

async function ensureLlmLibReady(llmLibUrl: string, llmLibPath?: string): Promise<void> {
  if (await isLlmLibReady(llmLibUrl)) {
    return;
  }

  const parsedUrl = new URL(llmLibUrl);
  const isLocalUrl = ['127.0.0.1', 'localhost', '::1'].includes(parsedUrl.hostname);
  if (!isLocalUrl) {
    throw new Error(`llm-lib is not reachable at ${llmLibUrl}`);
  }

  if (!llmLibPath) {
    throw new Error(
      `llm-lib is not running at ${llmLibUrl}. Configure a local install path with ` +
      '`agent-studio spec config --provider llm-lib --llm-lib-path <path>` or set LLM_LIB_URL to a running server.'
    );
  }

  if (!llmLibStartupPromise) {
    llmLibStartupPromise = startLlmLibAndWait(llmLibPath, llmLibUrl).finally(() => {
      llmLibStartupPromise = null;
    });
  }

  await llmLibStartupPromise;
}

async function startLlmLibAndWait(llmLibPath: string, llmLibUrl: string): Promise<void> {
  startLlmLibUi(llmLibPath);
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await isLlmLibReady(llmLibUrl)) {
      return;
    }
    await delay(1000);
  }
  throw new Error(`Timed out waiting for llm-lib to start at ${llmLibUrl}`);
}

function startLlmLibUi(llmLibPath: string): void {
  const resolvedPath = path.resolve(llmLibPath);
  const packageJsonPath = path.join(resolvedPath, 'package.json');
  const uiServerPath = path.join(resolvedPath, 'ui', 'server.js');

  if (!existsSync(packageJsonPath) || !existsSync(uiServerPath)) {
    throw new Error(`Invalid llm-lib path: ${resolvedPath}`);
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCommand, ['run', 'ui'], {
    cwd: resolvedPath,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });

  child.unref();
}

async function isLlmLibReady(llmLibUrl: string): Promise<boolean> {
  try {
    const response = await axios.get(`${llmLibUrl}/api/config`, {
      timeout: 1500,
      validateStatus: (status) => status >= 200 && status < 300,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function readLlmLibSse(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    let content = '';
    let errorMessage: string | null = null;

    const flushEvent = (eventBlock: string) => {
      const payload = parseLlmLibSseEvent(eventBlock);
      if (!payload) {
        return;
      }

      if (payload.type === 'delta' && typeof payload.content === 'string') {
        content += payload.content;
      }

      if (payload.type === 'error') {
        errorMessage = payload.message || payload.content || 'Unknown llm-lib error';
      }
    };

    stream.setEncoding('utf8');
    stream.on('data', (chunk: string) => {
      buffer += chunk;

      let delimiterIndex = buffer.search(/\r?\n\r?\n/);
      while (delimiterIndex >= 0) {
        const eventBlock = buffer.slice(0, delimiterIndex);
        const delimiterLength = buffer.startsWith('\r\n\r\n', delimiterIndex) ? 4 : 2;
        buffer = buffer.slice(delimiterIndex + delimiterLength);
        flushEvent(eventBlock);
        delimiterIndex = buffer.search(/\r?\n\r?\n/);
      }
    });

    stream.on('end', () => {
      if (buffer.trim()) {
        flushEvent(buffer);
      }

      if (errorMessage) {
        reject(new Error(errorMessage));
        return;
      }

      resolve(content.trim());
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

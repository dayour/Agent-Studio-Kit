import Conf from 'conf';

interface ConfigStore {
  defaultEnvironment?: string;
  lastUsedProfile?: string;
  recentSolutions?: string[];
  anthropicApiKey?: string;
  llmProvider?: 'anthropic' | 'proxy' | 'llm-lib' | 'copilot-sdk';
  llmProxyUrl?: string;
  llmLibPath?: string;
  llmLibUrl?: string;
  llmLibTool?: string;
  copilotSdkGithubToken?: string;
  copilotSdkUseLoggedInUser?: boolean;
  defaultModel?: string;
}

export const config = new Conf<ConfigStore>({
  projectName: 'agent-studio-cli',
  defaults: {
    recentSolutions: []
  }
});

export function setDefaultEnvironment(envUrl: string): void {
  config.set('defaultEnvironment', envUrl);
}

export function getDefaultEnvironment(): string | undefined {
  return config.get('defaultEnvironment');
}

export function setLastUsedProfile(profileName: string): void {
  config.set('lastUsedProfile', profileName);
}

export function getLastUsedProfile(): string | undefined {
  return config.get('lastUsedProfile');
}

export function addRecentSolution(solutionName: string): void {
  const recent = config.get('recentSolutions') || [];
  const filtered = recent.filter(s => s !== solutionName);
  filtered.unshift(solutionName);
  config.set('recentSolutions', filtered.slice(0, 10));
}

export function getRecentSolutions(): string[] {
  return config.get('recentSolutions') || [];
}

export function setAnthropicApiKey(key: string): void {
  config.set('anthropicApiKey', key);
}

export function getAnthropicApiKey(): string | undefined {
  return config.get('anthropicApiKey');
}

export function setLlmProvider(provider: 'anthropic' | 'proxy' | 'llm-lib' | 'copilot-sdk'): void {
  config.set('llmProvider', provider);
}

export function getLlmProvider(): 'anthropic' | 'proxy' | 'llm-lib' | 'copilot-sdk' | undefined {
  return config.get('llmProvider');
}

export function setLlmProxyUrl(url: string): void {
  config.set('llmProxyUrl', url);
}

export function getLlmProxyUrl(): string | undefined {
  return config.get('llmProxyUrl');
}

export function setLlmLibPath(llmLibPath: string): void {
  config.set('llmLibPath', llmLibPath);
}

export function getLlmLibPath(): string | undefined {
  return config.get('llmLibPath');
}

export function setLlmLibUrl(url: string): void {
  config.set('llmLibUrl', url);
}

export function getLlmLibUrl(): string | undefined {
  return config.get('llmLibUrl');
}

export function setLlmLibTool(tool: string): void {
  config.set('llmLibTool', tool);
}

export function getLlmLibTool(): string | undefined {
  return config.get('llmLibTool');
}

export function setCopilotSdkGithubToken(token: string): void {
  config.set('copilotSdkGithubToken', token);
}

export function getCopilotSdkGithubToken(): string | undefined {
  return config.get('copilotSdkGithubToken');
}

export function setCopilotSdkUseLoggedInUser(useLoggedInUser: boolean): void {
  config.set('copilotSdkUseLoggedInUser', useLoggedInUser);
}

export function getCopilotSdkUseLoggedInUser(): boolean | undefined {
  return config.get('copilotSdkUseLoggedInUser');
}

export function setDefaultModel(model: string): void {
  config.set('defaultModel', model);
}

export function getDefaultModel(): string {
  return config.get('defaultModel') || 'claude-sonnet-4-5-20250514';
}

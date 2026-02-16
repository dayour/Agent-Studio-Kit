import Conf from 'conf';

interface ConfigStore {
  defaultEnvironment?: string;
  lastUsedProfile?: string;
  recentSolutions?: string[];
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

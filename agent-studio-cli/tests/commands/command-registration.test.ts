import { auditCommand } from '../../src/commands/audit';
import { schemaCommand } from '../../src/commands/schema';

describe('command registration', () => {
  it('registers the expected schema subcommands', () => {
    expect(schemaCommand.commands.map((command) => command.name())).toEqual([
      'list',
      'show',
      'validate',
    ]);
  });

  it('registers the expected audit subcommands', () => {
    expect(auditCommand.commands.map((command) => command.name())).toEqual([
      'init-config',
      'validate-config',
      'map-agent',
      'run',
    ]);
  });
});

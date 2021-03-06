import * as commander from 'commander';
import { Util, CompletionConfig } from '@travetto/cli/src/util';

export function init() {
  return Util.program.command('email-template').action(async (cmd: commander.Command) => {
    const { Server } = await import('@travetto/cli/src/http');
    const { PhaseManager } = await import('@travetto/base');
    await PhaseManager.run();

    const { serverHandler } = await import('./email-server');

    new Server({
      handler: await serverHandler(),
      port: 3839,
      open: true
    }).run();
  });
}

export function complete(c: CompletionConfig) {
  c.all.push('email-template');
}
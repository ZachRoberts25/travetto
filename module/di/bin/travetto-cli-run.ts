import * as fs from 'fs';
import * as commander from 'commander';

import { Util, CompletionConfig } from '@travetto/cli/src/util';

import { handleFailure, getAppList, getParamType, runApp, getAppByName, CachedAppConfig } from './lib';
const { colorize } = Util;

interface DiCommand {
  watchReal: boolean;
  env?: string;
}

function getAppUsage(app: CachedAppConfig) {
  let usage = app.name;

  if (app.params) {
    usage = `${colorize.identifier(usage)} ${app.params.map(x => {
      const type = colorize.type(getParamType(x));
      const nm = colorize.param(x.name);
      const def = x.def !== undefined ? colorize.input(x.def) : undefined;

      return x.optional ?
        (x.def !== undefined ?
          `[${nm}:${type}=${def}]` :
          `[${nm}:${type}]`
        ) : `${nm}:${type}`;
    }).join(' ')}`;
  }

  return usage;
}

function generateAppHelpList(apps: CachedAppConfig[], cmd: DiCommand) {
  const choices = [];
  for (const conf of apps) {
    const lines = [];

    const root = conf.appRoot !== '.' ? `[${colorize.subtitle(conf.appRoot)}${!conf.standalone ? '^' : ''}] ` : '';
    const usage = getAppUsage(conf);

    const features = [];
    let featureStr = '';
    if (cmd.watchReal || (conf.watchable && cmd.env !== 'prod')) {
      features.push('{watch}');
    }
    if (features.length) {
      featureStr = ` | ${features.join(' ')}`;
    }

    lines.push(`${root}${colorize.identifier(conf.name)}${featureStr}`);
    if (conf.description) {
      lines.push(`desc:  ${colorize.description(conf.description || '')}`);
    }
    lines.push(`usage: ${usage}`);

    const len = lines.reduce((acc, v) => Math.max(acc, v.replace(/\x1b\[\d+m/g, '').length), 0);
    lines.splice(1, 0, '-'.repeat(len));

    choices.push(lines.join('\n     '));
  }
  return choices.map(x => `   ● ${x}`).join('\n\n');
}

export function init() {
  let listHelper: Function;

  return Util.program
    .command('run [application] [args...]')
    .on('--help', () => {
      console.log(`\n${Util.colorize.title('Available Applications:')}`);
      if (listHelper) {
        console.log();
        console.log(listHelper());
      } else {
        console.log(`\nNo applications defined, use ${colorize.type('@Application')} to registry entry points`);
      }
      console.log();
    })
    .allowUnknownOption()
    .option('-e, --env [env]', 'Application environment (dev|prod), (default: dev)', /^(dev|prod)$/i)
    .option('-a, --app [app]', 'Application root, defaults to associated root by name')
    .option('-w, --watch [watch]', 'Run the application in watch mode, (default: auto)', /^(1|0|yes|no|on|off|auto|true|false)$/i)
    .option('-p, --profile [profile]', 'Specify additional application profiles', (v, ls) => { ls.push(v); return ls; }, [])
    .action(async (app: string, args: string[], cmd: commander.Command & DiCommand) => {
      cmd.env = cmd.env || process.env.ENV || process.env.env || undefined;
      cmd.watchReal = /^(1|yes|on|true)$/.test(cmd.watch || '');

      cmd.profile = [
        ...(cmd.profile || []),
        ...(process.env.PROFILE || '').split(/,/g)
      ]
        .filter(x => !!x)
        .map(x => x.trim());

      if (cmd.env) {
        process.env.ENV = cmd.env; // Preemptively set b/c env changes how we compile some things
      }

      const apps = await getAppList();
      let selected = apps.find(x => x.name === app);

      if (!app && apps.length === 1) {
        selected = apps[0];
        app = selected.name;
        console.log('No app selected, defaulting to', app, 'as the only target');
      }

      if (!selected) {
        if (apps.length) {
          listHelper = generateAppHelpList.bind(null, apps, cmd);
        }
        Util.showHelp(cmd, app ? `${app} is an unknown application` : 'You must specify an application to run');
      }

      if (cmd.app) {
        process.env.APP_ROOTS = cmd.app;
      }
      if (cmd.env) {
        process.env.ENV = cmd.env;
      }
      if (cmd.profile) {
        process.env.PROFILE = cmd.profile.join(',');
      }
      if (cmd.watch) {
        process.env.WATCH = `${cmd.watch}`;
      }

      try {
        await runApp([app, ...args]);
      } catch (err) {
        if (err.message.startsWith('Invalid parameter')) {
          console.error(err.message);
          console.error();
          console.error(`Usage: ${getAppUsage((await getAppByName(app))!)}`);
        } else {
          handleFailure(err);
        }
        process.exit(1);
      }
    });
}

export async function complete(c: CompletionConfig) {
  const apps = await getAppList();
  const env = ['prod', 'dev'];
  const bool = ['yes', 'no'];
  const profiles = fs.readdirSync(process.cwd())
    .filter(x => x.endsWith('.yml'))
    .map(x => x.replace('.yml', ''));

  profiles.push('application');
  c.all.push('run');
  c.task.run = {
    '': apps.map(x => x.name).concat(['--env', '--watch', '--profile']),
    '--env': env,
    '-e': env,
    '--watch': bool,
    '-w': bool,
    '--profile': profiles,
    '-p': profiles,
  };
}
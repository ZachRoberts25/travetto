import * as fs from 'fs';
import * as child_process from 'child_process';
import { DepResolver } from './resolver';
import { Finalize } from './finalize';
import { Util } from './util';

export function init() {
  DepResolver.init();

  // Init lerna
  child_process.spawnSync('npx', ['lerna', 'clean', '--yes'], { stdio: [undefined, process.stdout, process.stderr], shell: true });
  child_process.spawnSync('npx', ['lerna', 'bootstrap', '--hoist'], { stdio: [undefined, process.stdout, process.stderr], shell: true });

  // Clear out package-lock
  try {
    fs.unlinkSync(`${Util.ROOT}/package-lock.json`);
  } catch (e) { }

  const lj = require('../../lerna.json');

  // Finalize all modules
  for (const dir of lj.packages.map((x: string) => x.split('/')[0])) {
    const base = `${Util.ROOT}/${dir}`;
    for (const mod of fs.readdirSync(base)) {
      Finalize.finalize(mod, base, /^(yes|1|true|on)$/.test(`${process.argv[2]}`));
    }
  }
}
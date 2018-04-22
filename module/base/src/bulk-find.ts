import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

const fsReadFileAsync = util.promisify(fs.readFile);
const fsStat = util.promisify(fs.lstat);
const fsReaddir = util.promisify(fs.readdir);

export interface Entry {
  full: string;
  relative: string;
  stats: fs.Stats;
}

export type Handler = ((stat: Entry) => boolean) | RegExp;

export function buildEntryFromFile(file: string, root: string) {
  const relative = file.replace(`${root}${path.sep}`, '');
  const full = `${root}${path.sep}${relative}`;
  return {
    relative,
    full,
    stats: fs.statSync(file)
  }
}

export async function bulkFind(handlers: Handler[], base?: string) {
  const res = await Promise.all(handlers.map(x => scanDir(x, base)));
  const names = new Set<string>();
  const out = [];
  for (const ls of res) {
    for (const e of ls) {
      if (!names.has(e.full)) {
        names.add(e.full);
        out.push(e);
      }
    }
  }
  return out;
}

export function scanDir(handler: Handler, fullBase?: string, relativeBase = '') {
  return new Promise<Entry[]>(async (resolve, reject) => {
    try {
      const out: Entry[] = [];

      if (!fullBase) {
        fullBase = process.cwd();
      }

      for (const file of (await fsReaddir(fullBase))) {
        const relative = relativeBase ? `${relativeBase}${path.sep}${file}` : file;
        const full = `${fullBase}/${path.sep}/${file}`;
        const stats = await fsStat(full);
        const entry: Entry = { stats, full, relative };

        if (stats.isDirectory()) {
          out.push(...await scanDir(handler, full, relative));
        } else if (handler instanceof RegExp ? handler.test(entry.full) : handler(entry)) {
          out.push(entry);
        }
        resolve(out);
      }
    } catch (e) {
      reject(e);
    }
  });
}

export function bulkFindSync(handlers: Handler[], base?: string) {
  const names = new Set<string>();
  const out = [];
  for (const h of handlers) {
    for (const e of scanDirSync(h, base)) {
      if (!names.has(e.full)) {
        names.add(e.full);
        out.push(e);
      }
    }
  }
  return out;
}

export function scanDirSync(handler: Handler, fullBase?: string, relativeBase = '') {
  let out: Entry[] = [];
  if (!fullBase) {
    fullBase = process.cwd();
  }

  for (const file of fs.readdirSync(fullBase)) {
    const relative = relativeBase ? `${relativeBase}${path.sep}${file}` : file;
    const full = `${fullBase}/${path.sep}/${file}`;
    const stats = fs.lstatSync(full);
    const entry = { stats, full, relative };

    if (stats.isDirectory()) {
      out = out.concat(scanDirSync(handler, full, relative));
    } else if (handler instanceof RegExp ? handler.test(entry.full) : handler(entry)) {
      out.push(entry);
    }
  }
  return out;
}

export function bulkRequire<T = any>(handlers: Handler[]): T[] {
  return bulkFindSync(handlers)
    .map(x => require(x.full))
    .filter(x => !!x); // Return non-empty values
}

export async function bulkRead(handlers: Handler[]) {
  const files = await bulkFind(handlers);
  const promises = files.map(x => fsReadFileAsync(x.full).then(d => ({ name: x.full, data: d.toString() })));
  return await Promise.all(promises);
}

export function bulkReadSync(handlers: Handler[]) {
  const files = bulkFindSync(handlers);
  return files.map(x => ({ name: x.full, data: fs.readFileSync(x.full).toString() }));
}
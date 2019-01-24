import { Class } from './types';

class $PendingRegister {
  map = new Map<string, Class<any>[]>();
  ordered: [string, Class<any>[]][] = [];

  add(cls: Class<any>) {
    if (!this.map.has(cls.__file)) {
      const sub: Class<any>[] = [];
      this.map.set(cls.__file, sub);
      this.ordered.push([cls.__file, sub]);
    }
    this.map.get(cls.__file)!.push(cls);
  }

  flush() {
    const out = this.ordered.slice(0);
    this.map.clear();
    this.ordered = [];
    return out;
  }
}

export const PendingRegister = new $PendingRegister();

export function Register() {
  return (target: Class<any>) => PendingRegister.add(target);
}
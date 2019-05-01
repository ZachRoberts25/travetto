import { CacheStore, CacheEntry } from '../types';

export class MemoryCacheStore<V> extends Map<string, CacheEntry<V>> implements CacheStore<V> {

  constructor(public name: string) {
    super();
  }

  trim(max: number) {
    const keys = [...this.entries()]
      .sort((a, b) => b[1].time - a[1].time)
      .slice(max)
      .map(el => el[0]);
    for (const k of keys) {
      this.delete(k);
    }
  }
}
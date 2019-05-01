import { Shutdown } from '@travetto/base';

import { Cache } from './cache';
import { CacheConfig } from './types';
import { MemoryCacheStore } from './store/memory';

type Simple<T extends Simple<any> = Simple<any>> = { [key: string]: T } | number | string | boolean | T[];

class $CacheFactory<V = Simple> {

  static defaultConfig = {
    max: 1000,
    ttl: Infinity,
    type: MemoryCacheStore
  };

  protected caches = new Map<string, Cache<V>>();

  constructor() {
    Shutdown.onShutdown('Cache Manager', this.destroy.bind(this));
  }

  async get(config: Partial<CacheConfig<V>> & { name: string }) {
    if (!this.caches.has(config.name)) {
      const cache = new Cache<V>({
        ...$CacheFactory.defaultConfig,
        ...(config || {})
      });
      this.caches.set(config.name, cache);
      await cache.init();
    }

    return this.caches.get(config.name)!;
  }

  async clear() {
    await Promise.all([...this.caches.values()].map(x => x.clear()));
  }

  async destroy() {
    await Promise.all([...this.caches.values()].map(x => x.destroy()));
  }
}

export const CacheFactory = new $CacheFactory();
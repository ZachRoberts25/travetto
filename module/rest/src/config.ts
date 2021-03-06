import * as os from 'os';

import { Config } from '@travetto/config';
import { Env, AppError, ResourceManager } from '@travetto/base';

import { SSLUtil } from './util/ssl';

@Config('rest')
export class RestConfig {
  serve = true;
  port = 3000;
  disableGetCache = true;
  trustProxy = false;
  hostname = 'localhost';
  bindAddress?: string;
  baseUrl: string;

  defaultMessage = true;

  ssl: {
    active?: boolean,
    keys?: {
      cert: string,
      key: string
    }
  } = {
      active: false
    };

  postConstruct() {
    if (!this.bindAddress) {
      const useIPv4 = !![...Object.values(os.networkInterfaces())]
        .find(nics => nics.find(nic => nic.family === 'IPv4'));

      this.bindAddress = useIPv4 ? '0.0.0.0' : '::';
    }
    if (this.baseUrl === undefined) {
      this.baseUrl = `http${this.ssl.active ? 's' : ''}://${this.hostname}${[80, 443].includes(this.port) ? '' : `:${this.port}`}`;
    }
  }

  async getKeys() {
    if (this.ssl.active) {
      if (!this.ssl.keys) {
        if (Env.prod) {
          throw new AppError('Cannot use test keys in production', 'permissions');
        }
        return SSLUtil.generateKeyPair();
      } else {
        if (this.ssl.keys.key.length < 100) {
          this.ssl.keys.key = await ResourceManager.read(this.ssl.keys.key, 'utf8');
          this.ssl.keys.cert = await ResourceManager.read(this.ssl.keys.cert, 'utf8');
        }
        return this.ssl.keys;
      }
    }
  }
}

import { Request, Response } from '@travetto/rest';
import { Inject } from '@travetto/di';

import { SessionEncoder } from './encoder';
import { Session } from '../types';
import { SessionEncoderConfig } from './config';

export class HeaderEncoder extends SessionEncoder {

  @Inject()
  config: SessionEncoderConfig;

  async encode(req: Request, res: Response, session: Session<any> | null): Promise<void> {
    if (session) {
      res.setHeader(this.config.keyName, session.id);
    }
    return;
  }

  async decode(req: Request): Promise<string | Session | undefined> {
    return req.header(this.config.keyName);
  }
}
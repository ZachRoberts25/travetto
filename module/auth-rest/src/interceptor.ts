import { AuthContext } from '@travetto/auth';
import { RestInterceptor, Request, Response } from '@travetto/rest';
import { Injectable, Inject } from '@travetto/di';

import { AuthService } from './service';
import { AuthContextEncoder, SessionAuthContextEncoder } from './encoder';

@Injectable()
export class AuthInterceptor extends RestInterceptor {

  @Inject()
  service: AuthService;

  @Inject({ defaultIfMissing: SessionAuthContextEncoder })
  contextStore: AuthContextEncoder;

  async configure(req: Request, res: Response) {
    req.auth = (await this.contextStore.read(req)) || new AuthContext(null as any);
    req.logout = async () => { delete req.auth.principal; };
    req.authenticate = this.service.authenticate.bind(this.service, req, res);
  }

  async intercept(req: Request, res: Response, next: () => Promise<any>) {
    try {
      await this.configure(req, res);

      this.service.registerContext(req);

      return await next();
    } finally {
      await this.contextStore.write(req, res);
    }
  }
}
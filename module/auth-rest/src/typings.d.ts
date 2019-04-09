import { Identity, AuthContext } from '@travetto/auth';

declare global {
  namespace Travetto {
    export interface Request {
      auth: AuthContext;
      logout(): Promise<void>;
      authenticate(providers: (symbol | string)[]): Promise<Identity | undefined>;
    }
  }
}
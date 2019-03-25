import { Inject } from '@travetto/di';
import { Controller, Get, Redirect, Post, Request } from '@travetto/rest';

import { Authenticate, Authenticated, Unauthenticated, AuthService } from '../..';
import { SIMPLE_AUTH } from './conf';

@Controller('/auth')
export class SampleAuth {

  @Inject()
  private state: AuthService;

  @Get('/name')
  async getName() {
    return { name: 'bob' };
  }

  @Get('/simple')
  @Authenticate(SIMPLE_AUTH)
  async simpleLogin() {
    return new Redirect('/auth/self', 301);
  }

  @Get('/self')
  @Authenticated()
  async getSelf(req: Request) {
    return req.auth.principal;
  }

  @Get('/logout')
  @Authenticated()
  async logout(req: Request) {
    await req.logout();
  }
}
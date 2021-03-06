import * as koa from 'koa';
import { RestAppUtil } from '@travetto/rest';

const TRV_RES = Symbol('TRV_RES');
const TRV_REQ = Symbol('TRV_REQ');

export class KoaAppUtil {
  static getRequest(ctx: koa.ParameterizedContext) {
    if (!(ctx as any)[TRV_REQ]) {
      (ctx as any)[TRV_REQ] = RestAppUtil.decorateRequest({
        __og: ctx,
        __raw: ctx.req,
        protocol: ctx.protocol,
        method: ctx.request.method,
        path: ctx.request.path,
        query: ctx.request.query,
        params: ctx.params,
        body: ctx.request.body,
        session: ctx.session,
        headers: ctx.request.headers,
        cookies: ctx.cookies,
        files: {},
        auth: undefined as any,
        pipe: ctx.req.pipe.bind(ctx.req),
        on: ctx.req.on.bind(ctx.req)
      });
    }
    return (ctx as any)[TRV_REQ] as Travetto.Request;
  }

  static getResponse(ctx: koa.ParameterizedContext) {
    if (!(ctx as any)[TRV_RES]) {
      (ctx as any)[TRV_RES] = RestAppUtil.decorateResponse({
        __og: ctx,
        __raw: ctx.res,
        get headersSent() {
          return ctx.headerSent;
        },
        status(value?: number) {
          if (value) {
            ctx.status = value;
          } else {
            return ctx.status;
          }
        },
        send: (b) => {
          ctx.body = b;
        },
        on: ctx.res.on.bind(ctx.res),
        end: (val?: any) => {
          if (val) {
            ctx.body = val;
          }
          ctx.flushHeaders();
          if (ctx.status < 200 || (ctx.status < 400 && ctx.status >= 300)) {
            ctx.res.end(); // Only end on redirect
          }
        },
        setHeader: ctx.response.set.bind(ctx),
        getHeader: ctx.response.get.bind(ctx),
        removeHeader: ctx.response.remove.bind(ctx),
        write: ctx.res.write.bind(ctx.res),
        cookies: ctx.cookies,
      });
    }
    return (ctx as any)[TRV_RES] as Travetto.Response;
  }
}
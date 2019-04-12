import { Class } from '@travetto/registry';

export type HeaderMap = { [key: string]: (string | (() => string)) };

export type Method = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
export type PathType = string | RegExp;

export type Request = Travetto.Request;
export type Response = Travetto.Response;

export type RouteHandler<T = any> = (...args: any[]) => Promise<T> | T | void;

export type Filter<T = any> = (req: Request, res: Response) => Promise<T> | T | void;

export interface ParamConfig {
  name?: string;
  description?: string;
  required?: boolean;
  location: 'path' | 'query' | 'body' | 'header' | 'request' | 'response';
  type: Class;
  resolve?: Filter;
  defaultValue?: any;
  extract(config: ParamConfig, req?: Request, res?: Response): any;
}

export interface RouteConfig {
  instance?: any;
  method: Method;
  path: PathType;
  handler: RouteHandler;
  handlerFinalized?: Filter;
  params: ParamConfig[];
}

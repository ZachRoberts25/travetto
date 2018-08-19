/// <reference path="./types.d.ts" />

import { Class } from '@travetto/registry';

export type HeaderMap = { [key: string]: (string | (() => string)) };

export type Method = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
export type PathType = string | RegExp;

export interface DescribableConfig {
  title?: string;
  description?: string;
}

export interface ParamConfig {
  name: string;
  description?: string;
  required?: boolean;
  location: 'path' | 'query' | 'body';
  type?: Class;
}

interface CoreConfig {
  class: Class;
  instance?: any;

  filters: Filter[];
  headers: HeaderMap;
}

export interface EndpointClassType {
  type: Class;
  wrapper?: Class;
  description?: string;
}

export interface EndpointSimpleType {
  mime: string;
  type: string;
}

export type EndpointIOType = EndpointClassType | EndpointSimpleType;

export interface EndpointConfig extends CoreConfig, DescribableConfig {
  id: string;
  path: PathType;
  priority: number;
  method: Method;
  handler: Filter;
  handlerName: string;
  handlerFinalized?: Filter;
  params: { [key: string]: ParamConfig };
  responseType?: EndpointIOType;
  requestType?: EndpointIOType;
}

export interface ControllerConfig extends CoreConfig, DescribableConfig {
  basePath: string;
  endpoints: EndpointConfig[];
}

export type Filter<T = any> = (req: Request, res: Response) => T;
export type FilterReq<T = any> = (req: Request) => T;
export type FilterNone<T = any> = () => T;

export interface EndpointDecorator<T = any> {
  (target: any, prop: string | symbol, descriptor: TypedPropertyDescriptor<FilterNone<T>>): TypedPropertyDescriptor<FilterNone<T>> | undefined;
  (target: any, prop: string | symbol, descriptor: TypedPropertyDescriptor<FilterReq<T>>): TypedPropertyDescriptor<FilterReq<T>> | undefined;
  (target: any, prop: string | symbol, descriptor: TypedPropertyDescriptor<Filter<T>>): TypedPropertyDescriptor<Filter<T>> | undefined;
}

export interface ControllerDecorator<T = any> {
  (target: Class<T>): Class<T> | undefined;
}

export abstract class RestAppProvider<T = any> {
  abstract get _raw(): T;
  abstract init(): Promise<any>;
  abstract registerController(controller: ControllerConfig): Promise<any>;
  abstract unregisterController(controller: ControllerConfig): Promise<any>;
  abstract listen(port?: number): void;
}

export abstract class RestInterceptor {

  public after?: Class<RestInterceptor>[] | Set<Class<RestInterceptor>> | Class<RestInterceptor>;
  public before?: Class<RestInterceptor>[] | Set<Class<RestInterceptor>> | Class<RestInterceptor>;

  abstract intercept(req: Request, res: Response): Promise<any>;
}

export class RestInterceptorSet {
  public interceptors: Set<Class<RestInterceptor>>;
  constructor(...interceptors: Class<RestInterceptor>[]) {
    this.interceptors = new Set(interceptors);
  }
}

export type Request = Travetto.Request;
export type Response = Travetto.Response;

export interface TypedQuery<T> extends Request {
  query: T;
}
export interface TypedBody<T> extends Request {
  body: T;
}
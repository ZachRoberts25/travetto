import { Request, Response } from 'express';
import * as qs from 'querystring';

import { ControllerRegistry, AppError } from '@travetto/express';
import { Util } from '@travetto/base';
import { Class } from '@travetto/registry';

import { SchemaRegistry, BindUtil, SchemaValidator, ValidationErrors } from '../src';

// tslint:disable:no-invalid-this
(ValidationErrors as any as Class<Error>).prototype.render = function (res: Response) {
  res.status(403).json({
    message: this.message,
    errors: this.errors,
    status: 403,
    type: this.name
  });
};
// tslint:enable:no-invalid-this

function getBound<T>(cls: Class<T>, obj: any, view?: string) {
  try {
    return BindUtil.bindSchema(cls, new cls(), obj, view);
  } catch (e) {
    throw new AppError(`Supplied data is incompatible with ${cls.__id}: ${e.message}`);
  }
}

export async function getSchemaBody<T>(req: Request, cls: Class<T>, view?: string) {
  if (Util.isPlainObject(req.body)) {
    const o = getBound(cls, req.body, view);
    if (SchemaRegistry.has(cls)) {
      return await SchemaValidator.validate(o, view);
    } else {
      return o;
    }
  } else {
    throw new AppError(`Body is missing or wrong type: ${req.body}`, 503);
  }
}

export function SchemaBody<T>(cls: Class<T>, view?: string) {
  return ControllerRegistry.createFilterDecorator(async (req: Request, res: Response) => {
    req.body = await getSchemaBody(req, cls, view);
  });
}

export function SchemaQuery<T>(cls: Class<T>, view?: string) {
  return ControllerRegistry.createFilterDecorator(async (req: Request, res: Response) => {

    const o = getBound(cls, BindUtil.expandPaths(qs.parse(req.query)), view);
    if (SchemaRegistry.has(cls)) {
      req.query = await SchemaValidator.validate(o, view);
    } else {
      req.query = o;
    }
  });
}
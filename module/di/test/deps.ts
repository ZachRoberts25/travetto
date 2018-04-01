import { Injectable, Inject, InjectableFactory } from '../src';
import { DbConfig, AltConfig, Empty } from './config';

@Injectable()
export class Database {
  @Inject() dbConfig: DbConfig<any, any>;
  @Inject({ optional: true }) altConfig: AltConfig;

  postConstruct() {
    console.log('Creating database', this.dbConfig.getUrl());
  }

  query() {
    console.log('Getting 350', this.dbConfig.getUrl());
  }
}

@Injectable()
export class Service {

  constructor(public db: Database) {
    console.log('Creating service', db);
  }

  doWork() {
    this.db.query();
  }
}

@Injectable()
export class ServiceInherit extends Service {
  name = 'bob';
  age = 30;
  doWork() {
    this.db.query();
  }
}

export const SERVICE_INHERIT_2 = Symbol()

@Injectable({ qualifier: SERVICE_INHERIT_2 })
export class ServiceInherit2 extends ServiceInherit {
  age = 31;
}

export const CUSTOM_SERVICE_INHERIT = Symbol('Custom');
export const CUSTOM_DATABSE = Symbol('CUSTOM DB');
export const CUSTOM_EMPTY = Symbol('Custom EMPTY');

class TestConfig {
  @InjectableFactory(CUSTOM_EMPTY)
  static getNewEmpty(): Empty {
    const out = new Empty();
    out.age = 20;
    console.log('Custom EMPTY 1', out);
    return out;
  }

  @InjectableFactory(CUSTOM_SERVICE_INHERIT)
  static getObject(@Inject(SERVICE_INHERIT_2) svc: ServiceInherit): ServiceInherit {
    return new ServiceInherit2(svc.db);
  }

  @InjectableFactory(CUSTOM_DATABSE)
  static getCustomDB(config: DbConfig<any, any>, @Inject(CUSTOM_EMPTY) empty: Empty): Database {
    console.log('Custom EMPTY 2', empty);
    const ret = new Database();
    config.temp = 'any';
    ret.dbConfig = config;
    ret.dbConfig.empty = empty;
    return ret;
  }
}

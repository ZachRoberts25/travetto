import * as assert from 'assert';

import { Suite, Test, BeforeAll } from '@travetto/test';

import { Logger } from '../src/service';
import { LogEvent } from '../src/types';
import { JsonFormatter } from '../src/formatter/json';

@Suite('Suite')
class LoggerTest {

  @BeforeAll()
  async init() {
    Logger.removeAll();
  }

  @Test('Should Log')
  async shouldLog() {
    const events: LogEvent[] = [];
    Logger.listenRaw('test', (e) => {
      events.push(e);
    });
    console.log('Hello', 1, 2, 3);
    assert(events.length === 1);
    assert(events[0].message === '[@app/test.logger: 23]');
    assert.deepStrictEqual(events[0].args, ['Hello', 1, 2, 3]);
  }

  @Test('Formatter')
  async shouldFormat() {
    const formatter = new JsonFormatter({});
    const now = Date.now();
    assert(formatter.format({ level: 'error', timestamp: now }) === `{"level":"error","timestamp":${now}}`);
  }
}

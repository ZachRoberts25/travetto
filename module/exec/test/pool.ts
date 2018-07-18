import * as assert from 'assert';
import { Suite, Test } from '@travetto/test';
import { ConcurrentPool, ArrayDataSource, IteratorDataSource } from '@travetto/pool';

import { ChildExecution } from '../src';

@Suite()
export class PoolExecTest {

  @Test()
  async simple() {

    const pool = new ConcurrentPool<ChildExecution>(async () => {
      console.log('Initializing child');
      const child = new ChildExecution(`${__dirname}/simple.child-launcher.js`, true, {
        env: { SRC: './simple.child' }
      });
      child.init();
      await child.listenOnce('ready');
      console.log('Child ready');
      return child;

    }, { max: 1 });

    await pool.process(
      //  new ArrayDataSource(['a', 'b', 'c', 'd', 'e', 'f', 'g']),
      new IteratorDataSource(function* () {
        for (let i = 0; i < 5; i++) {
          yield `${i}-`;
        }
      }),
      async (i: string, exe: ChildExecution) => {
        const res = exe.listenOnce('response');
        exe.send('request', { data: i });
        const { data } = await res;
        console.log('Sent', i, 'Received', data);
        await new Promise(r => setTimeout(r, 100));
      }
    );

    await pool.shutdown();
  }
}
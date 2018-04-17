import { Suite, Test } from '@travetto/test';
import { projectQuery } from '..';
import * as assert from 'assert';

@Suite()
export class QueryTest {

  @Test()
  async validateQuery() {
    let out = projectQuery({ a: { b: { c: 5 } } }, '');
    assert(out['a.b.c'] === 5);

    out = projectQuery({
      $and: [
        { a: { b: { c: 5 } } },
        { d: { e: true } },
        {
          $or: [{ name: 5 }, { age: 10 }]
        },
        { g: { z: ['a', 'b', 'c'] } },
        { a: { d: { $gt: 20 } } }
      ]
    }, '');

    assert(out.$and[0]['a.b.c'] === 5);

    assert(out.$and[1]['d.e'] === true);

    assert(out.$and[2].$or[0]['name'] === 5);

    assert(out.$and[2].$or[1]['age'] === 10);

    assert(out.$and[4]['a.d'].$gt === 20);

    assert(out.$and[3]['g.z'].length === 3)
  }
}
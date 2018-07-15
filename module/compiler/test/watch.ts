import { Suite, Test } from '@travetto/test';
import * as compiler from '../src/compiler';

@Suite()
class WatchTest {
  @Test()
  async testWatch() {
    setInterval(() => {
      console.log(compiler.Compiler.cwd);
    }, 2000);
  }
}

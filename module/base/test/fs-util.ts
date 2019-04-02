import * as assert from 'assert';

import { Test, Suite } from '@travetto/test';

import { FsUtil } from '../bootstrap/fs-util';

@Suite()
class FsUtilTests {

  @Test()
  async buildModuleName() {
    const modName = FsUtil.computeModuleFromFile(__filename);
    assert(modName === '@app/test.fs-util');

    const modName2 = FsUtil.computeModuleFromFile('node_modules/@travetto/base/bootstrap/fs-util.js');
    assert(modName2 === '@trv:base/bootstrap.fs-util');
  }

}
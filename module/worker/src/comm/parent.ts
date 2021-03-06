import * as child_process from 'child_process';
import { ExecutionState, ExecutionResult } from '@travetto/exec';

import { CommEvent } from './types';
import { ProcessCommChannel } from './channel';
import { CommUtil } from './util';

export class ParentCommChannel<U extends CommEvent = CommEvent> extends ProcessCommChannel<child_process.ChildProcess, U> {

  private complete: Promise<ExecutionResult>;

  constructor(state: ExecutionState) {
    super(state.process);
    this.complete = state.result
      .finally(() => { delete this.proc; });
  }

  async destroy() {
    if (this.proc) {
      CommUtil.killSpawnedProcess(this.proc);
      await this.complete;
    }

    return super.destroy();
  }
}
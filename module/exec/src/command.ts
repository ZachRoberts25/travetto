import { Env } from '@travetto/base';
import { ExecUtil } from './util';
import { DockerContainer } from './docker';
import { ExecutionResult, CommonProcess } from './types';

export class CommandService {

  private _initPromise: Promise<any>;

  container: DockerContainer;

  constructor(private config: {
    image: string;
    imageStartCommand?: string;
    checkForLocal?: () => Promise<boolean>;
    imageCommand?: (args: string[]) => string[];
    processCommand?: (args: string[]) => string[];
    docker?: boolean;
  }) { }

  async _init() {
    const canUseDocker = Env.docker && (this.config.docker === undefined || !!this.config.docker);
    const useDocker = canUseDocker && (!this.config.checkForLocal || !(await this.config.checkForLocal()));

    if (useDocker) {
      this.container = new DockerContainer(this.config.image)
        .forceDestroyOnShutdown()
        .setInteractive(true);

      await this.container.create([], [this.config.imageStartCommand || '/bin/sh']);
      await this.container.start();
    }
  }

  async init() {
    if (!this._initPromise) {
      this._initPromise = this._init();
    }
    return await this._initPromise;
  }

  async exec(...args: string[]) {
    await this.init();

    let exec;
    if (this.container) {
      const cmd = this.config.imageCommand ? this.config.imageCommand(args) : args;
      exec = this.container.exec(['-i'], cmd);
    } else {
      const cmd = this.config.processCommand ? this.config.processCommand(args) : args;
      exec = ExecUtil.spawn(cmd[0], cmd.slice(1), { quiet: true });
    }
    return exec as [CommonProcess, Promise<ExecutionResult>];
  }
}
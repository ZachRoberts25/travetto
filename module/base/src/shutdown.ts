import { Env } from './env';

const px = process.exit;

const MAX_SHUTDOWN_TIME = parseInt(Env.get('MAX_SHUTDOWN_WAIT', '2000'), 10);

export class Shutdown {
  private static listeners: { name: string, handler: Function }[] = [];
  private static shutdownCode = -1;

  private static async _execute(exitCode: number = 0, err?: any) {

    if (this.shutdownCode > 0) {
      // Handle force kill
      if (exitCode > 0) {
        px(exitCode);
      } else {
        return;
      }
    }

    this.shutdownCode = exitCode;

    const listeners = this.listeners.slice(0);
    this.listeners = [];

    try {
      if (err && typeof err !== 'number') {
        Env.error(err);
      }

      this.listeners = [];

      const promises: Promise<any>[] = [];

      for (const listener of listeners) {
        const { name, handler } = listener;

        try {
          console.debug(`[Shutdown] Starting ${name}`);
          const res = handler();
          if (res && res.then) {
            promises.push(res as Promise<any>);
            res
              .then(() => console.debug(`Completed shut down ${name}`))
              .catch((e: any) => Env.error('[Shutdown]', `Failed shut down of ${name}`, e));
          } else {
            console.debug('[Shutdown]', `Completed shut down ${name}`);
          }
        } catch (e) {
          Env.error('[Shutdown]', `Failed shut down of ${name}`, e);
        }
      }

      if (promises.length) {
        const finalRun = Promise.race([
          ...promises,
          new Promise((r, rej) => setTimeout(() => rej(new Error('Timeout on shutdown')), MAX_SHUTDOWN_TIME))
        ]);
        await finalRun;
      }

    } catch (e) {
      Env.error('[Shutdown]', e);
    }

    if (this.shutdownCode >= 0) {
      px(this.shutdownCode);
    }
  }

  static register() {
    process.exit = this.execute.bind(this);
    process.on('exit', this.execute.bind(this));
    process.on('SIGINT', this.execute.bind(this, 130));
    process.on('SIGTERM', this.execute.bind(this, 143));
    process.on('uncaughtException', this.execute.bind(this, 1));
    process.on('unhandledRejection', (err, p) => {
      if (err && (err.message || '').includes('Cannot find module') && Env.watch) { // Handle module reloading
        Env.error(err);
      } else {
        this.execute(1, err);
      }
    });
  }

  static onShutdown(name: string, handler: Function) {
    this.listeners.push({ name, handler });
  }

  static execute(exitCode: number = 0, err?: any) {
    this._execute(exitCode, err);
  }

}
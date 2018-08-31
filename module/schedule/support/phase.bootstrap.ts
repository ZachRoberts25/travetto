export const init = {
  after: 'base',
  key: 'schedule',
  action: () => {
    const { Shutdown } = require('@travetto/base');
    const { Scheduler } = require('../src/service');
    Shutdown.onShutdown('schedule.kill', () => Scheduler.kill());
  }
};
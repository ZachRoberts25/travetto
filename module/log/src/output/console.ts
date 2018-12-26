export interface ConsoleOutputOpts {
  method: 'log' | 'error';
}

export function consoleOutput(opts: ConsoleOutputOpts) {
  return (message: string) => (console as any)[opts.method](message);
}
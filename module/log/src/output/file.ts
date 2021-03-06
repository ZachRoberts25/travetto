import * as fs from 'fs';

export interface FileOutputOpts {
  file: string;
}

export class FileOutput {
  stream: fs.WriteStream;

  constructor(private opts: FileOutputOpts) {
    this.stream = fs.createWriteStream(opts.file, {
      autoClose: true,
      flags: 'a'
    });
  }
  output(msg: string) {
    this.stream.write(`${msg}\n`);
  }
}
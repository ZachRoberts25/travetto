import { AppError } from '@travetto/base';

export interface ValidationError {
  message: string;
  path: string;
}

export class ValidationErrors extends AppError<ValidationError[]> {
  constructor(public errors: ValidationError[]) {
    super(`Validation Errors`);
  }

  toString() {
    return this.message + (this.errors && this.errors.length ? `:\n  ${this.errors!.map(x => x.message).join('\n  ')}` : '');
  }
}

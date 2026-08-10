import { ValidationError } from 'class-validator';
import { HttpError } from 'routing-controllers';

export class HttpException extends HttpError {
  public status: number;
  public override message: string;
  public errors?: ValidationError[];

  constructor(status: number, message: string) {
    super(status, message);
    this.status = status;
    this.message = message;
  }
}

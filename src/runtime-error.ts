import { Token } from './token';

export class RuntimeError
  extends Error {
  public token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}

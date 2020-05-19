import {
  LoxLiteral,
  Token,
} from './token';
import { RuntimeError } from './runtime-error';

export class Environment {
  public enclosing?: Environment;
  private values: Map<string, LoxLiteral> = new Map();

  public constructor(enclosing?: Environment) {
    if (enclosing) this.enclosing = enclosing;
  }

  public assign(name: Token, value: LoxLiteral) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }
    throw new RuntimeError(name, `Undefined variable "${name.lexeme}".`)
  }

  public define(name: string, value: LoxLiteral) {
    this.values.set(name, value)
  }

  public get(name: Token): LoxLiteral {
    if (this.values.has(name.lexeme)) return this.values.get(name.lexeme);
    if (this.enclosing) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`)
  }
}


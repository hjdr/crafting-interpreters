import { LoxCallable } from './lox-callable';
import { Func } from './stmt';
import { LoxLiteral } from './token';
import Interpreter from './interpreter';
import { Environment } from './environment';

export class LoxFunction implements LoxCallable {
  private declaration: Func;
  private closure: Environment;

  constructor(closure: Environment, declaration: Func) {
    this.closure = closure;
    this.declaration = declaration;
  }

  public call(interpreter: Interpreter, args: Array<LoxLiteral>): LoxLiteral {
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i +=1 ) {
      environment.define(this.declaration.params[i].lexeme, args[i])
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (returnValue) {
      return returnValue.value;
    }

    return null;
  }

  public arity(): number {
    return this.declaration.params.length;
  }

  public toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }
}

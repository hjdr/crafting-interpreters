import { LoxCallable } from './lox-callable';
import { Func } from './stmt';
import { LoxLiteral } from './token';
import Interpreter from './interpreter';
import { Environment } from './environment';

class LoxFunction implements LoxCallable {
  private declaration: Func;

  constructor(declaration: Func) {
    this.declaration = declaration
  }

  public call(interpreter: Interpreter, args: Array<LoxLiteral>): LoxLiteral {
    const environment = new Environment(interpreter.globals);
    for (let i = 0; i < this.declaration.params.length; i +=1 ) {
      environment.define(this.declaration.params[i].lexeme, args[i])
    }

    interpreter.executeBlock(this.declaration.body, environment);
    return null;
  }
}

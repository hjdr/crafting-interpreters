import Interpreter from './interpreter';
import { LoxLiteral } from './token';

export interface LoxCallable {
  arity: () => number;
  call: (interpreter: Interpreter, args: Array<LoxLiteral>) => LoxLiteral;
  toString: () => string;
}

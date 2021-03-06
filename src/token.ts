import { TokenType } from './token-type';
import { LoxCallable } from './lox-callable';

export type LoxLiteral = string | number | boolean | null | LoxCallable;

export class Token {
  public type: TokenType;
  public lexeme: string;
  public literal: LoxLiteral;
  public line: number;

  constructor(type: TokenType, lexeme: string, literal: LoxLiteral, line: number) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  public toString(): string {
    return `Type: ${this.type} | Lexeme: ${this.lexeme} | Literal: ${this.literal}`
  }
}


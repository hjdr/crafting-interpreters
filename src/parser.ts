import { TokenType } from './token-type';
import { Token } from './token';
import {
  Assign,
  Binary,
  Expr,
  Grouping,
  Literal,
  Unary,
  Variable,
} from './expr';
import Lox from './lox';
import {
  Expression,
  Print,
  Stmt,
  Var,
} from './stmt';

export default class Parser {
  private readonly tokens: Array<Token>;
  private current = 0;

  constructor(tokens: Array<Token>) {
    this.tokens = tokens;
  }

  public parse(): Array<Stmt> {
    let statements: Array<Stmt> = []
    while (!this.isAtEnd()) {
      statements.push(this.declaration())
    }
    return statements;
  }

  private addition(): Expr {
    let expr: Expr = this.multiplication();

    while(this.match(
      TokenType.MINUS,
      TokenType.PLUS,
    )) {
      let operator: Token = this.previous();
      let rightExpr = this.multiplication();
      expr = new Binary(expr, operator, rightExpr);
    }
    return expr;
  }

  private advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private assignment(): Expr {
    const expr: Expr = this.equality();

    if (this.match(TokenType.EQUAL)) {
      const equals: Token = this.previous();
      const value: Expr = this.assignment();

      if (expr instanceof Variable) {
        const name: Token = expr.name;
        return new Assign(name, value)
      }

      Lox.error(equals, 'Invalid assignment target.');
    }
    return expr;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type == type;
  }

  private comparison() {
    let expr: Expr = this.addition();

    while(this.match(
      TokenType.GREATER,
      TokenType.GREATER_EQUAL,
      TokenType.LESS,
      TokenType.LESS_EQUAL)) {
      let operator: Token = this.previous();
      let rightExpr = this.addition();
      expr = new Binary(expr, operator, rightExpr);
    }
    return expr;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message)
  }

  private declaration(): Stmt {
    try {
      if (this.match(TokenType.VAR)) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      this.synchronise();
    }
  }

  private error(token: Token, message: string): Error {
    Lox.error(token, message);
    return new Error();
  }

  private equality(): Expr {
    let expr: Expr = this.comparison();

    while(this.match(
      TokenType.BANG_EQUAL,
      TokenType.EQUAL_EQUAL)) {
      let operator: Token = this.previous();
      let rightExpr: Expr = this.comparison();
      expr = new Binary(expr, operator, rightExpr);
    }
    return expr;
  }

  private expression(): Expr {
    return this.assignment();
  }

  private expressionStatement(): Stmt {
    const expr: Expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression");
    return new Expression(expr)
  }

  private isAtEnd() {
    return this.peek().type == TokenType.EOF;
  }

  private match(...types: Array<TokenType>): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false
  }

  private multiplication(): Expr {
    let expr: Expr = this.unary();

    while(this.match(
      TokenType.SLASH,
      TokenType.STAR,
    )) {
      let operator: Token = this.previous();
      let rightExpr = this.unary();
      expr = new Binary(expr, operator, rightExpr);
    }
    return expr;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return new Literal(false);
    if (this.match(TokenType.TRUE)) return new Literal(true);
    if (this.match(TokenType.NIL)) return new Literal(null);
    if (this.match(
      TokenType.NUMBER,
      TokenType.STRING
    )) {
      return new Literal(this.previous().literal);
    }
    if (this.match(TokenType.IDENTIFIER)) return new Variable(this.previous());
    if (this.match(TokenType.LEFT_PAREN)) {
      let expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Grouping(expr)
    }
    throw this.error(this.peek(), 'Expected a valid expression.')
  }

  private printStatement(): Stmt {
    const value: Expr  = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value");
    return new Print(value)
  }

  private statement(): Stmt {
    if (this.match(TokenType.PRINT)) return this.printStatement();

    return this.expressionStatement();
  }

  private synchronise() {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type == TokenType.SEMICOLON) return;
      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }
      this.advance();
    }
  }

  private varDeclaration(): Stmt {
    const name: Token = this.consume(TokenType.IDENTIFIER, 'Expect variable name');

    let initializer: Expr = null;
    if (this.match(TokenType.EQUAL)) initializer = this.expression();

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new Var(name, initializer);
  }

  private unary(): Expr {
    if (this.match(
      TokenType.BANG,
      TokenType.MINUS,
    )) {
      let operator: Token = this.previous();
      let rightExpr: Expr = this.unary();
      return new Unary(operator, rightExpr)
    }
    return this.primary();
  }
}

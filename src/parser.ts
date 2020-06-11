import { TokenType } from './token-type';
import { Token } from './token';
import {
  Assign,
  Binary,
  Call,
  Expr,
  Grouping,
  Literal,
  Logical,
  Unary,
  Variable,
} from './expr';
import Lox from './lox';
import {
  Block,
  Expression,
  Func,
  If,
  Print,
  Return,
  Stmt,
  Var,
  While,
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

  private and() {
    let expr: Expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator: Token = this.previous();
      const right: Expr = this.equality();
      expr = new Logical(expr, operator, right)
    }
    return expr;
  }

  private assignment(): Expr {
    const expr: Expr = this.or();

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

  private block(): Array<Stmt> {
    let statements: Array<Stmt> = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  private call() {
    let expr: Expr = this.primary();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }
    return expr
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
    throw this.error(this.peek(), message);
  }

  private declaration(): Stmt {
    try {
      if (this.match(TokenType.FUN)) return this.func('function')
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
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Expression(expr);
  }

  private finishCall(callee: Expr): Expr {
    let args: Array<Expr> = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) this.error(this.peek(), 'Cannot have more than 255 arguments');
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }
    const paren: Token = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");
    return new Call(callee, paren, args);
  }

  private forStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer: Stmt;
    if (this.match(TokenType.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TokenType.VAR)) {
      initializer =  this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Expr = null;
    if (!this.check(TokenType.SEMICOLON)) condition = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");


    let increment: Expr = null;
    if (!this.match(TokenType.RIGHT_PAREN)) increment = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses");

    let body: Stmt = this.statement();

    if (increment !== null) {
      body = new Block([
        body,
        new Expression(increment),
      ])
    }

    if (condition === null) condition = new Literal(true);
    body = new While(condition, body);

    if (initializer !== null) {
      body = new Block([initializer, body]);
    }
    return body;
  }

  private func(kind: string): Func {
    const name: Token = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);

    this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name`);
    let parameters: Array<Token> = []
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 255) {
          this.error(this.peek(), 'Cannot have more than 255 parameters.');
        }
        parameters.push(this.consume(TokenType.IDENTIFIER, 'Expect parameter name'));
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

    this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
    const body = this.block();
    return new Func(name, parameters, body);
  }

  private ifStatement() {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition: Expr = this.expression()
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch: Stmt = this.statement();
    let elseBranch: Stmt = null;
    if (this.match(TokenType.ELSE)) elseBranch = this.statement();

    return new If(condition, thenBranch, elseBranch)
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

  private or() {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator: Token = this.previous();
      const right: Expr = this.and();
      expr = new Logical(expr, operator, right)
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
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Print(value)
  }

  private returnStatement(): Stmt {
    const keyword: Token = this.previous();
    let value: Expr = null;
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expect ';' after return value");
    return new Return(keyword, value);
  }

  private statement(): Stmt {
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.LEFT_BRACE)) return new Block(this.block());
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
    const name: Token = this.consume(TokenType.IDENTIFIER, 'Expect variable name.');

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
    return this.call();
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition: Expr = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
    const body: Stmt = this.statement();

    return new While(condition, body);
  }
}

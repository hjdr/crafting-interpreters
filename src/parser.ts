import { TokenType } from './token-type';
import { Token } from './token';
import Expr from './expr';

class Parser {
  private readonly tokens: Array<Token>;
  private current = 0;

  constructor(tokens: Array<Token>) {
    this.tokens = tokens;
  }

  private expression(): Expr {
    return this.equality();
}

  private equality(): Expr {
    let expr: Expr = this.comparison();

    while(this.match(
      TokenType.BANG_EQUAL,
      TokenType.EQUAL_EQUAL)) {
      let operator: Token = this.previous();
      let rightExpr: Expr = this.comparison();
      expr = new Expr.Binary(expr, operator, rightExpr);
    }
    return expr;
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
      expr = new Expr.Binary(expr, operator, rightExpr);
    }
    return expr;
  }

  private addition(): Expr {
    let expr: Expr = this.multiplication();

    while(this.match(
      TokenType.MINUS,
      TokenType.PLUS,
    )) {
      let operator: Token = this.previous();
      let rightExpr = this.multiplication();
      expr = new Expr.Binary(expr, operator, rightExpr);
    }
    return expr;
  }

  private multiplication(): Expr {
    let expr: Expr = this.unary();

    while(this.match(
      TokenType.SLASH,
      TokenType.STAR,
    )) {
      let operator: Token = this.previous();
      let rightExpr = this.unary();
      expr = new Expr.Binary(expr, operator, rightExpr);
    }
    return expr;
  }

  private unary(): Expr {
    if (this.match(
      TokenType.BANG,
      TokenType.MINUS,
    )) {
      let operator: Token = this.previous();
      let rightExpr: Expr = this.unary();
      return new Expr.Unary(operator, rightExpr)
    }
    return this.primary();
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return new Expr.Literal(false);
    if (this.match(TokenType.TRUE)) return new Expr.Literal(true);
    if (this.match(TokenType.NIL)) return new Expr.Literal(null);
    if (this.match(
      TokenType.NUMBER,
      TokenType.STRING
    )) {
      return new Expr.Literal(this.previous().literal);
    }
    if (this.match(TokenType.LEFT_PAREN)) {
      let expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Expr.Grouping(expr)
    }
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

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type == type;
  }

  private advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd() {
    return this.peek().type == EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}
import { Expr, Binary, Grouping, Literal, Visitor, Unary } from './expr';
import { TokenType } from './token-type';
import {
  LoxLiteral,
  Token,
} from './token';
import { RuntimeError } from './runtime-error';
import Lox from './lox';

export default class Interpreter implements Visitor<LoxLiteral> {

  public interpret(expression: Expr) {
    try {
      const value: LoxLiteral = this.evaluate(expression);
      console.log(String(value));
    } catch (error) {
      Lox.runtimeError(error)
    }
  }

  private checkNumberOperand(operator: Token, ...operands: Array<LoxLiteral>) {
    for (const operand of operands) {
      if(typeof operand !== 'number') {
        throw new RuntimeError(operator, 'Operand(s) must be a number.')
      }
    }
  }

  private evaluate(expr: Expr): LoxLiteral {
    return expr.accept<LoxLiteral>(this);
  }

  private isTruthy(literal: LoxLiteral): boolean {
    if (literal == null) return false;
    if (typeof literal == 'boolean') return literal;
    return true;
  }

  public visitLiteralExpr(expr: InstanceType<typeof Literal>): LoxLiteral {
    return expr.value;
  }

  public visitGroupingExpr(expr: InstanceType<typeof Grouping>): LoxLiteral {
    return this.evaluate(expr.expression);
  }

  public visitUnaryExpr(expr: InstanceType<typeof Unary>): LoxLiteral {
    let right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -(right as number)
    }
    return null
  }

  public visitBinaryExpr(expr: InstanceType<typeof Binary>): LoxLiteral {
    let left = this.evaluate(expr.left);
    let right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL:
        return !(left === right);
      case TokenType.EQUAL_EQUAL:
        return left === right;
      case TokenType.GREATER:
        this.checkNumberOperand(expr.operator, left, right);
        return (left as number) > (right as number);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperand(expr.operator, left, right);
        return (left as number) >= (right as number);
      case TokenType.LESS:
        this.checkNumberOperand(expr.operator, left, right);
        return (left as number) < (right as number);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperand(expr.operator, left, right);
        return (left as number) <= (right as number);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, left, right);
        return (left as number) - (right as number);
      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number') {
          return (left as number) + (right as number);
        }
        if (typeof  left === 'string' && typeof right === 'string') {
          return (left as string) + (right as string);
        }
        throw new RuntimeError(expr.operator, 'Operands must be two numbers or two strings.');
      case TokenType.SLASH:
        this.checkNumberOperand(expr.operator, left, right);
        return (left as number) / (right as number);
      case TokenType.STAR:
        this.checkNumberOperand(expr.operator, left, right);
        return (left as number) * (right as number);
    }
    return null
  }

}
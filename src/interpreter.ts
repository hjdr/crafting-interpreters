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
  Visitor as ExprVisitor,
} from './expr';
import { TokenType } from './token-type';
import {
  LoxLiteral,
  Token,
} from './token';
import { RuntimeError } from './runtime-error';
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
  Visitor as StmtVisitor,
  While,
} from './stmt';
import { Environment } from './environment';
import { LoxCallable } from './lox-callable';
import { LoxFunction } from './lox-function';
import { ReturnException } from './return-exception';

function isLoxCallable(callee: any): callee is LoxCallable {
  return callee.call && (typeof callee.call === 'function')
}

export default class Interpreter implements ExprVisitor<LoxLiteral>, StmtVisitor<void> {
  public globals: Environment;
  private environment: Environment;

  public constructor() {
    this.globals = new Environment();
    this.environment = this.globals;

    this.globals.define('clock', {
      arity(): number { return 0; },
      call(): LoxLiteral { return Date.now(); },
      toString() { return '<native fn>' }
    });
  }

  public executeBlock(statements: Array<Stmt>, environment: Environment) {
    const previous = this.environment;

    try {
      this.environment = environment;
      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }

  public interpret(statements: Array<Stmt>) {
    try {
      statements.forEach(statement => this.execute(statement))
    } catch (error) {
      Lox.runtimeError(error)
    }
  }

  public visitAssignExpr(expr: Assign): LoxLiteral {
    const value: LoxLiteral = this.evaluate(expr.value)
    this.environment.assign(expr.name, value);
    return value;
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

  public visitBlockStmt(stmt: Block) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  public visitCallExpr(expr: Call) {
   const callee: LoxLiteral = this.evaluate(expr.callee);

   let args: Array<LoxLiteral> = [];
   for (const arg of expr.args) {
     args.push(this.evaluate(arg))
   }

    const fn = callee as LoxCallable

   if (!isLoxCallable(callee)) {
     throw new RuntimeError(expr.paren, 'Can only call functions and classes.');
   }

   if (args.length !== fn.arity()) {
     throw new RuntimeError(
       expr.paren,
       `Expected ${fn.arity()} arguments but got ${args.length}.`
     );
   }
    return fn.call(this, args)
  }

  public visitExpressionStmt(stmt: Expression): void {
    this.evaluate(stmt.expression);
  }

  public visitFuncStmt(stmt: Func) {
    const func = new LoxFunction(stmt);
    this.environment.define(stmt.name.lexeme, func);
  }

  public visitGroupingExpr(expr: InstanceType<typeof Grouping>): LoxLiteral {
    return this.evaluate(expr.expression);
  }

  public visitIfStmt(stmt: If) {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }
  }

  public visitLiteralExpr(expr: InstanceType<typeof Literal>): LoxLiteral {
    return expr.value;
  }

  public visitLogicalExpr(expr: Logical) {
    const left: LoxLiteral = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }
    return this.evaluate(expr.right)
  }

  public visitPrintStmt(stmt: Print) {
    const value = this.evaluate(stmt.expression);
    console.log(value.toString());
  }

  public visitReturnStmt(stmt: Return) {
    let value: LoxLiteral = null;
    if (stmt.value !== null) value = this.evaluate(stmt.value);

    throw new ReturnException(value);
  }

  public visitUnaryExpr(expr: InstanceType<typeof Unary>): LoxLiteral {
    let right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -(right as number);
    }
    return null;
  }

  public visitVariableExpr(expr: Variable) {
    return this.environment.get(expr.name);
  }

  public visitVarStmt(stmt: Var) {
    let value: LoxLiteral = null;
    if (stmt.initializer !== null ) value = this.evaluate(stmt.initializer);
    this.environment.define(stmt.name.lexeme, value);
  }

  public visitWhileStmt(stmt: While) {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
    return null;
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

  private execute(stmt: Stmt) {
    stmt.accept(this);
  }
}

import { Token, LoxLiteral } from './token';

abstract class Visitor {
  public abstract visitBinaryExpr(expr: InstanceType<typeof Expr.Binary>): string;
  public abstract visitGroupingExpr(expr: InstanceType<typeof Expr.Grouping>): string;
  public abstract visitLiteralExpr(expr: InstanceType<typeof Expr.Literal>): string;
  public abstract visitUnaryExpr(expr: InstanceType<typeof Expr.Unary>): string;
}

export interface ExprConstructor {
  new(...args: Array<any>): Expr
}

abstract class Expr {
  static Binary = class extends Expr {
    constructor(public left: Expr, public operator: Token, public right: Expr) {
      super();
    }
  };
  static Grouping = class extends Expr {
    constructor(public expression: Expr) {
      super();
    }
  };
  static Literal = class extends Expr {
    constructor(public value: Object) {
      super();
    }
  };
  static Unary = class extends Expr {
    constructor(public operator: Token, public right: Expr) {
      super();
    }
  };
// @ts-ignore
  public accept(visitor: Visitor): string {
   if (this instanceof Expr.Binary) return visitor.visitBinaryExpr(this);
   if (this instanceof Expr.Grouping) return visitor.visitGroupingExpr(this);
   if (this instanceof Expr.Literal) return visitor.visitLiteralExpr(this);
   if (this instanceof Expr.Unary) return visitor.visitUnaryExpr(this);
  }
}

export { Visitor }
export default Expr;

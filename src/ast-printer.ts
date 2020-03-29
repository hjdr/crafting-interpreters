import Expr, { Visitor } from './expr';
import { Token } from './token';
import { TokenType } from './token-type';

export default class AstPrinter extends Visitor {
  constructor() {
    super();
  }

  public print(expr) {
    return expr.accept(this)
  }

  public visitBinaryExpr(expr: InstanceType<typeof Expr.Binary>): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  public visitGroupingExpr(expr: InstanceType<typeof Expr.Grouping>): string {
    return this.parenthesize("group", expr.expression);
  }

  public visitLiteralExpr(expr: InstanceType<typeof Expr.Literal>): string {
    if (expr.value === null) return 'nil';
    return expr.value.toString();
  }

  public visitUnaryExpr(expr: InstanceType<typeof Expr.Unary>): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  private parenthesize(name?: string, ...exprs: Array<Expr>) {
    let builder: Array<string | Expr> = [];

    builder.push("(");
    builder.push(name);

    for (const expr of exprs) {
      builder.push(" ");
      builder.push(expr.accept(this));
    }
    builder.push(")");

    return builder.join("");
  }
}

(function main() {
  const expression = new Expr.Binary(
    new Expr.Unary(
      new Token(TokenType.MINUS, "-", null, 1 ),
      new Expr.Literal(123),
    ),
    new Token(TokenType.STAR, "*", null, 1),
    new Expr.Grouping(new Expr.Literal(45.67)),
  );
  console.log(new AstPrinter().print(expression))
})();
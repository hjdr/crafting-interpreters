import { Expr } from './expr';
import { LoxLiteral, Token } from './token';

export interface Visitor<T> {
    visitExpressionStmt: (stmt: Expression) => T;
    visitPrintStmt: (stmt: Print) => T;
}

export type Stmt = Expression | Print;

export class Expression {
    public expression: Expr;

    public constructor(expression: Expr) {
        this.expression = expression;
    }

    public accept<T>(visitor: Visitor<T>): T {
        return visitor.visitExpressionStmt(this);
    }
}

export class Print {
    public expression: Expr;

    public constructor(expression: Expr) {
        this.expression = expression;
    }

    public accept<T>(visitor: Visitor<T>): T {
        return visitor.visitPrintStmt(this);
    }
}


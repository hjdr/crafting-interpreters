import * as fs from 'fs';
import * as readline from 'readline';
import Scanner from './scanner';
import { Token } from './token';
import { TokenType } from './token-type';
import Parser from './parser';
import { Expr } from './expr';
import { RuntimeError } from './runtime-error';
import Interpreter from './interpreter';

export default class Lox {
  private static interpreter = new Interpreter();
  public static hadError: boolean = false;
  public static hadRuntimeError: boolean = false;

  public static runFile(path: string) {
    // Indicate an error in the exit code.
    if(this.hadError || this.hadRuntimeError) process.exit(65);

    let source = fs.readFileSync(path, { encoding: 'utf8' });
    this.run(source);
  }

  public static runPrompt() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '-->',
    });

    rl.write('lox REPL. Press Ctrl + C to exit \n');
    rl.prompt();

    rl.on('line', async line => {
      const source = line.trim();
      this.run(source);
      this.hadError = false;
    })
  }

  private static run(source: string) {
    let scanner = new Scanner(source);
    let tokens: Array<Token> = scanner.scanTokens();
    let parser = new Parser(tokens);
    let expression: Expr = parser.parse();

    if (this.hadError) return;
    this.interpreter.interpret(expression)
  }

  public static scannerError(line: number, message: string) {

  }

  private static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`)
    this.hadError = true;
  }

  public static error(obj: Token | number, message: string) {
    if (typeof obj === 'number') {
      const line: number = obj;
      this.report(line, "", message);
    } else {
      const token: Token = obj;
      if (token.type == TokenType.EOF) {
        this.report(token.line, 'at end', message);
      } else {
        this.report(token.line, `at '${token.lexeme}'`, message);
      }
    }
  }

  public static runtimeError(error: RuntimeError) {
    console.error(`${error.message} \n[line: ${error.token.line}]`);
    this.hadRuntimeError = true;
  }
}

(function main() {
  const args = process.argv.slice(2);
    if (args.length > 1) {
      console.log("Usage: jlox [script]");
      process.exit(64);
    } else if (args.length == 1) {
      Lox.runFile(args[0])
    } else {
      Lox.runPrompt();
    }
})();

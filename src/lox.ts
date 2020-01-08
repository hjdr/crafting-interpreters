import * as fs from 'fs';
import * as readline from 'readline';

class Lox {
  public static hadError: boolean = false;

  public static main(args: string) {
    if (args.length > 1) {
      console.log("Usage: jlox [script]");
      process.exit(64);
    } else if (args.length == 1) {
      this.runFile(args[0])
    } else {
      this.runPrompt()
    }
  }

  public static runFile(path: string) {

    // Indicate an error in the exit code.
    if(this.hadError) process.exit(65);

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
    let tokens = scanner.scanTokens();

    tokens.forEach((token) => console.log(token))
  }

  public static error(line: number, message: string) {
    this.report(line, "", message)
  }

  private static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`)
    this.hadError = true;
  }

}


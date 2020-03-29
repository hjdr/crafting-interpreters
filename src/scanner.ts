import {
  TokenType,
  ReservedWords,
} from './token-type';
import {
  LoxLiteral,
  Token,
} from './token';
import Lox from './lox';

export default class Scanner {
  private source: string;
  private tokens: Array<Token> = [];
  private start: number = 0;
  private current: number = 0;
  private line: number = 0;

  constructor(source: string) {
    this.source = source;
  }

  public scanTokens(): Array<Token> {
    while(!this.isAtEnd()) {
      // We are at the beginning of the next lexeme.
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, '[EOF]', null, this.line));
    return this.tokens
  }

  private scanToken() {
    let c: string = this.advance();
    switch (c) {
      case '(': this.addToken(TokenType.LEFT_PAREN); break;
      case ')': this.addToken(TokenType.RIGHT_PAREN); break;
      case '{': this.addToken(TokenType.LEFT_BRACE); break;
      case '}': this.addToken(TokenType.RIGHT_BRACE); break;
      case ',': this.addToken(TokenType.COMMA); break;
      case '.': this.addToken(TokenType.DOT); break;
      case '-': this.addToken(TokenType.MINUS); break;
      case '+': this.addToken(TokenType.PLUS); break;
      case ';': this.addToken(TokenType.SEMICOLON); break;
      case '*': this.addToken(TokenType.STAR); break;

      case '!': this.addToken((this.match('=')
        ? TokenType.BANG_EQUAL
        : TokenType.BANG)); break;
      case '=': this.addToken((this.match('=')
        ? TokenType.EQUAL_EQUAL
        : TokenType.EQUAL)); break;
      case '<': this.addToken((this.match('=')
        ? TokenType.LESS_EQUAL
        : TokenType.LESS)); break;
      case '>': this.addToken((this.match('=')
        ? TokenType.GREATER_EQUAL
        : TokenType.GREATER));
      break;

      case '/':
        if (this.match('/')) {
          while (this.peek() != '\n' && !this.isAtEnd()) this.advance()
        }  else {
          this.addToken(TokenType.SLASH)
        }
        break;

      case ' ':
      case '\r':
      case '\t':
        break;

      case '\n':
        this.line++;
        break;

      case '"': this.string(); break;

      default:
        if(this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)){
          this.identifier();
        } else {
          Lox.scannerError(this.line, 'Unexpected Character');
          break;
        }
    }
  }

  private addToken(type: TokenType, literal: LoxLiteral = null) {
    let text: string = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line))
  }

  private advance(): string {
    this.current++;
    return this.source[this.current - 1];
  }

  private identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();
    const text: string = this.source.substring(this.start, this.current);
    this.addToken(ReservedWords[text] || TokenType.IDENTIFIER);
  }

  private isAlpha(c: string) {
    return (c >= 'a' && c <= 'z')
      || (c >= 'A' && c <= 'Z')
      || c == '_';
  }

  private isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c)
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private isDigit(c: string) {
    return c >= '0' && c <= '9';
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] != expected) return false;

    this.current++;
    return true;
  }

  private number() {
    while (this.isDigit(this.peek())) this.advance();

    if (this.peek() == '.' && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) this.advance()
    }

    let value: number = Number(this.source.substring(this.start, this.current));

    this.addToken(TokenType.NUMBER, value)
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current]
  }

  private peekNext() {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1]
  }

  private string() {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == '\n' ) this.line++;
      this.advance();
    }

    if(this.isAtEnd()) {
      Lox.scannerError(this.line, 'Unterminated string.');
      return;
    }

    this.advance();

    let value: string = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }
}

import { registers, type Error, type Position, type Result } from "./types";

export enum TokenType {
  IDENTIFIER,
  REGISTER,
  NUMBER,
  STRING,

  DIRECTIVE,
  LABEL,

  COMMA,

  SPACE,
  TAB,
  NEWLINE,

  LEFT_PAREN,
  RIGHT_PAREN,

  COMMENT,

  INVALID,

  EOF,
}

export interface Token {
  type: TokenType;
  start: Position;
  end: Position;
}

export function lex(source: string): Result<Token[], Error[]> {
  const result: Token[] = [];
  const errors: Error[] = [];
  let current: Position = { line: 0, offset: 0 };

  function peek(): string | undefined {
    return source[current.offset];
  }

  function peekPrev(): string | undefined {
    return source[current.offset - 1];
  }

  function advance(): string | undefined {
    const c = peek();
    if (isAtEnd()) return undefined;
    current.offset += 1;
    if (c === "\n") { current.line += 1; }
    return c;
  }

  function match(chars: string[]): boolean {
    const c = peek();
    if (!c || !chars.includes(c)) return false;
    advance();
    return true;
  }

  function isAtEnd(): boolean {
    return peek() === undefined;
  }

  function isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  function isAlpha(c: string): boolean {
    return c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c == "_";
  }

  function string(c: string) {
    advance();
    while (!isAtEnd() && peek() !== c) {
      advance();
    }
    if (peek() === c) {
      advance();
    }
  }

  function number() {
    advance();
    while (!isAtEnd() && isDigit(peek()!)) {
      advance();
    }
  }

  function identifier() {
    advance();
    while (!isAtEnd() && (isDigit(peek()!) || isAlpha(peek()!))) {
      advance();
    }
  }

  function directive() {
    advance();
    while (!isAtEnd() && (isDigit(peek()!) || isAlpha(peek()!))) {
      advance();
    }
  }

  function register(): string {
    advance();
    let name = "";
    while (!isAtEnd() && (isDigit(peek()!) || isAlpha(peek()!))) {
      name += advance();
    }
    return name;
  }

  function comment() {
    advance();
    while (!isAtEnd() && peek() !== "\n") {
      advance();
    }
    advance();
  }

  while (!isAtEnd()) {
    const start = { ...current };
    const c = peek()!;
    switch (c) {
      case " ":
        advance();
        result.push({ type: TokenType.SPACE, start, end: { ...current } });
        break;
      case "\r":
        advance();
        if (peek() === "\n") {
          advance();
        }
        result.push({ type: TokenType.NEWLINE, start, end: { ...current } });
        break;
      case "\n":
        advance();
        result.push({ type: TokenType.NEWLINE, start, end: { ...current } });
        break;
      case "\t":
        advance();
        result.push({ type: TokenType.TAB, start, end: { ...current } });
        break;
      case "#":
        comment();
        result.push({ type: TokenType.COMMENT, start, end: { ...current } });
        break;
      case "$":
        const name = register();
        if (Object.keys(registers).includes(name)) {
          result.push({ type: TokenType.REGISTER, start, end: { ...current } });
        } else {
          result.push({ type: TokenType.INVALID, start, end: { ...current } });
          errors.push({ start, end: { ...current }, message: "Invalid register name" });
        }
        break;
      case "(":
        advance();
        result.push({ type: TokenType.LEFT_PAREN, start, end: { ...current } });
        break;
      case ")":
        advance();
        result.push({ type: TokenType.RIGHT_PAREN, start, end: { ...current } });
        break;
      case ",":
        advance();
        result.push({ type: TokenType.COMMA, start, end: { ...current } });
        break;
      case ".":
        directive();
        result.push({ type: TokenType.DIRECTIVE, start, end: { ...current } });
        break;
      case "\"":
      case "'":
        string(c);
        if (peekPrev() === c) {
          result.push({ type: TokenType.STRING, start, end: { ...current } });
        } else {
          result.push({ type: TokenType.INVALID, start, end: { ...current } });
          errors.push({ start, end: { ...current }, message: "Unclosed string" });
        }
        break;
      default:
        if (isDigit(c)) {
          number();
          result.push({ type: TokenType.NUMBER, start, end: { ...current } });
        } else if (isAlpha(c)) {
          identifier();
          if (peek() === ":") {
            advance();
            result.push({ type: TokenType.LABEL, start, end: { ...current } });
          } else {
            result.push({ type: TokenType.IDENTIFIER, start, end: { ...current } });
          }
        } else {
          advance();
          result.push({ type: TokenType.INVALID, start, end: { ...current } });
          errors.push({ start, end: { ...current }, message: "Invalid character" });
        }
    }
  }

  result.push({ type: TokenType.EOF, start: { ...current }, end: { ...current } });
  return { result, errors };
}

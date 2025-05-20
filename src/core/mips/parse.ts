import { TokenType, type Token } from "./lex";
import { directives, ops, type Error, type Position, type Result } from "./types";

export enum NodeType {
  DIRECTIVE,
  DIRECTIVE_ARG,
  INSTRUCTION,
  INSTRUCTION_IMMEDIATE,
  INSTRUCTION_REGISTER,
  INSTRUCTION_DISPLACEMENT,
  LABEL,
}

export interface Node {
  type: NodeType;
  start: Position;
  end: Position;
}

export interface DirectiveNode extends Node {
  type: NodeType.DIRECTIVE;
  op: Token;
  args: DirectiveArgumentNode[];
}

export interface DirectiveArgumentNode extends Node {
  type: NodeType.DIRECTIVE_ARG;
  tokens: Token[];
}

export interface InstructionNode extends Node {
  type: NodeType.INSTRUCTION;
  op: Token;
  args: InstructionArgumentNode[];
}

export interface InstructionImmediateNode extends Node {
  type: NodeType.INSTRUCTION_IMMEDIATE;
  immediate: Token;
}

export interface InstructionRegisterNode extends Node {
  type: NodeType.INSTRUCTION_REGISTER;
  register: Token;
}

export interface InstructionDisplacementNode extends Node {
  type: NodeType.INSTRUCTION_DISPLACEMENT;
  disp: Token;
  register: Token;
}

export type InstructionArgumentNode = InstructionRegisterNode | InstructionImmediateNode | InstructionDisplacementNode;

export interface LabelNode extends Node {
  type: NodeType.LABEL;
  tokens: Token[];
}

export function parse(source: string, tokens: Token[]): Result<Node[], Error[]> {
  let current = 0;
  const nodes: Node[] = [];
  const errors: Error[] = [];

  function peek(): Token {
    return tokens[current];
  }

  function peekNextWithoutWhitespaces(): Token {
    let start = current;
    while (start < tokens.length) {
      start += 1;
      if (![TokenType.COMMENT, TokenType.TAB, TokenType.SPACE].includes(tokens[start].type)) {
        return tokens[start];
      }
    }
    return tokens[tokens.length - 1];
  }

  function advance(): Token {
    if (isAtEnd()) return peek();
    const token = peek();
    current += 1;
    return token;
  }

  function match(...types: TokenType[]): boolean {
    if (isAtEnd()) return types.includes(TokenType.EOF);
    if (!types.includes(peek().type)) return false;
    current += 1;
    return true;
  }

  function isAtEnd() {
    return tokens[current].type === TokenType.EOF;
  }

  function recover(message: string) {
    let start = current;
    while (!isAtEnd() && !match(TokenType.NEWLINE)) {
      advance();
    }
    errors.push({ start: tokens[start].start, end: tokens[current - 1].end, message });
  }

  function skipWhitespaces() {
    while (match(TokenType.TAB, TokenType.SPACE, TokenType.COMMENT)) {
      continue;
    }
  }

  function label() {
    skipWhitespaces();
    let start = current;
    if (!match(TokenType.LABEL)) {
      recover("Expected a label");
      return;
    }
    nodes.push({
      type: NodeType.LABEL,
      tokens: tokens.slice(start, current),
      start: tokens[start].start,
      end: tokens[current - 1].end,
    } as LabelNode);
  }

  function registerArgument(): InstructionRegisterNode {
    skipWhitespaces();
    const register = advance();
    return {
      type: NodeType.INSTRUCTION_REGISTER,
      register,
      start: register.start,
      end: register.end,
    };
  }

  function immediateArgument(): InstructionImmediateNode {
    skipWhitespaces();
    const immediate = advance();
    return {
      type: NodeType.INSTRUCTION_IMMEDIATE,
      immediate,
      start: immediate.start,
      end: immediate.end,
    };
  }

  function displacementArgument(): InstructionDisplacementNode | null {
    skipWhitespaces();
    const disp = advance();

    skipWhitespaces();
    if (!match(TokenType.LEFT_PAREN)) {
      recover("Expected '(' after displacement value");
      return null;
    }

    skipWhitespaces();
    if (peek().type !== TokenType.REGISTER) {
      recover("Expected register in displacement addressing mode");
      return null;
    }

    const register = advance();

    skipWhitespaces();
    if (!match(TokenType.RIGHT_PAREN)) {
      recover("Expected ')' after register in displacement addressing mode");
      return null;
    }

    return {
      type: NodeType.INSTRUCTION_DISPLACEMENT,
      disp,
      register,
      start: disp.start,
      end: tokens[current - 1].end,
    };
  }

  function instructionArgument(): InstructionArgumentNode | null {
    skipWhitespaces();
    switch (peek().type) {
      case TokenType.REGISTER:
        return registerArgument();

      case TokenType.IDENTIFIER:
      case TokenType.NUMBER:
        if (peekNextWithoutWhitespaces().type === TokenType.LEFT_PAREN) {
          return displacementArgument();
        } else {
          return immediateArgument();
        }

      default:
        recover("Expected an instruction argument (register, displacement or immediate)");
        return null;
    }
  }

  function instruction() {
    skipWhitespaces();
    let start = current;
    const op = peek();
    const opName = source.slice(op.start.offset, op.end.offset);

    if (!Object.keys(ops).includes(opName)) {
      recover(`Unknown instruction '${opName}'`);
      return;
    }

    advance();

    const args: InstructionArgumentNode[] = [];

    skipWhitespaces();
    if (peek().type !== TokenType.NEWLINE && peek().type !== TokenType.EOF) {
      const arg = instructionArgument();
      if (arg) args.push(arg);

      skipWhitespaces();
      while (peek().type !== TokenType.NEWLINE && peek().type !== TokenType.EOF) {
        if (!match(TokenType.COMMA)) {
          recover("Expected comma between instruction arguments");
          break;
        }
        skipWhitespaces();

        const arg = instructionArgument();
        if (arg) args.push(arg);
        skipWhitespaces();
      }
    }

    nodes.push({
      type: NodeType.INSTRUCTION,
      op,
      args,
      start: tokens[start].start,
      end: tokens[current - 1].end,
    } as InstructionNode);

    skipWhitespaces();
    match(TokenType.NEWLINE);
  }

  function directiveArgument(): DirectiveArgumentNode | null {
    let args: Token[] = [];

    skipWhitespaces();
    while (!isAtEnd() &&
      peek().type !== TokenType.COMMA &&
      peek().type !== TokenType.NEWLINE) {
      args.push(advance());
      skipWhitespaces();
    }

    if (tokens.length === 0) {
      recover("Expected a directive argument");
      return null;
    }

    return {
      type: NodeType.DIRECTIVE_ARG,
      tokens: args,
      start: args[0].start,
      end: args[args.length - 1].end,
    };
  }

  function directive() {
    skipWhitespaces();
    let start = current;

    const op = peek();
    const opName = source.slice(op.start.offset, op.end.offset);
    if (!match(TokenType.DIRECTIVE)) {
      recover("Expected a directive");
      return;
    }
    if (!Object.keys(directives).includes(opName)) {
      recover(`Unknown directive '${opName}'`);
      return;
    }

    const args: DirectiveArgumentNode[] = [];

    skipWhitespaces();
    if (peek().type !== TokenType.NEWLINE && peek().type !== TokenType.EOF) {
      const arg = directiveArgument();
      if (arg) args.push(arg);

      skipWhitespaces();
      while (peek().type !== TokenType.NEWLINE && peek().type !== TokenType.EOF) {
        if (!match(TokenType.COMMA)) {
          recover("Expected comma between directive arguments");
          break;
        }

        skipWhitespaces();
        const arg = directiveArgument();
        if (arg) args.push(arg);
        skipWhitespaces();
      }
    }

    nodes.push({
      type: NodeType.DIRECTIVE,
      op,
      args,
      start: tokens[start].start,
      end: tokens[current - 1].end,
    } as DirectiveNode);

    skipWhitespaces();
    match(TokenType.NEWLINE);
  }

  while (!isAtEnd()) {
    if (match(TokenType.NEWLINE)) continue;
    if (match(TokenType.INVALID)) continue;
    if (match(TokenType.SPACE, TokenType.TAB, TokenType.COMMENT)) continue;

    switch (peek().type) {
      case TokenType.LABEL:
        label();
        break;
      case TokenType.IDENTIFIER:
        instruction();
        break;
      case TokenType.DIRECTIVE:
        directive();
        break;
      case TokenType.EOF:
        break;
      default:
        recover("Expected a directive, instruction, or label");
        break;
    }
  }

  return { result: nodes, errors };
}

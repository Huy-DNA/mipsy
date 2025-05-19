import { TokenType, type Token } from "./lex";
import { ops, type Error, type Result } from "./types";

export enum NodeType {
  PROGRAM,
  DIRECTIVE,
  DIRECTIVE_ARG,
  INSTRUCTION,
  INSTRUCTION_IMMEDIATE,
  INSTRUCTION_REGISTER,
  INSTRUCTION_LABEL,
  LABEL,
}

export interface Node {
  type: NodeType;
  start: number;
  end: number;
}

export interface ProgramNode {
  type: NodeType.PROGRAM;
  body: Node[];
}

export interface DirectiveNode extends Node {
  type: NodeType.DIRECTIVE;
  args: DirectiveArgumentNode[];
}

export interface DirectiveArgumentNode extends Node {
  type: NodeType.DIRECTIVE_ARG;
  tokens: Token[];
}

export interface InstructionNode extends Node {
  type: NodeType.INSTRUCTION;
  args: InstructionArgumentNode[];
}

export interface InstructionImmediateNode extends Node {
  type: NodeType.INSTRUCTION_IMMEDIATE;
  tokens: Token[];
}

export interface InstructionRegisterNode extends Node {
  type: NodeType.INSTRUCTION_REGISTER;
  tokens: Token[];
}

export interface InstructionLabelNode extends Node {
  type: NodeType.INSTRUCTION_LABEL;
  tokens: Token[];
}

export type InstructionArgumentNode = InstructionRegisterNode | InstructionLabelNode | InstructionImmediateNode;

export interface LabelNode extends Node {
  type: NodeType.LABEL;
  tokens: Token[];
}

export function parse(source: string, tokens: Token[]): Result<Node, Error[]> {
  let current = 0;
  const nodes: Node[] = [];
  const errors: Error[] = [];

  function peek(): Token {
    return tokens[current];
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
    errors.push({ start: tokens[start].start, end: tokens[current].end, message });
  }

  function skipWhitespaces() {
    while (match(TokenType.TAB, TokenType.SPACE)) {
      continue;
    }
  }

  function label() {
    skipWhitespaces();
    let start = current;
    if (!match(TokenType.LABEL)) {
      recover("Expect a label");
      return;
    }
    nodes.push({ type: NodeType.LABEL, tokens: tokens.slice(start, current), start, end: current } as LabelNode);
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
    if (!match(TokenType.IDENTIFIER)) {
      recover("Expect an instruction name");
      return;
    }

    skipWhitespaces();
    // ...
  }

  function directive() {
  }

  while (!isAtEnd()) {
    if (match(TokenType.INVALID)) continue;

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
      case TokenType.COMMENT:
      case TokenType.SPACE:
      case TokenType.TAB:
      case TokenType.NEWLINE:
      case TokenType.EOF:
      case TokenType.INVALID:
        break;

      default:
        recover("Expect a directive, an instruction or a label");
        break;
    }
  }
}

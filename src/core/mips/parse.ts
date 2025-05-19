import { TokenType, type Token } from "./lex";
import type { Error, Result } from "./types";

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


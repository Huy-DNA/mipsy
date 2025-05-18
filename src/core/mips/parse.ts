import type { Token } from "./lex";

export enum NodeType {
  BLOCK,
  DATA_SECTION,
  CODE_SECTION,
  UNKNOWN_SECTION,
  DIRECTIVE,
  INSTRUCTION,
  LABEL,
}

export interface Node {
  type: NodeType;
  start: number;
  end: number;
}

export interface DirectiveNode extends Node {
  type: NodeType.DIRECTIVE;
  args: Token[];
}

export interface InstructionNode extends Node {
  type: NodeType.INSTRUCTION;
  args: Token[];
}

export interface LabelNode extends Node {
  type: NodeType.LABEL;
}

export interface BlockNode extends Node {
  type: NodeType.BLOCK;
  instructions: Node[];
}

export interface DataSectionNode extends Node {
  type: NodeType.DATA_SECTION;
  directives: DirectiveNode[];
}

export interface CodeSectionNode extends Node {
  type: NodeType.CODE_SECTION;
  instructions: (DirectiveNode | InstructionNode)[];
}

export interface UnknownSectionNode extends Node {
  type: NodeType.UNKNOWN_SECTION;
  instructions: (DirectiveNode | InstructionNode)[];
}

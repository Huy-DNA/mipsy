import { TokenType, type Token } from "./lex";
import { NodeType, type DirectiveNode, type InstructionNode, type Node } from "./parse";
import { directives, type Error, type Result } from "./types";

export enum SectionType {
  CODE,
  DATA,
}

export function validate(source: string, tokens: Token[], nodes: Node[]): Result<null, Error[]> {
  let currentSection = SectionType.CODE;
  const errors: Error[] = [];

  function getTokenLexeme(token: Token): string {
    return source.slice(token.start.offset, token.end.offset);
  }

  function validateDirective(directive: DirectiveNode) {
    let opName: keyof typeof directives = source.slice(directive.op.start.offset, directive.op.end.offset) as any;
    switch (opName) {
      case '.byte':
        if (currentSection === SectionType.CODE) {
          errors.push({ start: directive.start, end: directive.end, message: 'Data directive .byte used in code section' });
          return;
        }
        for (const arg of directive.args) {
          const lexeme = getTokenLexeme(arg.tokens[0]);
          const num = Number.parseInt(lexeme, 10);
          if (num !== Number(lexeme) || Number.isNaN(num) || num < -128 || num > 255) {
            errors.push({ start: arg.tokens[0].start, end: arg.tokens[0].end, message: 'Invalid byte value in .byte directive' });
          }
          return;
        }
        return;
      case '.data':
        currentSection = SectionType.DATA;
        if (directive.args.length > 0) {
          errors.push({ start: directive.args[0].start, end: directive.args[0].end, message: 'Unexpected arguments in .data directive' });
        }
        return;
      case '.half':
        if (currentSection === SectionType.CODE) {
          errors.push({ start: directive.start, end: directive.end, message: 'Data directive .half used in code section' });
          return;
        }
        for (const arg of directive.args) {
          const lexeme = getTokenLexeme(arg.tokens[0]);
          const num = Number.parseInt(lexeme, 10);
          if (num !== Number(lexeme) || Number.isNaN(num) || num < -32768 || num > 65535) {
            errors.push({ start: arg.tokens[0].start, end: arg.tokens[0].end, message: 'Invalid halfword value in .half directive' });
          }
          return;
        }
        return;
      case '.word':
        if (currentSection === SectionType.CODE) {
          errors.push({ start: directive.start, end: directive.end, message: 'Data directive .word used in code section' });
          return;
        }
        for (const arg of directive.args) {
          const lexeme = getTokenLexeme(arg.tokens[0]);
          const num = Number.parseInt(getTokenLexeme(arg.tokens[0]), 10);
          if (num !== Number(lexeme) || Number.isNaN(num) || num < -2147483648 || num > 4294967295) {
            errors.push({ start: arg.tokens[0].start, end: arg.tokens[0].end, message: 'Invalid word value in .half directive' });
          }
          return;
        }
        return;
      case '.text':
      case '.code':
        currentSection = SectionType.CODE;
        if (directive.args.length > 0) {
          errors.push({ start: directive.args[0].start, end: directive.args[0].end, message: 'Unexpected arguments in .text directive' });
        }
        return;
      case '.align':
        if (currentSection === SectionType.CODE) {
          errors.push({ start: directive.start, end: directive.end, message: `Data directive .align used in code section` });
          return;
        }
        if (directive.args.length > 1) {
          errors.push({ start: directive.start, end: directive.end, message: `Expected one numerice argument in .align directive` });
        }
        const lexeme = getTokenLexeme(directive.args[0].tokens[0]);
        const num = Number.parseInt(lexeme);
        if (num !== Number(lexeme) || Number.isNaN(num) || num < 0 || num > 16) {
          errors.push({ start: directive.args[0].start, end: directive.args[0].end, message: 'Invalid alignment value in .align directive' });
        }
        return;

      case '.ascii':
      case '.asciiz':
        if (currentSection === SectionType.CODE) {
          errors.push({ start: directive.start, end: directive.end, message: `Data directive ${opName} used in code section` });
          return;
        }
        for (const arg of directive.args) {
          if (arg.tokens[0].type !== TokenType.STRING) {
            errors.push({ start: arg.start, end: arg.end, message: `Expected string arguments in ${opName} directive` });
          }
          return;
        }
        return;
      case '.float':
      case '.double':
        if (currentSection === SectionType.CODE) {
          errors.push({ start: directive.start, end: directive.end, message: `Data directive ${opName} used in code section` });
          return;
        }
        for (const arg of directive.args) {
          if (arg.tokens[0].type !== TokenType.NUMBER) {
            errors.push({ start: arg.start, end: arg.end, message: `Expected floating-point arguments in ${opName} directive` });
          }
          return;
        }
        return;
      case '.section':
        errors.push({ start: directive.start, end: directive.end, message: `Unsupported directive` });
        break;
    }
  }

  function validateInstruction(instruction: InstructionNode) {
  }

  for (const node of nodes) {
    switch (node.type) {
      case NodeType.DIRECTIVE:
        validateDirective(node as DirectiveNode);
      case NodeType.INSTRUCTION:
        validateInstruction(node as InstructionNode);
    }
  }

  return { result: null, errors };
}

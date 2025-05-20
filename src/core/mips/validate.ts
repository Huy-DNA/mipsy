import { TokenType, type Token } from "./lex";
import { NodeType, type DirectiveNode, type InstructionDisplacementNode, type InstructionImmediateNode, type InstructionNode, type Node } from "./parse";
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

  function validateRType(instruction: InstructionNode) {
    if (instruction.args.length !== 3) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected 3 arguments for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
      return;
    }

    for (let i = 0; i < instruction.args.length; i++) {
      const arg = instruction.args[i];
      if (arg.type !== NodeType.INSTRUCTION_REGISTER) {
        errors.push({
          start: arg.start,
          end: arg.end,
          message: `Expected register as argument ${i + 1} for ${getTokenLexeme(instruction.op)} instruction`
        });
      }
    }
  }

  function validateShift(instruction: InstructionNode) {
    if (instruction.args.length !== 3) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected 3 arguments for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
      return;
    }

    for (let i = 0; i < 2; i++) {
      const arg = instruction.args[i];
      if (arg.type !== NodeType.INSTRUCTION_REGISTER) {
        errors.push({
          start: arg.start,
          end: arg.end,
          message: `Expected register as argument ${i + 1} for ${getTokenLexeme(instruction.op)} instruction`
        });
      }
    }

    const shiftAmount = instruction.args[2];
    if (shiftAmount.type !== NodeType.INSTRUCTION_IMMEDIATE) {
      errors.push({
        start: shiftAmount.start,
        end: shiftAmount.end,
        message: `Expected immediate value as shift amount for ${getTokenLexeme(instruction.op)} instruction`
      });
    } else {

      const imm = shiftAmount as InstructionImmediateNode;
      const value = Number.parseInt(getTokenLexeme(imm.immediate), 10);
      if (isNaN(value) || value < 0 || value > 31) {
        errors.push({
          start: shiftAmount.start,
          end: shiftAmount.end,
          message: `Shift amount must be in range 0-31 for ${getTokenLexeme(instruction.op)} instruction`
        });
      }
    }
  }

  function validateIType(instruction: InstructionNode) {
    if (instruction.args.length !== 3) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected 3 arguments for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
      return;
    }

    for (let i = 0; i < 2; i++) {
      const arg = instruction.args[i];
      if (arg.type !== NodeType.INSTRUCTION_REGISTER) {
        errors.push({
          start: arg.start,
          end: arg.end,
          message: `Expected register as argument ${i + 1} for ${getTokenLexeme(instruction.op)} instruction`
        });
      }
    }

    const imm = instruction.args[2];
    if (imm.type !== NodeType.INSTRUCTION_IMMEDIATE) {
      errors.push({
        start: imm.start,
        end: imm.end,
        message: `Expected immediate value as argument 3 for ${getTokenLexeme(instruction.op)} instruction`
      });
    } else {

      const immNode = imm as InstructionImmediateNode;
      const value = Number.parseInt(getTokenLexeme(immNode.immediate), 10);
      if (isNaN(value) || value < -32768 || value > 32767) {
        errors.push({
          start: imm.start,
          end: imm.end,
          message: `Immediate value must be a 16-bit signed integer for ${getTokenLexeme(instruction.op)} instruction`
        });
      }
    }
  }

  function validateLoadStore(instruction: InstructionNode) {
    if (instruction.args.length !== 2) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected 2 arguments for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
      return;
    }

    const rt = instruction.args[0];
    if (rt.type !== NodeType.INSTRUCTION_REGISTER) {
      errors.push({
        start: rt.start,
        end: rt.end,
        message: `Expected register as first argument for ${getTokenLexeme(instruction.op)} instruction`
      });
    }

    const disp = instruction.args[1];
    if (disp.type !== NodeType.INSTRUCTION_DISPLACEMENT) {
      errors.push({
        start: disp.start,
        end: disp.end,
        message: `Expected displacement as second argument for ${getTokenLexeme(instruction.op)} instruction`
      });
    } else {

      const dispNode = disp as InstructionDisplacementNode;
      const value = Number.parseInt(getTokenLexeme(dispNode.disp), 10);
      if (isNaN(value) || value < -32768 || value > 32767) {
        errors.push({
          start: disp.start,
          end: disp.end,
          message: `Displacement must be a 16-bit signed integer for ${getTokenLexeme(instruction.op)} instruction`
        });
      }
    }
  }

  function validateBranch(instruction: InstructionNode) {
    if (instruction.args.length !== 3) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected 3 arguments for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
      return;
    }

    for (let i = 0; i < 2; i++) {
      const arg = instruction.args[i];
      if (arg.type !== NodeType.INSTRUCTION_REGISTER) {
        errors.push({
          start: arg.start,
          end: arg.end,
          message: `Expected register as argument ${i + 1} for ${getTokenLexeme(instruction.op)} instruction`
        });
      }
    }

    const label = instruction.args[2];
    if (label.type !== NodeType.INSTRUCTION_IMMEDIATE) {
      errors.push({
        start: label.start,
        end: label.end,
        message: `Expected label as argument 3 for ${getTokenLexeme(instruction.op)} instruction`
      });
    }
  }

  function validateBranchZ(instruction: InstructionNode) {
    if (instruction.args.length !== 2) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected 2 arguments for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
      return;
    }

    const rs = instruction.args[0];
    if (rs.type !== NodeType.INSTRUCTION_REGISTER) {
      errors.push({
        start: rs.start,
        end: rs.end,
        message: `Expected register as first argument for ${getTokenLexeme(instruction.op)} instruction`
      });
    }

    const label = instruction.args[1];
    if (label.type !== NodeType.INSTRUCTION_IMMEDIATE) {
      errors.push({
        start: label.start,
        end: label.end,
        message: `Expected label as second argument for ${getTokenLexeme(instruction.op)} instruction`
      });
    }
  }

  function validateJump(instruction: InstructionNode) {
    if (instruction.args.length !== 1) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected 1 argument for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
      return;
    }

    const label = instruction.args[0];
    if (label.type !== NodeType.INSTRUCTION_IMMEDIATE) {
      errors.push({
        start: label.start,
        end: label.end,
        message: `Expected label as argument for ${getTokenLexeme(instruction.op)} instruction`
      });
    }
  }

  function validateJumpr(instruction: InstructionNode) {
    if (instruction.args.length !== 1) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected 1 argument for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
      return;
    }

    const rs = instruction.args[0];
    if (rs.type !== NodeType.INSTRUCTION_REGISTER) {
      errors.push({
        start: rs.start,
        end: rs.end,
        message: `Expected register as argument for ${getTokenLexeme(instruction.op)} instruction`
      });
    }
  }

  function validateMove(instruction: InstructionNode) {
    if (instruction.args.length !== 2) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected 2 arguments for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
      return;
    }

    for (let i = 0; i < 2; i++) {
      const arg = instruction.args[i];
      if (arg.type !== NodeType.INSTRUCTION_REGISTER) {
        errors.push({
          start: arg.start,
          end: arg.end,
          message: `Expected register as argument ${i + 1} for ${getTokenLexeme(instruction.op)} instruction`
        });
      }
    }
  }

  function validateLi(instruction: InstructionNode) {
    if (instruction.args.length !== 2) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected 2 arguments for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
      return;
    }

    const rt = instruction.args[0];
    if (rt.type !== NodeType.INSTRUCTION_REGISTER) {
      errors.push({
        start: rt.start,
        end: rt.end,
        message: `Expected register as first argument for ${getTokenLexeme(instruction.op)} instruction`
      });
    }

    const imm = instruction.args[1];
    if (imm.type !== NodeType.INSTRUCTION_IMMEDIATE) {
      errors.push({
        start: imm.start,
        end: imm.end,
        message: `Expected immediate value as second argument for ${getTokenLexeme(instruction.op)} instruction`
      });
    } else {

      const immNode = imm as InstructionImmediateNode;
      const value = Number.parseInt(getTokenLexeme(immNode.immediate), 10);
      if (isNaN(value) || value < -2147483648 || value > 2147483647) {
        errors.push({
          start: imm.start,
          end: imm.end,
          message: `Immediate value must be a 32-bit signed integer for ${getTokenLexeme(instruction.op)} instruction`
        });
      }
    }
  }

  function validateLa(instruction: InstructionNode) {
    if (instruction.args.length !== 2) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected 2 arguments for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
      return;
    }

    const rt = instruction.args[0];
    if (rt.type !== NodeType.INSTRUCTION_REGISTER) {
      errors.push({
        start: rt.start,
        end: rt.end,
        message: `Expected register as first argument for ${getTokenLexeme(instruction.op)} instruction`
      });
    }

    const label = instruction.args[1];
    if (label.type !== NodeType.INSTRUCTION_IMMEDIATE) {
      errors.push({
        start: label.start,
        end: label.end,
        message: `Expected label as second argument for ${getTokenLexeme(instruction.op)} instruction`
      });
    }
  }

  function validateStandalone(instruction: InstructionNode) {
    if (instruction.args.length !== 0) {
      errors.push({
        start: instruction.start,
        end: instruction.end,
        message: `Expected no arguments for ${getTokenLexeme(instruction.op)} instruction, got ${instruction.args.length}`
      });
    }
  }

  function validateInstruction(instruction: InstructionNode) {
    if (currentSection !== SectionType.CODE) {
      errors.push({ start: instruction.start, end: instruction.end, message: "Instruction used outside of code section" });
    }

    const op = getTokenLexeme(instruction.op);

    switch (op) {
      case "add":
      case "addu":
      case "sub":
      case "subu":
      case "and":
      case "or":
      case "xor":
      case "nor":
      case "slt":
      case "sltu":
        validateRType(instruction);
        break;

      case "sll":
      case "srl":
      case "sra":
        validateShift(instruction);
        break;

      case "addi":
      case "addiu":
      case "andi":
      case "ori":
      case "xori":
      case "slti":
      case "sltiu":
        validateIType(instruction);
        break;

      case "lb":
      case "lbu":
      case "lh":
      case "lhu":
      case "lw":
      case "sb":
      case "sh":
      case "sw":
        validateLoadStore(instruction);
        break;

      case "beq":
      case "bne":
        validateBranch(instruction);
        break;

      case "bgez":
      case "bgtz":
      case "blez":
      case "bltz":
        validateBranchZ(instruction);
        break;

      case "j":
      case "jal":
        validateJump(instruction);
        break;

      case "jr":
        validateJumpr(instruction)
        break;

      case "move":
        validateMove(instruction);
        break;

      case "li":
        validateLi(instruction);
        break;

      case "la":
        validateLa(instruction);
        break;

      case "syscall":
      case "nop":
        validateStandalone(instruction);
        break;

      default:
        errors.push({ start: instruction.start, end: instruction.end, message: `Unknown instruction ${op}` });
    }
  }

  for (const node of nodes) {
    switch (node.type) {
      case NodeType.DIRECTIVE:
        validateDirective(node as DirectiveNode);
        break;
      case NodeType.INSTRUCTION:
        validateInstruction(node as InstructionNode);
        break;
    }
  }

  return { result: null, errors };
}

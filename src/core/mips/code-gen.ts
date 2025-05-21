import type { Token } from "./lex";
import { NodeType, type DirectiveNode, type InstructionDisplacementNode, type InstructionImmediateNode, type InstructionLabelNode, type InstructionNode, type InstructionRegisterNode, type Node } from "./parse";
import { DATA_START, directives, ops, registers, TEXT_START } from "./types";
import { SectionType } from "./validate";

export class Code {
  // Map a word-aligned address to a word (4 bytes)
  private mem: Map<number, number>;

  constructor() {
    this.mem = new Map<number, number>();
  }

  private alignAddressToWordBoundary(address: number): number {
    return Math.floor(address / 4) * 4;
  }

  storeByte(address: number, byte: number): void {
    byte = byte & 0xFF;

    const wordAddress = this.alignAddressToWordBoundary(address);

    let word = this.mem.get(wordAddress) || 0;

    const bytePosition = address % 4;

    const clearMask = ~(0xFF << (bytePosition * 8));
    word = word & clearMask;

    word = word | (byte << (bytePosition * 8));

    this.mem.set(wordAddress, word);
  }

  storeHalfWord(address: number, halfword: number): void {
    if (address % 2 !== 0) {
      throw new Error("Address must be half-word aligned");
    }

    halfword = halfword & 0xFFFF;

    const wordAddress = this.alignAddressToWordBoundary(address);

    let word = this.mem.get(wordAddress) || 0;

    const halfwordPosition = (address % 4) / 2;

    const clearMask = ~(0xFFFF << (halfwordPosition * 16));
    word = word & clearMask;

    word = word | (halfword << (halfwordPosition * 16));

    this.mem.set(wordAddress, word);
  }

  storeWord(address: number, word: number): void {
    if (address % 4 !== 0) {
      throw new Error("Address must be word aligned");
    }

    this.mem.set(address, word);
  }

  readByte(address: number): number {
    const wordAddress = this.alignAddressToWordBoundary(address);

    const word = this.mem.get(wordAddress) || 0;

    const bytePosition = address % 4;

    return (word >> (bytePosition * 8)) & 0xFF;
  }

  readHalfWord(address: number): number {
    if (address % 2 !== 0) {
      throw new Error("Address must be half-word aligned");
    }

    const wordAddress = this.alignAddressToWordBoundary(address);

    const word = this.mem.get(wordAddress) || 0;

    const halfwordPosition = (address % 4) / 2;

    return (word >> (halfwordPosition * 16)) & 0xFFFF;
  }

  readWord(address: number): number {
    if (address % 4 !== 0) {
      throw new Error("Address must be word aligned");
    }

    return this.mem.get(address) || 0;
  }
}

function mapLabelToAdress(source: string, tokens: Token[], nodes: Node[]): Map<string, number> {
  let dataSectionAddress = DATA_START;
  let codeSectionAddress = TEXT_START;
  let currentSection = SectionType.CODE;
  const labelToAddress = new Map<string, number>();
  for (const node of nodes) {
    switch (node.type) {
      case NodeType.LABEL:
        const labelName = source.slice(node.start.offset, node.end.offset - 1);
        if (currentSection === SectionType.CODE) {
          labelToAddress.set(labelName, codeSectionAddress);
        } else if (currentSection === SectionType.DATA) {
          labelToAddress.set(labelName, dataSectionAddress);
        }
        break;
      case NodeType.DIRECTIVE:
        const directiveNode = node as DirectiveNode;
        const op = directiveNode.op;
        const opName = source.slice(op.start.offset, op.end.offset) as keyof typeof directives;
        switch (opName) {
          case ".data":
            currentSection = SectionType.DATA;
            break;
          case ".text":
          case ".code":
            currentSection = SectionType.CODE;
            break;
          case ".section":
            throw Error("Unsupported directive: .section");
          case ".align":
            if (directiveNode.args.length > 0) {
              const alignArg = directiveNode.args[0];
              const alignValue = alignArg.tokens[0].value as number;
              const alignment = 1 << alignValue;

              if (currentSection === SectionType.DATA) {
                dataSectionAddress = Math.ceil(dataSectionAddress / alignment) * alignment;
              } else {
                codeSectionAddress = Math.ceil(codeSectionAddress / alignment) * alignment;
              }
            }
            break;
          case ".ascii":
            if (directiveNode.args.length > 0) {
              for (const arg of directiveNode.args) {
                dataSectionAddress += (arg.tokens[0].value as string).length;
              }
            }
            break;
          case ".asciiz":
            if (directiveNode.args.length > 0) {
              for (const arg of directiveNode.args) {
                dataSectionAddress += (arg.tokens[0].value as string).length + 1;
              }
            }
            break;
          case ".byte":
            dataSectionAddress += directiveNode.args.length;
            break;
          case ".half":
            dataSectionAddress += directiveNode.args.length * 2;
            break;
          case ".word":
            dataSectionAddress += directiveNode.args.length * 4;
            break;
          case ".float":
            dataSectionAddress += directiveNode.args.length * 4;
            break;
          case ".double":
            dataSectionAddress += directiveNode.args.length * 8;
            break;
        }
        break;
      case NodeType.INSTRUCTION:
        codeSectionAddress += 4;
        break;
      default:
        throw new Error("Unreachable in mapLabelToAddress");
    }
  }
  return labelToAddress;
}

export function generate(source: string, tokens: Token[], nodes: Node[]): Code {
  let dataSectionAddress = DATA_START;
  let codeSectionAddress = TEXT_START;
  let currentSection = SectionType.CODE;
  const code = new Code();
  const labelToAddress = mapLabelToAdress(source, tokens, nodes);

  for (const node of nodes) {
    switch (node.type) {
      case NodeType.DIRECTIVE:
        const directiveNode = node as DirectiveNode;
        const op = directiveNode.op;
        const opName = source.slice(op.start.offset, op.end.offset) as keyof typeof directives;

        switch (opName) {
          case ".data":
            currentSection = SectionType.DATA;
            break;
          case ".text":
          case ".code":
            currentSection = SectionType.CODE;
            break;
          case ".section":
            throw new Error("Unsupported directive: .section");
          case ".align":
            if (directiveNode.args.length > 0) {
              const alignArg = directiveNode.args[0];
              const alignValue = alignArg.tokens[0].value as number;
              const alignment = 1 << alignValue;

              if (currentSection === SectionType.DATA) {
                dataSectionAddress = Math.ceil(dataSectionAddress / alignment) * alignment;
              } else {
                codeSectionAddress = Math.ceil(codeSectionAddress / alignment) * alignment;
              }
            }
            break;
          case ".ascii":
            if (directiveNode.args.length > 0) {
              for (const arg of directiveNode.args) {
                const str = arg.tokens[0].value as string;
                for (let i = 0; i < str.length; i++) {
                  code.storeByte(dataSectionAddress, str.charCodeAt(i));
                  dataSectionAddress++;
                }
              }
            }
            break;
          case ".asciiz":
            if (directiveNode.args.length > 0) {
              for (const arg of directiveNode.args) {
                const str = arg.tokens[0].value as string;
                for (let i = 0; i < str.length; i++) {
                  code.storeByte(dataSectionAddress, str.charCodeAt(i));
                  dataSectionAddress++;
                }
                code.storeByte(dataSectionAddress, 0);
                dataSectionAddress++;
              }
            }
            break;
          case ".byte":
            for (const arg of directiveNode.args) {
              const value = arg.tokens[0].value as number;
              code.storeByte(dataSectionAddress, value);
              dataSectionAddress++;
            }
            break;
          case ".half":
            for (const arg of directiveNode.args) {
              const value = arg.tokens[0].value as number;
              code.storeHalfWord(dataSectionAddress, value);
              dataSectionAddress += 2;
            }
            break;
          case ".word":
            for (const arg of directiveNode.args) {
              const value = arg.tokens[0].value as number;
              code.storeWord(dataSectionAddress, value);
              dataSectionAddress += 4;
            }
            break;
          case ".float":
            for (const arg of directiveNode.args) {
              const value = arg.tokens[0].value as number;
              const floatBuffer = new ArrayBuffer(4);
              const floatView = new Float32Array(floatBuffer);
              const intView = new Uint32Array(floatBuffer);
              floatView[0] = value;
              code.storeWord(dataSectionAddress, intView[0]);
              dataSectionAddress += 4;
            }
            break;
          case ".double":
            for (const arg of directiveNode.args) {
              const value = arg.tokens[0].value as number;
              const doubleBuffer = new ArrayBuffer(8);
              const doubleView = new Float64Array(doubleBuffer);
              const intView = new Uint32Array(doubleBuffer);
              doubleView[0] = value;

              code.storeWord(dataSectionAddress, intView[1]);
              code.storeWord(dataSectionAddress + 4, intView[0]);
              dataSectionAddress += 8;
            }
            break;
        }
        break;
      case NodeType.INSTRUCTION:
        const instructionNode = node as InstructionNode;
        const instructionOp = instructionNode.op;
        const instructionName = source.slice(instructionOp.start.offset, instructionOp.end.offset);

        const instruction = (ops as any)[instructionName];

        if (!instruction) {
          throw new Error(`Unknown instruction: ${instructionName}`);
        }

        let machineCode = 0;

        if (instruction.pseudo) {
          handlePseudoInstruction(code, codeSectionAddress, instructionNode, source, labelToAddress);
        } else if (instruction.type === "R") {
          // R-type instruction format: opcode (6) | rs (5) | rt (5) | rd (5) | shamt (5) | funct (6)
          machineCode = (instruction.opcode << 26);

          if (instructionName === "jr") {
            // jr $rs
            if (instructionNode.args.length === 1 && instructionNode.args[0].type === NodeType.INSTRUCTION_REGISTER) {
              const rs = getRegisterNumber(instructionNode.args[0] as InstructionRegisterNode, source);
              machineCode |= (rs << 21);
            }
          } else if (instructionName === "syscall" || instructionName === "break") {
          } else if (instructionName === "sll" || instructionName === "srl" || instructionName === "sra") {
            // Format: op $rd, $rt, shamt
            if (instructionNode.args.length === 3 &&
              instructionNode.args[0].type === NodeType.INSTRUCTION_REGISTER &&
              instructionNode.args[1].type === NodeType.INSTRUCTION_REGISTER &&
              instructionNode.args[2].type === NodeType.INSTRUCTION_IMMEDIATE) {

              const rd = getRegisterNumber(instructionNode.args[0] as InstructionRegisterNode, source);
              const rt = getRegisterNumber(instructionNode.args[1] as InstructionRegisterNode, source);
              const shamt = (instructionNode.args[2] as InstructionImmediateNode).immediate.value as number;

              machineCode |= (rt << 16) | (rd << 11) | ((shamt & 0x1F) << 6) | instruction.funct;
            }
          } else {
            // Most R-type instructions: op $rd, $rs, $rt
            if (instructionNode.args.length === 3 &&
              instructionNode.args[0].type === NodeType.INSTRUCTION_REGISTER &&
              instructionNode.args[1].type === NodeType.INSTRUCTION_REGISTER &&
              instructionNode.args[2].type === NodeType.INSTRUCTION_REGISTER) {

              const rd = getRegisterNumber(instructionNode.args[0] as InstructionRegisterNode, source);
              const rs = getRegisterNumber(instructionNode.args[1] as InstructionRegisterNode, source);
              const rt = getRegisterNumber(instructionNode.args[2] as InstructionRegisterNode, source);

              machineCode |= (rs << 21) | (rt << 16) | (rd << 11) | instruction.funct;
            }
          }
        } else if (instruction.type === "I") {
          // I-type instruction format: opcode (6) | rs (5) | rt (5) | immediate (16)
          machineCode = (instruction.opcode << 26);

          if (instructionName === "lui") {
            // lui $rt, imm
            if (instructionNode.args.length === 2 &&
              instructionNode.args[0].type === NodeType.INSTRUCTION_REGISTER &&
              instructionNode.args[1].type === NodeType.INSTRUCTION_IMMEDIATE) {

              const rt = getRegisterNumber(instructionNode.args[0] as InstructionRegisterNode, source);
              const imm = (instructionNode.args[1] as InstructionImmediateNode).immediate.value as number;

              machineCode |= (rt << 16) | (imm & 0xFFFF);
            }
          } else if (instructionName === "beq" || instructionName === "bne") {
            // beq/bne $rs, $rt, label
            if (instructionNode.args.length === 3 &&
              instructionNode.args[0].type === NodeType.INSTRUCTION_REGISTER &&
              instructionNode.args[1].type === NodeType.INSTRUCTION_REGISTER &&
              instructionNode.args[2].type === NodeType.INSTRUCTION_LABEL) {

              const rs = getRegisterNumber(instructionNode.args[0] as InstructionRegisterNode, source);
              const rt = getRegisterNumber(instructionNode.args[1] as InstructionRegisterNode, source);
              const labelNode = instructionNode.args[2] as InstructionLabelNode;
              const labelName = source.slice(labelNode.label.start.offset, labelNode.label.end.offset);
              const labelAddress = labelToAddress.get(labelName);

              if (labelAddress === undefined) {
                throw new Error(`Unknown label: ${labelName}`);
              }

              const offset = (labelAddress - (codeSectionAddress + 4)) / 4;

              machineCode |= (rs << 21) | (rt << 16) | (offset & 0xFFFF);
            }
          } else if (instructionName === "lw" || instructionName === "sw" ||
            instructionName === "lb" || instructionName === "lh" ||
            instructionName === "lbu" || instructionName === "lhu" ||
            instructionName === "sb" || instructionName === "sh") {
            // Format: op $rt, offset($rs)
            if (instructionNode.args.length === 2 &&
              instructionNode.args[0].type === NodeType.INSTRUCTION_REGISTER &&
              instructionNode.args[1].type === NodeType.INSTRUCTION_DISPLACEMENT) {

              const rt = getRegisterNumber(instructionNode.args[0] as InstructionRegisterNode, source);
              const dispNode = instructionNode.args[1] as InstructionDisplacementNode;
              const rs = getRegisterNumber({ type: NodeType.INSTRUCTION_REGISTER, register: dispNode.register } as InstructionRegisterNode, source);
              const offset = dispNode.disp.value as number;

              machineCode |= (rs << 21) | (rt << 16) | (offset & 0xFFFF);
            }
          } else {
            // Standard I-type: op $rt, $rs, imm
            if (instructionNode.args.length === 3 &&
              instructionNode.args[0].type === NodeType.INSTRUCTION_REGISTER &&
              instructionNode.args[1].type === NodeType.INSTRUCTION_REGISTER &&
              instructionNode.args[2].type === NodeType.INSTRUCTION_IMMEDIATE) {

              const rt = getRegisterNumber(instructionNode.args[0] as InstructionRegisterNode, source);
              const rs = getRegisterNumber(instructionNode.args[1] as InstructionRegisterNode, source);
              const imm = (instructionNode.args[2] as InstructionImmediateNode).immediate.value as number;

              machineCode |= (rs << 21) | (rt << 16) | (imm & 0xFFFF);
            }
          }
        } else if (instruction.type === "J") {
          // J-type instruction format: opcode (6) | address (26)
          machineCode = (instruction.opcode << 26);

          // j/jal label
          if (instructionNode.args.length === 1 && instructionNode.args[0].type === NodeType.INSTRUCTION_LABEL) {
            const labelNode = instructionNode.args[0] as InstructionLabelNode;
            const labelName = source.slice(labelNode.label.start.offset, labelNode.label.end.offset);
            const labelAddress = labelToAddress.get(labelName);

            if (labelAddress === undefined) {
              throw new Error(`Unknown label: ${labelName}`);
            }

            const addressField = (labelAddress & 0x0FFFFFFF) >> 2;
            machineCode |= addressField & 0x03FFFFFF;
          }
        }

        if (!instruction.pseudo) {
          code.storeWord(codeSectionAddress, machineCode);
          codeSectionAddress += 4;
        }
        break;
      case NodeType.LABEL:
        break;
      default:
        throw new Error("Unreachable in generate");
    }
  }

  return code;
}

function getRegisterNumber(regNode: InstructionRegisterNode, source: string): number {
  const regName = source.slice(regNode.register.start.offset, regNode.register.end.offset).replace('$', '');
  const regNumber = registers[regName as keyof typeof registers];

  if (regNumber === undefined) {
    throw new Error(`Unknown register: $${regName}`);
  }

  return regNumber;
}

function handlePseudoInstruction(
  code: Code,
  address: number,
  instructionNode: InstructionNode,
  source: string,
  labelToAddress: Map<string, number>
): void {
  const instructionOp = instructionNode.op;
  const instructionName = source.slice(instructionOp.start.offset, instructionOp.end.offset);

  switch (instructionName) {
    case "move":
      // move $rd, $rs -> addu $rd, $rs, $zero
      if (instructionNode.args.length === 2 &&
        instructionNode.args[0].type === NodeType.INSTRUCTION_REGISTER &&
        instructionNode.args[1].type === NodeType.INSTRUCTION_REGISTER) {

        const rd = getRegisterNumber(instructionNode.args[0] as InstructionRegisterNode, source);
        const rs = getRegisterNumber(instructionNode.args[1] as InstructionRegisterNode, source);

        // addu $rd, $rs, $zero
        const machineCode = (0x00 << 26) | (rs << 21) | (0 << 16) | (rd << 11) | 0x21;
        code.storeWord(address, machineCode);
      }
      break;
    case "li":
      // li $rt, imm -> lui $rt, upper + ori $rt, $rt, lower
      if (instructionNode.args.length === 2 &&
        instructionNode.args[0].type === NodeType.INSTRUCTION_REGISTER &&
        instructionNode.args[1].type === NodeType.INSTRUCTION_IMMEDIATE) {

        const rt = getRegisterNumber(instructionNode.args[0] as InstructionRegisterNode, source);
        const imm = (instructionNode.args[1] as InstructionImmediateNode).immediate.value as number;

        const upper = (imm >> 16) & 0xFFFF;
        const lower = imm & 0xFFFF;

        if (upper !== 0) {
          // lui $rt, upper
          const luiCode = (0x0F << 26) | (rt << 16) | upper;
          code.storeWord(address, luiCode);
          address += 4;
        }

        // ori $rt, $rt, lower
        const oriCode = (0x0D << 26) | (rt << 21) | (rt << 16) | lower;
        code.storeWord(address, oriCode);
      }
      break;
    case "nop":
      // nop -> sll $zero, $zero, 0
      const nopCode = 0x00000000; // sll $zero, $zero, 0
      code.storeWord(address, nopCode);
      break;
    default:
      throw new Error(`Unimplemented pseudo-instruction: ${instructionName}`);
  }
}

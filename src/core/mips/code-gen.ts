import { NodeType, type DirectiveNode, type Node } from "./parse";
import { DATA_START, directives, TEXT_START } from "./types";
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
        throw new Error("Unreachable in generate");
    }
  }
  return labelToAddress;
}

export function generate(source: string, tokens: Token[], nodes: Node[]): Code {
  const code = new Code(); return code;
}

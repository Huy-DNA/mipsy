// AI-generated

import type { Code } from "./code-gen";
import { ops, TEXT_START, DATA_START, STACK_START } from "./types";

export class MipsSimulator {
  // Register file (32 general-purpose registers)
  private registers: Int32Array;

  // Special registers
  private pc: number; // Program counter
  private hi: number; // High result register
  private lo: number; // Low result register

  // Memory reference
  private memory: Code;

  // Execution state
  private running: boolean;
  private instructionsExecuted: number;
  private maxInstructions: number;

  constructor(code: Code, maxInstructions = 100000) {
    this.registers = new Int32Array(32);
    this.pc = TEXT_START;
    this.hi = 0;
    this.lo = 0;
    this.memory = code;
    this.running = false;
    this.instructionsExecuted = 0;
    this.maxInstructions = maxInstructions;

    // Initialize stack pointer
    this.registers[29] = STACK_START;

    // Register 0 is always zero
    this.registers[0] = 0;
  }

  public run(): { exitCode: number, instructionsExecuted: number } {
    this.running = true;
    this.instructionsExecuted = 0;

    while (this.running && this.instructionsExecuted < this.maxInstructions) {
      // Fetch instruction
      try {
        const instruction = this.memory.readWord(this.pc);

        // Decode and execute instruction
        this.decodeAndExecute(instruction);

        // Ensure $zero is always 0
        this.registers[0] = 0;

        // Increment instruction counter
        this.instructionsExecuted++;

      } catch (error) {
        console.error("Execution error:", error);
        this.running = false;
        return { exitCode: -1, instructionsExecuted: this.instructionsExecuted };
      }
    }

    if (this.instructionsExecuted >= this.maxInstructions) {
      console.warn(`Reached maximum instruction limit (${this.maxInstructions})`);
      return { exitCode: -2, instructionsExecuted: this.instructionsExecuted };
    }

    // Return value is in $v0 (register 2)
    return { exitCode: this.registers[2], instructionsExecuted: this.instructionsExecuted };
  }

  public getRegister(index: number): number {
    if (index < 0 || index > 31) {
      throw new Error(`Invalid register index: ${index}`);
    }
    return this.registers[index];
  }

  public getMemoryWord(address: number): number {
    return this.memory.readWord(address);
  }

  public getPC(): number {
    return this.pc;
  }

  private decodeAndExecute(instruction: number): void {
    // Extract instruction fields
    const opcode = (instruction >>> 26) & 0x3F;
    const rs = (instruction >>> 21) & 0x1F;
    const rt = (instruction >>> 16) & 0x1F;
    const rd = (instruction >>> 11) & 0x1F;
    const shamt = (instruction >>> 6) & 0x1F;
    const funct = instruction & 0x3F;
    const immediate = instruction & 0xFFFF;
    const signExtImm = (immediate & 0x8000) ? (immediate | 0xFFFF0000) : immediate;
    const address = instruction & 0x3FFFFFF;

    // Advance PC before executing instruction (for branch delay slot considerations)
    const nextPC = this.pc + 4;

    // R-type instructions (opcode 0)
    if (opcode === 0) {
      switch (funct) {
        // Arithmetic
        case 0x20: // add
          this.registers[rd] = this.registers[rs] + this.registers[rt];
          break;
        case 0x21: // addu
          this.registers[rd] = (this.registers[rs] + this.registers[rt]) >>> 0;
          break;
        case 0x22: // sub
          this.registers[rd] = this.registers[rs] - this.registers[rt];
          break;
        case 0x23: // subu
          this.registers[rd] = (this.registers[rs] - this.registers[rt]) >>> 0;
          break;

        // Logical
        case 0x24: // and
          this.registers[rd] = this.registers[rs] & this.registers[rt];
          break;
        case 0x25: // or
          this.registers[rd] = this.registers[rs] | this.registers[rt];
          break;
        case 0x26: // xor
          this.registers[rd] = this.registers[rs] ^ this.registers[rt];
          break;
        case 0x27: // nor
          this.registers[rd] = ~(this.registers[rs] | this.registers[rt]);
          break;

        // Shifts
        case 0x00: // sll
          this.registers[rd] = this.registers[rt] << shamt;
          break;
        case 0x02: // srl
          this.registers[rd] = this.registers[rt] >>> shamt;
          break;
        case 0x03: // sra
          this.registers[rd] = this.registers[rt] >> shamt;
          break;
        case 0x04: // sllv
          this.registers[rd] = this.registers[rt] << (this.registers[rs] & 0x1F);
          break;
        case 0x06: // srlv
          this.registers[rd] = this.registers[rt] >>> (this.registers[rs] & 0x1F);
          break;
        case 0x07: // srav
          this.registers[rd] = this.registers[rt] >> (this.registers[rs] & 0x1F);
          break;

        // Jumps
        case 0x08: // jr
          this.pc = this.registers[rs];
          return; // Skip PC update at the end
        case 0x09: // jalr
          this.registers[rd] = nextPC;
          this.pc = this.registers[rs];
          return; // Skip PC update at the end

        // Comparisons
        case 0x2A: // slt
          this.registers[rd] = (this.registers[rs] < this.registers[rt]) ? 1 : 0;
          break;
        case 0x2B: // sltu
          this.registers[rd] = ((this.registers[rs] >>> 0) < (this.registers[rt] >>> 0)) ? 1 : 0;
          break;

        // HI/LO operations
        case 0x10: // mfhi
          this.registers[rd] = this.hi;
          break;
        case 0x11: // mthi
          this.hi = this.registers[rs];
          break;
        case 0x12: // mflo
          this.registers[rd] = this.lo;
          break;
        case 0x13: // mtlo
          this.lo = this.registers[rs];
          break;

        // Multiply/Divide
        case 0x18: // mult
          const multResult = BigInt(this.registers[rs]) * BigInt(this.registers[rt]);
          this.lo = Number(multResult & BigInt(0xFFFFFFFF));
          this.hi = Number((multResult >> BigInt(32)) & BigInt(0xFFFFFFFF));
          break;
        case 0x19: // multu
          const multuResult = BigInt(this.registers[rs] >>> 0) * BigInt(this.registers[rt] >>> 0);
          this.lo = Number(multuResult & BigInt(0xFFFFFFFF));
          this.hi = Number((multuResult >> BigInt(32)) & BigInt(0xFFFFFFFF));
          break;
        case 0x1A: // div
          if (this.registers[rt] !== 0) {
            this.lo = Math.trunc(this.registers[rs] / this.registers[rt]);
            this.hi = this.registers[rs] % this.registers[rt];
          }
          break;
        case 0x1B: // divu
          if (this.registers[rt] !== 0) {
            this.lo = Math.trunc((this.registers[rs] >>> 0) / (this.registers[rt] >>> 0));
            this.hi = (this.registers[rs] >>> 0) % (this.registers[rt] >>> 0);
          }
          break;

        // System calls
        case 0x0C: // syscall
          this.handleSyscall();
          break;

        default:
          throw new Error(`Unsupported R-type instruction function: 0x${funct.toString(16)}`);
      }
    }
    // I-type instructions
    else {
      switch (opcode) {
        // Arithmetic immediate
        case 0x08: // addi
          this.registers[rt] = this.registers[rs] + signExtImm;
          break;
        case 0x09: // addiu
          this.registers[rt] = (this.registers[rs] + signExtImm) | 0; // Force 32-bit
          break;

        // Logical immediate
        case 0x0C: // andi
          this.registers[rt] = this.registers[rs] & immediate;
          break;
        case 0x0D: // ori
          this.registers[rt] = this.registers[rs] | immediate;
          break;
        case 0x0E: // xori
          this.registers[rt] = this.registers[rs] ^ immediate;
          break;
        case 0x0F: // lui
          this.registers[rt] = immediate << 16;
          break;

        // Comparison immediate
        case 0x0A: // slti
          this.registers[rt] = (this.registers[rs] < signExtImm) ? 1 : 0;
          break;
        case 0x0B: // sltiu
          this.registers[rt] = ((this.registers[rs] >>> 0) < (signExtImm >>> 0)) ? 1 : 0;
          break;

        // Memory operations
        case 0x23: // lw
          const lwAddr = this.registers[rs] + signExtImm;
          this.registers[rt] = this.memory.readWord(lwAddr);
          break;
        case 0x2B: // sw
          const swAddr = this.registers[rs] + signExtImm;
          this.memory.storeWord(swAddr, this.registers[rt]);
          break;
        case 0x20: // lb
          const lbAddr = this.registers[rs] + signExtImm;
          const lbVal = this.memory.readByte(lbAddr);
          this.registers[rt] = (lbVal & 0x80) ? (lbVal | 0xFFFFFF00) : lbVal;
          break;
        case 0x24: // lbu
          const lbuAddr = this.registers[rs] + signExtImm;
          this.registers[rt] = this.memory.readByte(lbuAddr) & 0xFF;
          break;
        case 0x21: // lh
          const lhAddr = this.registers[rs] + signExtImm;
          const lhVal = this.memory.readHalfWord(lhAddr);
          this.registers[rt] = (lhVal & 0x8000) ? (lhVal | 0xFFFF0000) : lhVal;
          break;
        case 0x25: // lhu
          const lhuAddr = this.registers[rs] + signExtImm;
          this.registers[rt] = this.memory.readHalfWord(lhuAddr) & 0xFFFF;
          break;
        case 0x28: // sb
          const sbAddr = this.registers[rs] + signExtImm;
          this.memory.storeByte(sbAddr, this.registers[rt] & 0xFF);
          break;
        case 0x29: // sh
          const shAddr = this.registers[rs] + signExtImm;
          this.memory.storeHalfWord(shAddr, this.registers[rt] & 0xFFFF);
          break;

        // Branch instructions
        case 0x04: // beq
          if (this.registers[rs] === this.registers[rt]) {
            this.pc = nextPC + (signExtImm << 2);
            return; // Skip PC update at the end
          }
          break;
        case 0x05: // bne
          if (this.registers[rs] !== this.registers[rt]) {
            this.pc = nextPC + (signExtImm << 2);
            return; // Skip PC update at the end
          }
          break;
        case 0x06: // blez
          if (this.registers[rs] <= 0) {
            this.pc = nextPC + (signExtImm << 2);
            return; // Skip PC update at the end
          }
          break;
        case 0x07: // bgtz
          if (this.registers[rs] > 0) {
            this.pc = nextPC + (signExtImm << 2);
            return; // Skip PC update at the end
          }
          break;
        case 0x01: // bgez, bltz, bgezal, bltzal
          if (rt === 0x00) { // bltz
            if (this.registers[rs] < 0) {
              this.pc = nextPC + (signExtImm << 2);
              return; // Skip PC update at the end
            }
          } else if (rt === 0x01) { // bgez
            if (this.registers[rs] >= 0) {
              this.pc = nextPC + (signExtImm << 2);
              return; // Skip PC update at the end
            }
          } else if (rt === 0x10) { // bltzal
            if (this.registers[rs] < 0) {
              this.registers[31] = nextPC;
              this.pc = nextPC + (signExtImm << 2);
              return; // Skip PC update at the end
            }
          } else if (rt === 0x11) { // bgezal
            if (this.registers[rs] >= 0) {
              this.registers[31] = nextPC;
              this.pc = nextPC + (signExtImm << 2);
              return; // Skip PC update at the end
            }
          }
          break;

        default:
          // J-type instructions (handled separately because they're encoded differently)
          if (opcode === 0x02) { // j
            this.pc = ((nextPC & 0xF0000000) | (address << 2));
            return; // Skip PC update at the end
          } else if (opcode === 0x03) { // jal
            this.registers[31] = nextPC;
            this.pc = ((nextPC & 0xF0000000) | (address << 2));
            return; // Skip PC update at the end
          } else {
            throw new Error(`Unsupported opcode: 0x${opcode.toString(16)}`);
          }
      }
    }

    // Update PC (for non-branch/jump instructions)
    this.pc = nextPC;
  }

  private handleSyscall(): void {
    // Syscall number is in $v0 (register 2)
    const syscallNum = this.registers[2];

    switch (syscallNum) {
      case 1: // print_int
        console.log(this.registers[4]);
        break;
      case 2: // print_float
        // Float handling would require additional implementation
        console.log(`[Float: ${this.registers[4]}]`);
        break;
      case 3: // print_double
        // Double handling would require additional implementation
        console.log(`[Double: ${this.registers[4]}]`);
        break;
      case 4: // print_string
        let addr = this.registers[4];
        let str = "";
        let char;
        while ((char = this.memory.readByte(addr)) !== 0) {
          str += String.fromCharCode(char);
          addr++;
        }
        console.log(str);
        break;
      case 5: // read_int
        // In a browser environment, this would require user input
        this.registers[2] = 0; // Default value
        break;
      case 8: // read_string
        // In a browser environment, this would require user input
        break;
      case 9: // sbrk (allocate heap memory)
        // Simple heap allocation (not implemented)
        break;
      case 10: // exit
        this.running = false;
        break;
      case 11: // print_char
        console.log(String.fromCharCode(this.registers[4] & 0xFF));
        break;
      case 12: // read_char
        // In a browser environment, this would require user input
        this.registers[2] = 0; // Default character
        break;
      case 13: // open file
      case 14: // read from file
      case 15: // write to file
      case 16: // close file
        // File operations not implemented
        this.registers[2] = -1; // Error
        break;
      case 17: // exit2
        this.running = false;
        // Return value is already in $a0
        this.registers[2] = this.registers[4];
        break;
      default:
        throw new Error(`Unsupported syscall: ${syscallNum}`);
    }
  }
}

export function execute(code: Code): { exitCode: number, instructionsExecuted: number } {
  const simulator = new MipsSimulator(code);
  return simulator.run();
}

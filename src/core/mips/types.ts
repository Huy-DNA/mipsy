export interface Position {
  offset: number;
  line: number;
}

export interface Result<T, E> {
  result: T,
  errors: E,
}

export interface Error {
  start: Position;
  end: Position;
  message: string;
}

export const registers = {
  // Numeric registers
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, "11": 11, "12": 12, "13": 13, "14": 14, "15": 15,
  "16": 16, "17": 17, "18": 18, "19": 19, "20": 20, "21": 21, "22": 22, "23": 23,
  "24": 24, "25": 25, "26": 26, "27": 27, "28": 28, "29": 29, "30": 30, "31": 31,

  // Register names with their corresponding numeric values
  // Return values
  "v0": 2, "v1": 3,

  // Arguments
  "a0": 4, "a1": 5, "a2": 6, "a3": 7,

  // Temporaries
  "t0": 8, "t1": 9, "t2": 10, "t3": 11, "t4": 12, "t5": 13, "t6": 14, "t7": 15,
  "t8": 24, "t9": 25,

  // Saved temporaries
  "s0": 16, "s1": 17, "s2": 18, "s3": 19, "s4": 20, "s5": 21, "s6": 22, "s7": 23,

  // Special purpose
  "ra": 31,  // Return address
  "sp": 29,  // Stack pointer
  "bp": 30,  // Base pointer (sometimes called fp - frame pointer)

  // Additional special registers
  "zero": 0, // Always contains zero
  "at": 1,   // Assembly temporary
  "gp": 28,  // Global pointer
  "fp": 30,  // Frame pointer (same as bp)
  "k0": 26,  // Kernel use
  "k1": 27   // Kernel use
}

export const ops = {
  // R-type instructions (opcode = 0, distinguished by function code)
  "add": { type: "R", opcode: 0x00, funct: 0x20 },   // 000000 sssss ttttt ddddd 00000 100000
  "addu": { type: "R", opcode: 0x00, funct: 0x21 },  // 000000 sssss ttttt ddddd 00000 100001
  "sub": { type: "R", opcode: 0x00, funct: 0x22 },   // 000000 sssss ttttt ddddd 00000 100010
  "subu": { type: "R", opcode: 0x00, funct: 0x23 },  // 000000 sssss ttttt ddddd 00000 100011
  "and": { type: "R", opcode: 0x00, funct: 0x24 },   // 000000 sssss ttttt ddddd 00000 100100
  "or": { type: "R", opcode: 0x00, funct: 0x25 },    // 000000 sssss ttttt ddddd 00000 100101
  "xor": { type: "R", opcode: 0x00, funct: 0x26 },   // 000000 sssss ttttt ddddd 00000 100110
  "nor": { type: "R", opcode: 0x00, funct: 0x27 },   // 000000 sssss ttttt ddddd 00000 100111
  "slt": { type: "R", opcode: 0x00, funct: 0x2A },   // 000000 sssss ttttt ddddd 00000 101010
  "sltu": { type: "R", opcode: 0x00, funct: 0x2B },  // 000000 sssss ttttt ddddd 00000 101011
  "sll": { type: "R", opcode: 0x00, funct: 0x00 },   // 000000 00000 ttttt ddddd hhhhh 000000
  "srl": { type: "R", opcode: 0x00, funct: 0x02 },   // 000000 00000 ttttt ddddd hhhhh 000010
  "sra": { type: "R", opcode: 0x00, funct: 0x03 },   // 000000 00000 ttttt ddddd hhhhh 000011
  "sllv": { type: "R", opcode: 0x00, funct: 0x04 },  // 000000 sssss ttttt ddddd 00000 000100
  "srlv": { type: "R", opcode: 0x00, funct: 0x06 },  // 000000 sssss ttttt ddddd 00000 000110
  "srav": { type: "R", opcode: 0x00, funct: 0x07 },  // 000000 sssss ttttt ddddd 00000 000111
  "jr": { type: "R", opcode: 0x00, funct: 0x08 },    // 000000 sssss 00000 00000 00000 001000
  "jalr": { type: "R", opcode: 0x00, funct: 0x09 },  // 000000 sssss 00000 ddddd 00000 001001
  "syscall": { type: "R", opcode: 0x00, funct: 0x0C }, // 000000 [20-bit code] 001100
  "break": { type: "R", opcode: 0x00, funct: 0x0D }, // 000000 [20-bit code] 001101
  "mfhi": { type: "R", opcode: 0x00, funct: 0x10 },  // 000000 00000 00000 ddddd 00000 010000
  "mthi": { type: "R", opcode: 0x00, funct: 0x11 },  // 000000 sssss 00000 00000 00000 010001
  "mflo": { type: "R", opcode: 0x00, funct: 0x12 },  // 000000 00000 00000 ddddd 00000 010010
  "mtlo": { type: "R", opcode: 0x00, funct: 0x13 },  // 000000 sssss 00000 00000 00000 010011
  "mult": { type: "R", opcode: 0x00, funct: 0x18 },  // 000000 sssss ttttt 00000 00000 011000
  "multu": { type: "R", opcode: 0x00, funct: 0x19 }, // 000000 sssss ttttt 00000 00000 011001
  "div": { type: "R", opcode: 0x00, funct: 0x1A },   // 000000 sssss ttttt 00000 00000 011010
  "divu": { type: "R", opcode: 0x00, funct: 0x1B },  // 000000 sssss ttttt 00000 00000 011011

  // I-type instructions (opcode distinguishes the instruction)
  "addi": { type: "I", opcode: 0x08 },  // 001000 sssss ttttt iiiiiiiiiiiiiiii
  "addiu": { type: "I", opcode: 0x09 }, // 001001 sssss ttttt iiiiiiiiiiiiiiii
  "andi": { type: "I", opcode: 0x0C },  // 001100 sssss ttttt iiiiiiiiiiiiiiii
  "ori": { type: "I", opcode: 0x0D },   // 001101 sssss ttttt iiiiiiiiiiiiiiii
  "xori": { type: "I", opcode: 0x0E },  // 001110 sssss ttttt iiiiiiiiiiiiiiii
  "lui": { type: "I", opcode: 0x0F },   // 001111 00000 ttttt iiiiiiiiiiiiiiii
  "lw": { type: "I", opcode: 0x23 },    // 100011 sssss ttttt iiiiiiiiiiiiiiii
  "sw": { type: "I", opcode: 0x2B },    // 101011 sssss ttttt iiiiiiiiiiiiiiii
  "lb": { type: "I", opcode: 0x20 },    // 100000 sssss ttttt iiiiiiiiiiiiiiii
  "lh": { type: "I", opcode: 0x21 },    // 100001 sssss ttttt iiiiiiiiiiiiiiii
  "lbu": { type: "I", opcode: 0x24 },   // 100100 sssss ttttt iiiiiiiiiiiiiiii
  "lhu": { type: "I", opcode: 0x25 },   // 100101 sssss ttttt iiiiiiiiiiiiiiii
  "sb": { type: "I", opcode: 0x28 },    // 101000 sssss ttttt iiiiiiiiiiiiiiii
  "sh": { type: "I", opcode: 0x29 },    // 101001 sssss ttttt iiiiiiiiiiiiiiii
  "slti": { type: "I", opcode: 0x0A },  // 001010 sssss ttttt iiiiiiiiiiiiiiii
  "sltiu": { type: "I", opcode: 0x0B }, // 001011 sssss ttttt iiiiiiiiiiiiiiii
  "beq": { type: "I", opcode: 0x04 },   // 000100 sssss ttttt iiiiiiiiiiiiiiii
  "bne": { type: "I", opcode: 0x05 },   // 000101 sssss ttttt iiiiiiiiiiiiiiii

  // Special branches (rt field distinguishes the instruction)
  "bgez": { type: "I", opcode: 0x01, rt: 0x01 }, // 000001 sssss 00001 iiiiiiiiiiiiiiii
  "bgtz": { type: "I", opcode: 0x07, rt: 0x00 }, // 000111 sssss 00000 iiiiiiiiiiiiiiii
  "blez": { type: "I", opcode: 0x06, rt: 0x00 }, // 000110 sssss 00000 iiiiiiiiiiiiiiii
  "bltz": { type: "I", opcode: 0x01, rt: 0x00 }, // 000001 sssss 00000 iiiiiiiiiiiiiiii
  "bltzal": { type: "I", opcode: 0x01, rt: 0x10 }, // 000001 sssss 10000 iiiiiiiiiiiiiiii
  "bgezal": { type: "I", opcode: 0x01, rt: 0x11 }, // 000001 sssss 10001 iiiiiiiiiiiiiiii

  // J-type instructions
  "j": { type: "J", opcode: 0x02 },    // 000010 iiiiiiiiiiiiiiiiiiiiiiiiii
  "jal": { type: "J", opcode: 0x03 },  // 000011 iiiiiiiiiiiiiiiiiiiiiiiiii

  // Pseudo-instructions - these don't have direct hardware encodings
  "move": { pseudo: true, realInstruction: "addu", format: "move $rd, $rs" }, // addu $rd, $rs, $zero
  "li": { pseudo: true, realInstruction: ["lui", "ori"], format: "li $rt, imm" }, // For large immediates: lui+ori
  "la": { pseudo: true, format: "la $rt, label" }, // Load address, typically uses lui+ori
  "nop": { pseudo: true, realInstruction: "sll", format: "nop" }, // sll $zero, $zero, 0
  "blt": { pseudo: true, realInstruction: ["slt", "bne"], format: "blt $rs, $rt, label" }, // slt+bne
  "bgt": { pseudo: true, realInstruction: ["slt", "bne"], format: "bgt $rs, $rt, label" }, // slt+bne (swapped regs)
  "ble": { pseudo: true, realInstruction: ["slt", "beq"], format: "ble $rs, $rt, label" }, // slt+beq (swapped regs)
  "bge": { pseudo: true, realInstruction: ["slt", "beq"], format: "bge $rs, $rt, label" }, // slt+beq
  "not": { pseudo: true, realInstruction: "nor", format: "not $rd, $rs" }, // nor $rd, $rs, $zero
  "neg": { pseudo: true, realInstruction: "sub", format: "neg $rd, $rs" }, // sub $rd, $zero, $rs
  "abs": { pseudo: true, format: "abs $rd, $rs" }, // multiple instructions

  // MIPS32 Rev 2 - these are included for completeness though not in original MIPS I
  "mul": { type: "R", opcode: 0x1C, funct: 0x02 } // In MIPS32 Rev 2, this is a real instruction
}

export const directives = {
  // Data Definition Directives
  ".align": {
    description: "Aligns the next data item on a specified byte boundary (power of 2)",
    example: ".align 2  # Align to word boundary (2^2 = 4 bytes)",
    syntax: ".align n"
  },
  ".ascii": {
    description: "Stores an ASCII string (without null termination)",
    example: '.ascii "Hello World"',
    syntax: '.ascii "string"'
  },
  ".asciiz": {
    description: "Stores an ASCII string with null termination (\\0)",
    example: '.asciiz "Hello World\\n"',
    syntax: '.asciiz "string"'
  },
  ".byte": {
    description: "Allocates and initializes one or more bytes of storage",
    example: ".byte 10, 20, 30  # Three consecutive bytes",
    syntax: ".byte b1, b2, ..., bn"
  },
  ".data": {
    description: "Indicates the start of the data segment",
    example: ".data  # Begin data segment",
    syntax: ".data [address]"
  },
  ".double": {
    description: "Allocates and initializes double-precision floating point values (8 bytes)",
    example: ".double 3.14159265358979",
    syntax: ".double d1, d2, ..., dn"
  },
  ".float": {
    description: "Allocates and initializes single-precision floating point values (4 bytes)",
    example: ".float 3.14, 2.71  # Two consecutive floats",
    syntax: ".float f1, f2, ..., fn"
  },
  ".half": {
    description: "Allocates and initializes 16-bit halfwords (2 bytes)",
    example: ".half 10, 20  # Two consecutive halfwords",
    syntax: ".half h1, h2, ..., hn"
  },
  ".space": {
    description: "Allocates the specified number of blank bytes",
    example: ".space 100  # Reserve 100 bytes of space",
    syntax: ".space n"
  },
  ".word": {
    description: "Allocates and initializes one or more 32-bit words (4 bytes)",
    example: ".word 0x10010000, 0xFFFFFFFF  # Two consecutive words",
    syntax: ".word w1, w2, ..., wn"
  },

  // Text and Code Directives
  ".text": {
    description: "Indicates the start of the code segment",
    example: ".text  # Begin code segment",
    syntax: ".text [address]"
  },
  ".code": {
    description: "Synonym for .text directive",
    example: ".code  # Begin code segment",
    syntax: ".code [address]"
  },
  ".globl": {
    description: "Declares a symbol as global (accessible from other files)",
    example: ".globl main  # Export main label",
    syntax: ".globl symbol"
  },
  ".extern": {
    description: "Declares a symbol as external (defined in another file)",
    example: ".extern printf  # External function",
    syntax: ".extern symbol, size"
  },

  // Symbol and Label Directives
  ".set": {
    description: "Sets the value of a symbol",
    example: ".set noat  # Disable warnings about using $1 (assembler temporary)",
    syntax: ".set symbol, expression or .set option"
  },
  ".eqv": {
    description: "Text substitution (similar to a macro definition)",
    example: ".eqv SIZE 100  # Define SIZE as 100",
    syntax: ".eqv symbol, expression"
  },
  ".macro": {
    description: "Begins a macro definition",
    example: ".macro push($r)  # Define push macro",
    syntax: ".macro name(args)"
  },
  ".end_macro": {
    description: "Ends a macro definition",
    example: ".end_macro  # End of macro definition",
    syntax: ".end_macro"
  },

  // Segment and Section Control
  ".kdata": {
    description: "Indicates the start of the kernel data segment",
    example: ".kdata  # Begin kernel data segment",
    syntax: ".kdata [address]"
  },
  ".ktext": {
    description: "Indicates the start of the kernel code segment",
    example: ".ktext 0x80000000  # Begin kernel code segment at specified address",
    syntax: ".ktext [address]"
  },
  ".section": {
    description: "Specifies a named section for code or data",
    example: ".section .rodata  # Read-only data section",
    syntax: ".section name, flags"
  },

  // File and Line Information
  ".file": {
    description: "Specifies a filename for debugging information",
    example: '.file "main.s"',
    syntax: '.file "filename"'
  },
  ".line": {
    description: "Specifies a line number for debugging information",
    example: ".line 10",
    syntax: ".line line_number"
  },
  ".ent": {
    description: "Marks the beginning of a function for debugging",
    example: ".ent main  # Begin function main",
    syntax: ".ent function_name"
  },
  ".end": {
    description: "Marks the end of a function for debugging",
    example: ".end main  # End function main",
    syntax: ".end function_name"
  },

  // Miscellaneous
  ".org": {
    description: "Sets the location counter to an absolute expression",
    example: ".org 0x10010000  # Set current address",
    syntax: ".org address"
  },
  ".repeat": {
    description: "Repeats a block of code a specified number of times",
    example: ".repeat 5  # Repeat the following block 5 times",
    syntax: ".repeat count"
  },
  ".endr": {
    description: "Ends a repetition block",
    example: ".endr  # End of repeat block",
    syntax: ".endr"
  },
  ".include": {
    description: "Includes source from another file",
    example: '.include "macros.s"  # Include macros file',
    syntax: '.include "filename"'
  }
};

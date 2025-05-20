import { describe, it, expect } from 'vitest';
import { validate, SectionType } from '../validate';
import { lex, TokenType } from '../lex';
import { parse, NodeType } from '../parse';

// Helper function to create a simple Position object
function createPosition(line: number, column: number, offset: number) {
  return { line, column, offset };
}

describe('MIPS Validator', () => {
  describe('Section Handling', () => {
    it('should validate instructions in code section', () => {
      const source = `.text\nadd $t0, $t1, $t2`;
      const lexResult = lex(source);
      expect(lexResult.errors).toHaveLength(0);

      const parseResult = parse(source, lexResult.result!);
      expect(parseResult.errors).toHaveLength(0);

      const validateResult = validate(source, lexResult.result!, parseResult.result!);
      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect instructions outside code section', () => {
      const source = `.data\nadd $t0, $t1, $t2`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Instruction used outside of code section');
    });

    it('should detect data directives in code section', () => {
      const source = `.text\n.byte 42`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Data directive .byte used in code section');
    });

    it('should validate section transitions', () => {
      const source = `.data\n.word 42\n.text\nadd $t0, $t1, $t2\n.data\n.word 100`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });
  });

  describe('Directive Validation', () => {
    it('should validate .byte directive', () => {
      const source = `.data\n.byte 42, 255, -128`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect invalid .byte values', () => {
      const source = `.data\n.byte 256`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Invalid byte value');
    });

    it('should validate .half directive', () => {
      const source = `.data\n.half 42, 32767, -32768`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect invalid .half values', () => {
      const source = `.data\n.half 65536`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Invalid halfword value');
    });

    it('should validate .word directive', () => {
      const source = `.data\n.word 42, 2147483647, -2147483648`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect invalid .word values', () => {
      const source = `.data\n.word 4294967296`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Invalid word value');
    });

    it('should validate .align directive', () => {
      const source = `.data\n.align 4`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect invalid .align values', () => {
      const source = `.data\n.align 17`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Invalid alignment value');
    });

    it('should validate .ascii directive', () => {
      const source = `.data\n.ascii "Hello, world!"`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect non-string arguments in .ascii directive', () => {
      const source = `.data\n.ascii 123`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Expected string arguments');
    });

    it('should detect unexpected arguments in section directives', () => {
      const source = `.text 123`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Unexpected arguments in .text directive');
    });
  });

  describe('R-Type Instruction Validation', () => {
    it('should validate correct R-type instructions', () => {
      const source = `.text\nadd $t0, $t1, $t2\nsub $s0, $s1, $s2`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect wrong number of arguments for R-type instructions', () => {
      const source = `.text\nadd $t0, $t1`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Expected 3 arguments');
    });

    it('should detect non-register arguments for R-type instructions', () => {
      const source = `.text\nadd $t0, $t1, 5`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Expected register as argument');
    });
  });

  describe('Shift Instruction Validation', () => {
    it('should validate correct shift instructions', () => {
      const source = `.text\nsll $t0, $t1, 4\nsrl $s0, $s1, 2`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect invalid shift amounts', () => {
      const source = `.text\nsll $t0, $t1, 32`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Shift amount must be in range 0-31');
    });
  });

  describe('I-Type Instruction Validation', () => {
    it('should validate correct I-type instructions', () => {
      const source = `.text\naddi $t0, $t1, 100\nandi $s0, $s1, 0xFF`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect invalid immediate values for I-type instructions', () => {
      const source = `.text\naddi $t0, $t1, 32768`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Immediate value must be a 16-bit signed integer');
    });
  });

  describe('Load/Store Instruction Validation', () => {
    it('should validate correct load/store instructions', () => {
      const source = `.text\nlw $t0, 8($sp)\nsw $t1, -4($s0)`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect invalid displacement values', () => {
      const source = `.text\nlw $t0, 32768($sp)`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Displacement must be a 16-bit signed integer');
    });
  });

  describe('Branch Instruction Validation', () => {
    it('should validate correct branch instructions', () => {
      const source = `.text\nbeq $t0, $t1, label\nbne $s0, $s1, exit`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect wrong number of arguments for branch instructions', () => {
      const source = `.text\nbeq $t0, $t1`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Expected 3 arguments');
    });
  });

  describe('Branch-Z Instruction Validation', () => {
    it('should validate correct branch-Z instructions', () => {
      const source = `.text\nbgez $t0, label\nbltz $s0, exit`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect wrong number of arguments for branch-Z instructions', () => {
      const source = `.text\nbgez $t0`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Expected 2 arguments');
    });
  });

  describe('Jump Instruction Validation', () => {
    it('should validate correct jump instructions', () => {
      const source = `.text\nj main\njal function`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect wrong number of arguments for jump instructions', () => {
      const source = `.text\nj main, extra`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Expected 1 argument');
    });
  });

  describe('Jump Register Instruction Validation', () => {
    it('should validate correct jr instructions', () => {
      const source = `.text\njr $ra`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect non-register argument for jr instruction', () => {
      const source = `.text\njr label`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Expected register as argument');
    });
  });

  describe('Move Instruction Validation', () => {
    it('should validate correct move instructions', () => {
      const source = `.text\nmove $t0, $t1`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect non-register arguments for move instruction', () => {
      const source = `.text\nmove $t0, 5`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Expected register as argument');
    });
  });

  describe('Li Instruction Validation', () => {
    it('should validate correct li instructions', () => {
      const source = `.text\nli $t0, 42\nli $s0, -1`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect invalid immediate values for li instruction', () => {
      const source = `.text\nli $t0, 2147483648`; // One more than max 32-bit signed int
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Immediate value must be a 32-bit signed integer');
    });
  });

  describe('La Instruction Validation', () => {
    it('should validate correct la instructions', () => {
      const source = `.text\nla $t0, label`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });
  });

  describe('Syscall/Nop Instruction Validation', () => {
    it('should validate correct syscall/nop instructions', () => {
      const source = `.text\nsyscall\nnop`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should detect unexpected arguments for syscall instruction', () => {
      const source = `.text\nsyscall 5`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(1);
      expect(validateResult.errors[0].message).toContain('Expected no arguments');
    });
  });

  describe('Mock Test', () => {
    it('should test error reporting with mocked tokens and nodes', () => {
      // Create mock position objects
      const startPos = createPosition(1, 0, 0);
      const endPos = createPosition(1, 5, 5);

      // Create a mock token for testing
      const mockToken = {
        type: TokenType.IDENTIFIER,
        start: startPos,
        end: endPos
      };

      // Create mock nodes for testing
      const mockDirectiveNode = {
        type: NodeType.DIRECTIVE,
        start: startPos,
        end: endPos,
        op: mockToken,
        args: [{
          type: NodeType.DIRECTIVE_ARG,
          start: startPos,
          end: endPos,
          tokens: [mockToken]
        }]
      };

      // Mock source string
      const mockSource = ".text\nadd $t0, $t1, 500000"; // Invalid immediate value

      // Use real lex and parse for accurate AST
      const lexResult = lex(mockSource);
      const parseResult = parse(mockSource, lexResult.result!);
      const validateResult = validate(mockSource, lexResult.result!, parseResult.result!);

      // There should be at least one error
      expect(validateResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Tests', () => {
    it('should validate a complete program with mixed code and data sections', () => {
      const source = `
.data
message: .asciiz "Hello, World!"
number: .word 42
array: .byte 1, 2, 3, 4, 5

.text
main:
  li $v0, 4
  la $a0, message
  syscall

  lw $t0, number
  addi $t0, $t0, 10

  li $v0, 1
  move $a0, $t0
  syscall

  j exit

exit:
  li $v0, 10
  syscall
`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });

    it('should catch multiple errors in a program', () => {
      const source = `
.text
  add $t0, $t1
  li $t0, 5000000000
  lw $t0, 70000($sp)
.data
  .byte 300
  .word hello
`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      // Should have at least 4 errors:
      // 1. Wrong number of args for add
      // 2. Invalid immediate for li
      // 3. Invalid displacement for lw
      // 4. Invalid byte value
      expect(validateResult.errors.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle multiple section transitions correctly', () => {
      const source = `
.data
var1: .word 10
.text
  lw $t0, 1($t1)
.data
var2: .word 20
.text
  lw $t1, 0($t2)
  add $t2, $t0, $t1
`;
      const lexResult = lex(source);
      const parseResult = parse(source, lexResult.result!);
      const validateResult = validate(source, lexResult.result!, parseResult.result!);

      expect(validateResult.errors).toHaveLength(0);
    });
  });
});

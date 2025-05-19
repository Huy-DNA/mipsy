import { lex, TokenType } from '../lex.ts';
import { parse, NodeType } from '../parse.ts';
import { describe, it, expect } from 'vitest';

describe('Parser', () => {
  it('should parse simple instructions', () => {
    const source = 'add $t0, $t1, $t2\nmove $s0, $s1';
    const { result: tokens } = lex(source);
    const { result: nodes, errors } = parse(source, tokens);

    expect(errors.length).toBe(0);
    expect(nodes.length).toBe(2);

    // Check first instruction
    expect(nodes[0].type).toBe(NodeType.INSTRUCTION);
    const instr1 = nodes[0] as any;
    expect(source.slice(instr1.op.start.offset, instr1.op.end.offset)).toBe('add');
    expect(instr1.args.length).toBe(3);
    expect(instr1.args[0].type).toBe(NodeType.INSTRUCTION_REGISTER);
    expect(instr1.args[1].type).toBe(NodeType.INSTRUCTION_REGISTER);
    expect(instr1.args[2].type).toBe(NodeType.INSTRUCTION_REGISTER);

    // Check second instruction
    expect(nodes[1].type).toBe(NodeType.INSTRUCTION);
    const instr2 = nodes[1] as any;
    expect(source.slice(instr2.op.start.offset, instr2.op.end.offset)).toBe('move');
    expect(instr2.args.length).toBe(2);
    expect(instr2.args[0].type).toBe(NodeType.INSTRUCTION_REGISTER);
    expect(instr2.args[1].type).toBe(NodeType.INSTRUCTION_REGISTER);
  });

  it('should parse labels', () => {
    const source = 'main:\n  add $t0, $t1, $t2\nloop:\n  beq $t0, $zero, exit';
    const { result: tokens } = lex(source);
    const { result: nodes, errors } = parse(source, tokens);

    expect(errors.length).toBe(0);
    expect(nodes.length).toBe(4);

    expect(nodes[0].type).toBe(NodeType.LABEL);
    const label1 = nodes[0] as any;
    expect(source.slice(label1.tokens[0].start.offset, label1.tokens[0].end.offset)).toBe('main:');

    expect(nodes[1].type).toBe(NodeType.INSTRUCTION);

    expect(nodes[2].type).toBe(NodeType.LABEL);
    const label2 = nodes[2] as any;
    expect(source.slice(label2.tokens[0].start.offset, label2.tokens[0].end.offset)).toBe('loop:');

    expect(nodes[3].type).toBe(NodeType.INSTRUCTION);
  });

  it('should parse directives', () => {
    const source = '.text\n.data\n.word 1, 2, 3\n.asciiz "Hello, World!"';
    const { result: tokens } = lex(source);
    const { result: nodes, errors } = parse(source, tokens);

    expect(errors.length).toBe(0);
    expect(nodes.length).toBe(4);

    expect(nodes[0].type).toBe(NodeType.DIRECTIVE);
    const dir1 = nodes[0] as any;
    expect(source.slice(dir1.op.start.offset, dir1.op.end.offset)).toBe('.text');
    expect(dir1.args.length).toBe(0);

    expect(nodes[1].type).toBe(NodeType.DIRECTIVE);
    const dir2 = nodes[1] as any;
    expect(source.slice(dir2.op.start.offset, dir2.op.end.offset)).toBe('.data');
    expect(dir2.args.length).toBe(0);

    expect(nodes[2].type).toBe(NodeType.DIRECTIVE);
    const dir3 = nodes[2] as any;
    expect(source.slice(dir3.op.start.offset, dir3.op.end.offset)).toBe('.word');
    expect(dir3.args.length).toBe(3);

    expect(nodes[3].type).toBe(NodeType.DIRECTIVE);
    const dir4 = nodes[3] as any;
    expect(source.slice(dir4.op.start.offset, dir4.op.end.offset)).toBe('.asciiz');
    expect(dir4.args.length).toBe(1);
  });

  it('should handle different argument types', () => {
    const source = 'li $t0, 42\nlw $t1, 8($sp)\nj loop';
    const { result: tokens } = lex(source);
    const { result: nodes, errors } = parse(source, tokens);

    expect(errors.length).toBe(0);
    expect(nodes.length).toBe(3);

    // Check immediate value instruction
    expect(nodes[0].type).toBe(NodeType.INSTRUCTION);
    const instr1 = nodes[0] as any;
    expect(source.slice(instr1.op.start.offset, instr1.op.end.offset)).toBe('li');
    expect(instr1.args.length).toBe(2);
    expect(instr1.args[0].type).toBe(NodeType.INSTRUCTION_REGISTER);
    expect(instr1.args[1].type).toBe(NodeType.INSTRUCTION_IMMEDIATE);

    // Check displacement addressing mode
    expect(nodes[1].type).toBe(NodeType.INSTRUCTION);
    const instr2 = nodes[1] as any;
    expect(source.slice(instr2.op.start.offset, instr2.op.end.offset)).toBe('lw');
    expect(instr2.args.length).toBe(2);
    expect(instr2.args[0].type).toBe(NodeType.INSTRUCTION_REGISTER);
    expect(instr2.args[1].type).toBe(NodeType.INSTRUCTION_DISPLACEMENT);

    // Check label reference
    expect(nodes[2].type).toBe(NodeType.INSTRUCTION);
    const instr3 = nodes[2] as any;
    expect(source.slice(instr3.op.start.offset, instr3.op.end.offset)).toBe('j');
    expect(instr3.args.length).toBe(1);
    expect(instr3.args[0].type).toBe(NodeType.INSTRUCTION_IMMEDIATE);
  });

  it('should handle whitespace and comments', () => {
    const source = '  add $t0, $t1, $t2  # Add registers\n\n  # Comment line\n  sub $t3, $t4, $t5';
    const { result: tokens } = lex(source);
    const { result: nodes, errors } = parse(source, tokens);

    expect(errors.length).toBe(0);
    expect(nodes.length).toBe(2);

    expect(nodes[0].type).toBe(NodeType.INSTRUCTION);
    expect(nodes[1].type).toBe(NodeType.INSTRUCTION);
  });

  it('should report errors for invalid syntax', () => {
    const source = 'add $t0\nmove $t1, \nsub $t2, $t3, ,\nlabel\n.directive 1, , 3';
    const { result: tokens } = lex(source);
    const { result: nodes, errors } = parse(source, tokens);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should handle complex program with mixed elements', () => {
    const source = `
.data
message: .asciiz "Hello, World!"
numbers: .word 1, 2, 3, 4, 5

.text
main:
    li $t0, 0          # Initialize counter
    la $a0, message    # Load address of message
    li $v0, 4          # System call for print string
    syscall

loop:
    beq $t0, 5, exit   # Exit if counter reaches 5
    lw $a0, numbers($t0)  # Load number
    li $v0, 1          # System call for print integer
    syscall
    addi $t0, $t0, 1   # Increment counter
    j loop             # Jump back to loop

exit:
    li $v0, 10         # System call for exit
    syscall
`;
    const { result: tokens } = lex(source);
    const { result: nodes, errors } = parse(source, tokens);

    expect(errors.length).toBe(0);

    // Count the types of nodes we should have
    const directives = nodes.filter(n => n.type === NodeType.DIRECTIVE).length;
    const instructions = nodes.filter(n => n.type === NodeType.INSTRUCTION).length;
    const labels = nodes.filter(n => n.type === NodeType.LABEL).length;

    expect(directives).toBe(4); // .data, .asciiz, .word, .text
    expect(labels).toBe(5);     // message:, numbers:, main:, loop:, exit:
    expect(instructions).toBe(12); // All the assembly instructions
  });
});

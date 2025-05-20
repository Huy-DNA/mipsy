import { describe, it, expect } from 'vitest';
import { lex, TokenType } from '../lex';

describe('MIPS Lexer', () => {
  describe('Basic Tokens', () => {
    it('should tokenize empty input', () => {
      const result = lex('');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(1);
    });

    it('should tokenize whitespace', () => {
      const result = lex('  \t');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(4);
      expect(result.result[0].type).toBe(TokenType.SPACE);
      expect(result.result[1].type).toBe(TokenType.SPACE);
    });

    it('should tokenize newlines', () => {
      const result = lex('\n\r\n');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(3);
      expect(result.result[0].type).toBe(TokenType.NEWLINE);
      expect(result.result[1].type).toBe(TokenType.NEWLINE);
    });
  });

  describe('Registers', () => {
    it('should tokenize valid numeric registers', () => {
      const result = lex('$0 $1 $31');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(6); // 3 registers + 2 spaces + 1 EOF
      expect(result.result[0].type).toBe(TokenType.REGISTER);
      expect(result.result[2].type).toBe(TokenType.REGISTER);
      expect(result.result[4].type).toBe(TokenType.REGISTER);
    });

    it('should tokenize valid named registers', () => {
      const result = lex('$t0 $a1 $ra');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(6); // 3 registers + 2 spaces + 1 EOF
      expect(result.result[0].type).toBe(TokenType.REGISTER);
      expect(result.result[2].type).toBe(TokenType.REGISTER);
      expect(result.result[4].type).toBe(TokenType.REGISTER);
    });

    it('should handle invalid registers', () => {
      const result = lex('$x0 $invalid');
      expect(result.errors).toHaveLength(2);
      expect(result.result).toHaveLength(4); // 2 invalid registers + 1 space + 1 EOF
      expect(result.result[0].type).toBe(TokenType.INVALID);
      expect(result.result[2].type).toBe(TokenType.INVALID);
      expect(result.errors[0].message).toContain('Invalid register');
      expect(result.errors[1].message).toContain('Invalid register');
    });
  });

  describe('Numbers', () => {
    it('should tokenize integer numbers', () => {
      const result = lex('123 456 -123 - + 123');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(8); // 4 numbers + 3 space + 1 EOF
      expect(result.result[0].type).toBe(TokenType.NUMBER);
      expect(result.result[2].type).toBe(TokenType.NUMBER);
      expect(result.result[4].type).toBe(TokenType.NUMBER);
      expect(result.result[6].type).toBe(TokenType.NUMBER);
    });
  });

  describe('Identifiers and Labels', () => {
    it('should tokenize identifiers', () => {
      const result = lex('add sub move');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(6); // 3 identifiers + 2 spaces + 1 EOF
      expect(result.result[0].type).toBe(TokenType.IDENTIFIER);
      expect(result.result[2].type).toBe(TokenType.IDENTIFIER);
      expect(result.result[4].type).toBe(TokenType.IDENTIFIER);
    });

    it('should tokenize labels', () => {
      const result = lex('main: loop: exit:');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(6); // 3 labels + 2 spaces + 1 EOF
      expect(result.result[0].type).toBe(TokenType.LABEL);
      expect(result.result[2].type).toBe(TokenType.LABEL);
      expect(result.result[4].type).toBe(TokenType.LABEL);
    });

    it('should tokenize identifiers with underscores and numbers', () => {
      const result = lex('_var1 test_123');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(4); // 2 identifiers + 1 space + 1 EOF
      expect(result.result[0].type).toBe(TokenType.IDENTIFIER);
      expect(result.result[2].type).toBe(TokenType.IDENTIFIER);
    });
  });

  describe('Directives', () => {
    it('should tokenize directives', () => {
      const result = lex('.data .text .word');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(6); // 3 directives + 2 spaces + 1 EOF
      expect(result.result[0].type).toBe(TokenType.DIRECTIVE);
      expect(result.result[2].type).toBe(TokenType.DIRECTIVE);
      expect(result.result[4].type).toBe(TokenType.DIRECTIVE);
    });
  });

  describe('Strings', () => {
    it('should tokenize double quote strings', () => {
      const result = lex('"hello world"');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(2);
      expect(result.result[0].type).toBe(TokenType.STRING);
    });

    it('should tokenize single quote strings', () => {
      const result = lex("'hello world'");
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(2);
      expect(result.result[0].type).toBe(TokenType.STRING);
    });

    it('should handle unclosed strings', () => {
      const result = lex('"unclosed string');
      expect(result.errors).toHaveLength(1);
      expect(result.result).toHaveLength(2);
      expect(result.result[0].type).toBe(TokenType.INVALID);
      expect(result.errors[0].message).toContain('Unclosed string');
    });
  });

  describe('Comments', () => {
    it('should tokenize comments', () => {
      const result = lex('# This is a comment\n');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(3); // 1 comment + 1 newline + 1 EOF
      expect(result.result[0].type).toBe(TokenType.COMMENT);
    });

    it('should tokenize comments after code', () => {
      const result = lex('add $t0, $t1, $t2 # Add registers\n');
      expect(result.errors).toHaveLength(0);
      expect(result.result.find(token => token.type === TokenType.COMMENT)).toBeTruthy();
    });
  });

  describe('Punctuation', () => {
    it('should tokenize commas', () => {
      const result = lex(',,,');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(4);
      expect(result.result[0].type).toBe(TokenType.COMMA);
      expect(result.result[1].type).toBe(TokenType.COMMA);
      expect(result.result[2].type).toBe(TokenType.COMMA);
    });

    it('should tokenize parentheses', () => {
      const result = lex('()()');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(5);
      expect(result.result[0].type).toBe(TokenType.LEFT_PAREN);
      expect(result.result[1].type).toBe(TokenType.RIGHT_PAREN);
      expect(result.result[2].type).toBe(TokenType.LEFT_PAREN);
      expect(result.result[3].type).toBe(TokenType.RIGHT_PAREN);
    });
  });

  describe('Position Tracking', () => {
    it('should track positions correctly for single-line input', () => {
      const result = lex('add $t0, $t1');
      expect(result.errors).toHaveLength(0);

      // 'add' identifier
      expect(result.result[0].start).toEqual({ line: 0, offset: 0 });
      expect(result.result[0].end).toEqual({ line: 0, offset: 3 });

      // Space after 'add'
      expect(result.result[1].start).toEqual({ line: 0, offset: 3 });
      expect(result.result[1].end).toEqual({ line: 0, offset: 4 });

      // '$t0' register
      expect(result.result[2].start).toEqual({ line: 0, offset: 4 });
      expect(result.result[2].end).toEqual({ line: 0, offset: 7 });
    });

    it('should track positions correctly for multi-line input', () => {
      const result = lex('add $t0\nmove $t1');
      expect(result.errors).toHaveLength(0);

      // Find newline token
      const newlineIndex = result.result.findIndex(token => token.type === TokenType.NEWLINE);
      expect(newlineIndex).toBeGreaterThan(-1);

      // Check line number increases after newline
      const tokenAfterNewline = result.result[newlineIndex + 1];
      expect(tokenAfterNewline.start.line).toBe(1);
    });
  });

  describe('Complex Examples', () => {
    it('should tokenize a simple MIPS instruction', () => {
      const result = lex('add $t0, $t1, $t2');
      expect(result.errors).toHaveLength(0);
      expect(result.result).toHaveLength(10); // 1 identifier + 3 registers + 2 commas + 3 spaces + 1 EOF

      expect(result.result[0].type).toBe(TokenType.IDENTIFIER); // add
      expect(result.result[2].type).toBe(TokenType.REGISTER);   // $t0
      expect(result.result[3].type).toBe(TokenType.COMMA);      // ,
    });

    it('should tokenize memory operations', () => {
      const result = lex('lw $t0, 4($sp)');
      expect(result.errors).toHaveLength(0);

      // Check specific tokens
      expect(result.result.some(token => token.type === TokenType.IDENTIFIER)).toBeTruthy(); // lw
      expect(result.result.some(token => token.type === TokenType.REGISTER &&
        token.start.offset === 3)).toBeTruthy(); // $t0
      expect(result.result.some(token => token.type === TokenType.NUMBER)).toBeTruthy();   // 4
      expect(result.result.some(token => token.type === TokenType.LEFT_PAREN)).toBeTruthy();  // (
      expect(result.result.some(token => token.type === TokenType.REGISTER &&
        token.start.offset > 7)).toBeTruthy(); // $sp
      expect(result.result.some(token => token.type === TokenType.RIGHT_PAREN)).toBeTruthy(); // )
    });

    it('should tokenize a full MIPS program segment', () => {
      const code = `
.data
message: .asciiz "\\"Hello, World!\\""

.text
main:
    li $v0, 4         # syscall code for print_string
    la $a0, message   # load address of message
    syscall           # print the message

    li $v0, 10        # syscall code for exit
    syscall           # exit program
`;

      const result = lex(code);
      expect(result.errors).toHaveLength(0);

      // Check for the presence of all token types
      const tokenTypes = result.result.map(token => token.type);
      expect(tokenTypes).toContain(TokenType.DIRECTIVE);    // .data, .text, .asciiz
      expect(tokenTypes).toContain(TokenType.LABEL);        // message:, main:
      expect(tokenTypes).toContain(TokenType.STRING);       // "Hello, World!"
      expect(tokenTypes).toContain(TokenType.IDENTIFIER);   // li, la, syscall
      expect(tokenTypes).toContain(TokenType.REGISTER);     // $v0, $a0
      expect(tokenTypes).toContain(TokenType.NUMBER);       // 4, 10
      expect(tokenTypes).toContain(TokenType.COMMA);        // ,
      expect(tokenTypes).toContain(TokenType.COMMENT);      // # syscall code...
      expect(tokenTypes).toContain(TokenType.NEWLINE);      // \n
    });
  });
});

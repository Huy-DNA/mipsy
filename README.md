# mipsy

## Improvements
- Currently signed numbers are lexed as tokens, this means complex expressions cannot be supported. For the time being, there's no need to support expressions so this is acceptable.

## Knowledge refreshment
- How to deal with whitespace properly?
  - Store them as leading and trailing trivias (still the most flexible option).
  - Keep them as is in the outputed tokens (have to manually skip them in parser and language services such as formatter must work at the token level - more suitable for simple languages).
  - Keep them as is but don't pass them to the parser (language services such as formatter must work at the token level, which is hard - more suitable for simple languages).
  - Ignore them (won't able to implement the services).
- Drawbacks of lexing signed number directly: Won't be able to parse expressions.
- Where to check for keywords?
  - Lexer
  - Parser
  - Validator: Should probably be here.
  Currently, I implement it in a mixed fashion, spanning from the lexer to the parser :(

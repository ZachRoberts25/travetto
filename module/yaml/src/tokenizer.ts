import { Node, TextNode, JSONNode, NumberNode, BooleanNode, NullNode } from './type/node';
import { TextBlock } from './type/block';

const OPEN_SQ_BRACE = 0x5b;
const CLOSE_SQ_BRACE = 0x5d;
const OPEN_BRACE = 0x7b;
const CLOSE_BRACE = 0x7d;
const HASH = 0x23;
const DASH = 0x2d;
const SPC = 0x20;
const TAB = 0x09;
const NEWLINE = 0x0a;
const CR = 0x0d;
const BACKSLASH = 0x5c;
const QUOTE = 0x22;
const SINGLE_QUOTE = 0x27;
const COLON = 0x3a;
const PIPE = 0x7c;
const GREATER = 0x3e;
const ZERO = 0x30;
const NINE = 0x39;

export class Tokenizer {

  static isComment = (ch: string, pos: number) => {
    const c = ch.charCodeAt(pos);
    return c === HASH || (c === DASH && ch.charCodeAt(pos + 1) === c && ch.charCodeAt(pos + 2) === c);
  }
  static isWhitespace = (c: number) => c === SPC || c === TAB || c === NEWLINE || c === CR;
  static isWhitespaceStr = (c: string) => Tokenizer.isWhitespace(c.charCodeAt(0));

  static readQuote(text: string, pos: number, end: number) {
    const start = pos;
    const ch = text.charCodeAt(pos++);
    while (text.charCodeAt(pos) !== ch && pos < end) {
      pos += (text.charCodeAt(pos) === BACKSLASH ? 2 : 1);
    }
    if (pos === end) {
      throw new Error('Unterminated string literal');
    }
    return [pos, text.substring(start, pos + 1)] as [number, string];
  }

  static readJSON(text: string, pos: number = 0, end: number = text.length) {
    const start = pos;
    const stack: number[] = [];

    while (start === pos || (stack.length && pos < end)) {
      const c = text.charCodeAt(pos);

      if (c === stack[stack.length - 1]) {
        stack.pop();
      } else if (c === OPEN_SQ_BRACE || c === OPEN_BRACE) { // Nest Inward
        stack.push(c === OPEN_SQ_BRACE ? CLOSE_SQ_BRACE : CLOSE_BRACE); // Pop outward
      } else if (c === QUOTE || c === SINGLE_QUOTE) { // Start quote
        [pos] = this.readQuote(text, pos, end);
      }
      pos += 1;
    }

    if (stack.length) {
      throw new Error('Invalid JSON');
    }

    return [pos, text.substring(start, pos)] as [number, string];
  }

  static getIndent(tokens: string[]) {
    return this.isWhitespaceStr(tokens[0]) ? tokens[0].length : 0;
  }

  static cleanTokens(tokens: string[]) {
    let start = 0;
    let end = tokens.length;
    if (this.isWhitespaceStr(tokens[0])) {
      start += 1;
    }

    // Remove trailing baggage
    let lst = tokens[end - 1] || '';
    if (lst && this.isComment(lst, 0)) {
      end -= 1;
    }
    lst = tokens[end - 1];
    if (lst && this.isWhitespaceStr(lst)) {
      end -= 1;
    }

    return tokens.slice(start, end);
  }

  static tokenize(text: string, pos: number = 0, end: number = text.length) {
    const tokens: string[] = [];
    let token = '';

    let start = pos;

    end = Math.max(0, Math.min(end, text.length));

    while (pos < end) {
      const c = text.charCodeAt(pos);
      if (c === QUOTE || c === SINGLE_QUOTE) { // Quoted string
        if (start !== pos) {
          tokens.push(text.substring(start, pos));
        }
        [pos, token] = this.readQuote(text, pos, end);
        tokens.push(token);
        start = pos + 1;
      } else if (c === OPEN_BRACE || c === OPEN_SQ_BRACE) { // Braces, aka JSON
        if (start !== pos) {
          tokens.push(text.substring(start, pos));
        }
        [pos, token] = this.readJSON(text, pos, end);
        tokens.push(token);
        start = pos + 1;
      } else if (this.isComment(text, pos)) { // Comment
        break;
      } else if (c === COLON || c === DASH) { // Control tokens
        if (start !== pos) {
          tokens.push(text.substring(start, pos));
        }
        tokens.push(String.fromCharCode(c));
        start = pos + 1;
      } else if (this.isWhitespace(c)) { // Whitespace
        if (start !== pos) {
          tokens.push(text.substring(start, pos));
          start = pos;
        }
        const len = tokens.length - 1;

        if (len >= 0 && this.isWhitespaceStr(tokens[len])) {
          tokens[len] += String.fromCharCode(c);
        } else {
          tokens.push(String.fromCharCode(c));
        }
        start = pos + 1;
      }
      pos += 1;
    }

    pos = end;
    if (start !== pos) {
      tokens.push(text.substring(start, pos));
    }
    return tokens;
  }

  static readValue(token: string): Node | undefined {
    switch (token.charCodeAt(0)) {
      case OPEN_BRACE: case OPEN_SQ_BRACE: return new JSONNode(token);
      case GREATER: case PIPE: return new TextBlock(token.charCodeAt(0) === GREATER ? 'inline' : 'full');
    }
    switch (token.toLowerCase()) {
      case '': return;
      case 'yes': case 'no':
      case 'on': case 'off':
      case 'true': case 'false':
        return new BooleanNode(token);
      case 'null': return new NullNode();
    }

    const lastChar = token.charCodeAt(token.length - 1); // Optimize for simple checks
    if (lastChar >= ZERO && lastChar <= NINE && /^[-]?(\d*[.])?\d+$/.test(token)) {
      return new NumberNode(token);
    }

    return new TextNode(token.trim());
  }
}
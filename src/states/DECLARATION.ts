import { CODE, Parser, StateDefinition, Range, ErrorCode } from "../internal";

// We enter STATE.DECLARATION after we encounter a "<?"
// while in the STATE.HTML_CONTENT.
// We leave STATE.DECLARATION if we see a "?>" or ">".

export const DECLARATION: StateDefinition = {
  name: "DECLARATION",

  enter(parent, start) {
    this.endText();
    return {
      state: DECLARATION,
      parent,
      start,
      end: start,
    };
  },

  exit() {},

  char(code, declaration) {
    if (code === CODE.QUESTION) {
      if (this.lookAtCharCodeAhead(1) === CODE.CLOSE_ANGLE_BRACKET) {
        exitDeclaration(this, declaration, 2); // will skip ?>
      }
    } else if (code === CODE.CLOSE_ANGLE_BRACKET) {
      exitDeclaration(this, declaration, 1); // will skip >
    }
  },

  eol() {},

  eof(declaration) {
    this.emitError(
      declaration,
      ErrorCode.MALFORMED_DECLARATION,
      "EOF reached while parsing declaration"
    );
  },

  return() {},
};

function exitDeclaration(
  parser: Parser,
  declaration: Range,
  closeOffset: number
) {
  parser.pos += closeOffset;
  parser.exitState();
  parser.options.onDeclaration?.({
    start: declaration.start,
    end: declaration.end,
    value: {
      start: declaration.start + 2, // strip <?
      end: declaration.end - closeOffset, // > or ?>
    },
  });
}

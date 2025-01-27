import { CODE, ErrorCode, Parser, StateDefinition } from "../internal";

// We enter STATE.CDATA after we see "<![CDATA["
export const CDATA: StateDefinition = {
  name: "CDATA",

  enter(parent, start) {
    return {
      state: CDATA,
      parent,
      start,
      end: start,
    };
  },

  exit(cdata) {
    this.options.onCDATA?.({
      start: cdata.start,
      end: cdata.end,
      value: {
        start: cdata.start + 9, // strip <![CDATA[
        end: cdata.end - 3, // strip ]]>
      },
    });
  },

  char(code) {
    if (code === CODE.CLOSE_SQUARE_BRACKET && this.lookAheadFor("]>")) {
      this.pos += 3; // skip ]]>
      this.exitState();
      return;
    }
  },

  eol() {},

  eof(cdata) {
    this.emitError(
      cdata,
      ErrorCode.MALFORMED_CDATA,
      "EOF reached while parsing CDATA"
    );
  },

  return() {},
};

export function checkForCDATA(parser: Parser) {
  if (parser.lookAheadFor("![CDATA[")) {
    parser.endText();
    parser.enterState(CDATA);
    parser.pos += 8; // skip ![CDATA[
    return true;
  }

  return false;
}

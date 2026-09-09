import { describe, expect, it } from "vitest";
import { createTapCastSession, lockActiveLine, mothersFromTapCast, tapActiveLine } from "../src/core";

describe("manual human tap casting", () => {
  it("does not reveal parity until a line is locked", () => {
    let session = createTapCastSession(true);
    session = tapActiveLine(session);
    session = tapActiveLine(session);
    session = tapActiveLine(session);
    expect(session.lines[0].parity).toBe(null);
    session = lockActiveLine(session);
    expect(session.lines[0].parity).toBe(1);
  });

  it("converts sixteen completed line counts into four Mothers", () => {
    let session = createTapCastSession();
    for (let line = 0; line < 16; line++) {
      const taps = line % 2 === 0 ? 3 : 4;
      for (let count = 0; count < taps; count++) session = tapActiveLine(session);
      session = lockActiveLine(session);
    }
    const mothers = mothersFromTapCast(session);
    expect(mothers).toHaveLength(4);
    expect(mothers.every((figure) => figure.pattern.join("") === "1212")).toBe(true);
  });
});

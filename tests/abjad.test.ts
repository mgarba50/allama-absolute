import { describe, expect, it } from "vitest";
import { calculateAbjad, moduloAnalysis, normalizeArabic } from "../src/core";

describe("Abjad engine", () => {
  it("normalizes common Alif and Ya variants visibly", () => {
    expect(normalizeArabic("إِبْرَاهِيم")).toBe("ابراهيم");
  });

  it("calculates Musa in standard Kabir values", () => {
    const result = calculateAbjad("موسى");
    expect(result.normalized).toBe("موسي");
    expect(result.total).toBe(116);
  });

  it("returns configured modulus remainders", () => {
    expect(moduloAnalysis(116,[4,7,16])).toEqual({4:0,7:4,16:4});
  });
});

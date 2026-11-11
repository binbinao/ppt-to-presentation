import { describe, test, expect } from "bun:test";
import { checkAlignment } from "../src/draft/align";
import type { Outline, Script } from "../src/schema";

const outline: Outline = {
  deck: { title: "D", slideCount: 3 },
  slides: [1, 2, 3].map((n) => ({ slide: n, title: `T${n}`, body: [], notes: "", image: `slide-${n}.png` })),
};

const script = (slides: number[]): Script => ({
  deck: outline.deck,
  segments: slides.map((n) => ({ slide: n, narration: `narration ${n}` })),
});

describe("checkAlignment", () => {
  test("passes for complete contiguous coverage", () => {
    expect(checkAlignment(outline, script([1, 2, 3]))).toEqual([]);
  });

  test("flags missing slide", () => {
    const problems = checkAlignment(outline, script([1, 2]));
    expect(problems.some((p) => /slide 3/.test(p))).toBe(true);
  });

  test("flags duplicate slide", () => {
    const problems = checkAlignment(outline, script([1, 2, 3, 3]));
    expect(problems.some((p) => /duplicate/i.test(p))).toBe(true);
  });

  test("flags slide number beyond deck", () => {
    const problems = checkAlignment(outline, script([1, 2, 4]));
    expect(problems.some((p) => /slide 4/.test(p))).toBe(true);
  });
});

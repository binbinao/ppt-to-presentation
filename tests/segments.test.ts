import { describe, test, expect } from "bun:test";
import { sortSegmentsBySlide, buildAudioLookup, SEGMENT_FILE } from "../src/render/segments";
import type { Script } from "../src/schema";

describe("sortSegmentsBySlide", () => {
  test("sorts segments by slide field ascending", () => {
    const script: Script = {
      deck: { title: "D", slideCount: 3 },
      segments: [
        { slide: 3, narration: "c" },
        { slide: 1, narration: "a" },
        { slide: 2, narration: "b" },
      ],
    };
    const sorted = sortSegmentsBySlide(script);
    expect(sorted.segments.map((s) => s.slide)).toEqual([1, 2, 3]);
    expect(sorted.segments[0]?.narration).toBe("a");
  });

  test("does not mutate the input script", () => {
    const script: Script = {
      deck: { title: "D", slideCount: 2 },
      segments: [{ slide: 2, narration: "b" }, { slide: 1, narration: "a" }],
    };
    sortSegmentsBySlide(script);
    expect(script.segments[0]?.slide).toBe(2);
  });
});

describe("buildAudioLookup", () => {
  test("maps slide number to audio path via segments order", () => {
    const script: Script = {
      deck: { title: "D", slideCount: 3 },
      segments: [
        { slide: 3, narration: "c" },
        { slide: 1, narration: "a" },
        { slide: 2, narration: "b" },
      ],
    };
    const audio = ["segment-3.mp3", "segment-1.mp3", "segment-2.mp3"];
    const lookup = buildAudioLookup(script, audio);
    expect(lookup.get(1)).toBe("segment-1.mp3");
    expect(lookup.get(2)).toBe("segment-2.mp3");
    expect(lookup.get(3)).toBe("segment-3.mp3");
  });

  test("throws when audio array length mismatches segments", () => {
    const script: Script = {
      deck: { title: "D", slideCount: 1 },
      segments: [{ slide: 1, narration: "a" }],
    };
    expect(() => buildAudioLookup(script, [])).toThrow(/count/);
  });

  test("exposes per-slide audio file naming convention", () => {
    expect(SEGMENT_FILE(7)).toBe("segment-7.mp3");
  });
});

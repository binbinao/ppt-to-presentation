import { describe, test, expect } from "bun:test";
import { computeSegmentPlan } from "../src/render/tts";
import type { Script } from "../src/schema";

describe("computeSegmentPlan", () => {
  test("backfills durations in segment order", () => {
    const script: Script = {
      deck: { title: "D", slideCount: 2 },
      segments: [
        { slide: 1, narration: "a" },
        { slide: 2, narration: "b" },
      ],
    };
    const plan = computeSegmentPlan(script, [3.5, 2.0]);
    expect(plan.segments[0]?.durationSec).toBeCloseTo(3.5);
    expect(plan.segments[1]?.durationSec).toBeCloseTo(2.0);
  });

  test("rejects duration count mismatch", () => {
    const script: Script = {
      deck: { title: "D", slideCount: 1 },
      segments: [{ slide: 1, narration: "a" }],
    };
    expect(() => computeSegmentPlan(script, [])).toThrow(/count/);
  });

  test("rejects zero-duration probe result", () => {
    const script: Script = {
      deck: { title: "D", slideCount: 1 },
      segments: [{ slide: 1, narration: "a" }],
    };
    expect(() => computeSegmentPlan(script, [0])).toThrow(/duration/);
  });
});

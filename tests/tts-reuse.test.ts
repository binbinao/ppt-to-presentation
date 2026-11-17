import { describe, test, expect } from "bun:test";
import { isReusableAudio, sanityCheckDuration } from "../src/render/tts";

describe("isReusableAudio", () => {
  test("accepts a plausible existing audio file", () => {
    expect(isReusableAudio({ exists: true, sizeBytes: 137088, durationSec: 13.5 })).toBe(true);
  });

  test("rejects missing file", () => {
    expect(isReusableAudio({ exists: false, sizeBytes: 0, durationSec: 0 })).toBe(false);
  });

  test("rejects 0-byte残留 (edge-tts WSS 断连产物)", () => {
    expect(isReusableAudio({ exists: true, sizeBytes: 0, durationSec: 0 })).toBe(false);
  });

  test("rejects unplayable file (ffprobe fails)", () => {
    expect(isReusableAudio({ exists: true, sizeBytes: 5000, durationSec: 0 })).toBe(false);
  });
});

describe("sanityCheckDuration", () => {
  test("passes for normal speech density (≈4.5 chars/sec measured)", () => {
    // 62 chars -> ~13.8s expected; actual 13.5s = 98%
    expect(sanityCheckDuration({ narrationChars: 62, durationSec: 13.5 })).toBeNull();
  });

  test("flags suspiciously short audio (<60% of expected)", () => {
    // 100 chars -> ~22.2s expected; 5s = 23% -> truncated
    const warning = sanityCheckDuration({ narrationChars: 100, durationSec: 5 });
    expect(warning).toMatch(/truncated|short/i);
  });

  test("flags suspiciously long audio (>200% of expected)", () => {
    const warning = sanityCheckDuration({ narrationChars: 10, durationSec: 30 });
    expect(warning).toMatch(/long/i);
  });

  test("tolerates short narrations below the minimum sample window", () => {
    // Very short text: estimation error dominates, don't warn.
    expect(sanityCheckDuration({ narrationChars: 8, durationSec: 3.5 })).toBeNull();
  });
});

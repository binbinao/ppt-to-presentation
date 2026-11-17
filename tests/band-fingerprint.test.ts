import { describe, test, expect } from "bun:test";
import { durationBand } from "../src/review/band";
import { checkDeckFingerprint } from "../src/parse/fingerprint";

describe("durationBand", () => {
  test("warns when a segment is under 5 seconds", () => {
    expect(durationBand(3)).toMatch(/under 5s/i);
  });

  test("warns when a segment exceeds 90 seconds", () => {
    expect(durationBand(95)).toMatch(/over 90s/i);
  });

  test("accepts the healthy band", () => {
    expect(durationBand(30)).toBeNull();
    expect(durationBand(5)).toBeNull();
    expect(durationBand(90)).toBeNull();
  });
});

describe("checkDeckFingerprint", () => {
  const hash = "a1b2c3d4";

  test("passes when fingerprints match", () => {
    expect(checkDeckFingerprint(hash, hash)).toEqual([]);
  });

  test("passes when outline has no fingerprint yet (pre-upgrade decks)", () => {
    expect(checkDeckFingerprint(undefined, hash)).toEqual([]);
  });

  test("fails on mismatched fingerprint (deck changed, script stale)", () => {
    const problems = checkDeckFingerprint(hash, "deadbeef");
    expect(problems.length).toBe(1);
    expect(problems[0]).toMatch(/fingerprint|re-run parse/i);
  });
});

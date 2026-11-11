import { describe, test, expect } from "bun:test";
import { validateOutline, validateScript } from "../src/schema";

const validOutline = {
  deck: { title: "Demo Deck", slideCount: 2 },
  slides: [
    { slide: 1, title: "Intro", body: ["point a"], notes: "hello", image: "build/slides/slide-1.png" },
    { slide: 2, title: "End", body: [], notes: "", image: "build/slides/slide-2.png" },
  ],
};

const validScript = {
  deck: { title: "Demo Deck", slideCount: 2 },
  segments: [
    { slide: 1, narration: "Welcome to the demo." },
    { slide: 2, narration: "Thanks for watching.", durationSec: 4.2 },
  ],
};

describe("schema", () => {
  test("accepts a valid outline", () => {
    expect(validateOutline(validOutline)).toEqual(validOutline);
  });

  test("rejects outline with 0-based slide numbers", () => {
    const bad = { ...validOutline, slides: [{ ...validOutline.slides[0], slide: 0 }] };
    expect(() => validateOutline(bad)).toThrow(/slide/);
  });

  test("accepts a valid script with durationSec", () => {
    expect(validateScript(validScript)).toEqual(validScript);
  });

  test("rejects script with negative durationSec", () => {
    const bad = { ...validScript, segments: [{ ...validScript.segments[0], durationSec: -1 }] };
    expect(() => validateScript(bad)).toThrow(/durationSec/);
  });
});

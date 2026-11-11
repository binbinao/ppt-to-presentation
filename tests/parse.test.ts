import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { extractSlides } from "../src/parse/pptx";

const bytes = readFileSync(new URL("../fixtures/sample.pptx", import.meta.url));

describe("extractSlides", () => {
  test("extracts 2 slides with 1-based numbering", async () => {
    const slides = await extractSlides(new Uint8Array(bytes));
    expect(slides.length).toBe(2);
    expect(slides[0]?.slide).toBe(1);
    expect(slides[1]?.slide).toBe(2);
  });

  test("extracts title and body text", async () => {
    const slides = await extractSlides(new Uint8Array(bytes));
    expect(slides[0]?.title).toBe("Project Overview");
    expect(slides[0]?.body).toContain("Convert PPT to video");
  });

  test("extracts speaker notes linked via rels", async () => {
    const slides = await extractSlides(new Uint8Array(bytes));
    expect(slides[0]?.notes).toBe("Greet the audience.");
  });

  test("throws with part context when presentation.xml is missing", async () => {
    const zip = new JSZip();
    const emptyBytes = await zip.generateAsync({ type: "uint8array" });
    await expect(extractSlides(new Uint8Array(emptyBytes))).rejects.toThrow(/presentation\.xml/);
  });
});

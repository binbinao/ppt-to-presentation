import { mkdir, writeFile } from "node:fs/promises";
import { extractSlides } from "./pptx";
import { renderSlideImages } from "./slides";
import { validateOutline } from "../schema";
import { deckFingerprint } from "./fingerprint";

async function main() {
  const deckPath = process.argv[2];
  if (!deckPath) throw new Error("usage: bun run parse <deck.pptx>");

  const pptxBytes = new Uint8Array(await Bun.file(deckPath).arrayBuffer());
  const rawSlides = await extractSlides(pptxBytes);
  const imagePaths = await renderSlideImages(deckPath, "build/slides");

  // LibreOffice may skip hidden slides; a mismatch means page images are
  // misaligned with text — fail here rather than drifting into render.
  if (imagePaths.length !== rawSlides.length) {
    throw new Error(`parse: slide count mismatch — ${rawSlides.length} slides extracted but ${imagePaths.length} images rendered (hidden slides or render failure)`);
  }

  const outline = validateOutline({
    deck: {
      title: deckPath.replace(/.*\//, "").replace(/\.pptx$/, ""),
      slideCount: rawSlides.length,
      fingerprint: deckFingerprint(pptxBytes),
    },
    slides: rawSlides.map((s, i) => ({ ...s, image: imagePaths[i]! })),
  });

  await mkdir("build", { recursive: true });
  await writeFile("build/outline.json", JSON.stringify(outline, null, 2));
  await writeFile("build/deck-fingerprint.txt", outline.deck.fingerprint!);
  console.log(`build/outline.json: ${rawSlides.length} slides, ${imagePaths.length} images`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

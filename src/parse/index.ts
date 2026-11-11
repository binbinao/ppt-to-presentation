import { mkdir, writeFile } from "node:fs/promises";
import { extractSlides } from "./pptx";
import { renderSlideImages } from "./slides";
import { OutlineSchema } from "../schema";

async function main() {
  const deckPath = process.argv[2];
  if (!deckPath) throw new Error("usage: bun run parse <deck.pptx>");

  const pptxBytes = new Uint8Array(await Bun.file(deckPath).arrayBuffer());
  const rawSlides = await extractSlides(pptxBytes);
  const imagePaths = await renderSlideImages(deckPath, "build/slides");

  const outline = OutlineSchema.parse({
    deck: { title: deckPath.replace(/.*\//, "").replace(/\.pptx$/, ""), slideCount: rawSlides.length },
    slides: rawSlides.map((s, i) => ({ ...s, image: imagePaths[i] ?? "" })),
  });

  await mkdir("build", { recursive: true });
  await writeFile("build/outline.json", JSON.stringify(outline, null, 2));
  console.log(`build/outline.json: ${rawSlides.length} slides, ${imagePaths.length} images`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

import { mkdir } from "node:fs/promises";
import { $ } from "bun";

// Render each slide to PNG via LibreOffice → PDF → pdftoppm.
// Returns PNG paths in slide order, normalized to slide-N.png (1-based).
export async function renderSlideImages(deckPath: string, outDir: string): Promise<string[]> {
  await mkdir(outDir, { recursive: true });
  const deckName = deckPath.replace(/.*\//, "").replace(/\.pptx$/, "");

  await $`soffice --headless --convert-to pdf --outdir ${outDir} ${deckPath}`.quiet();
  await $`mv ${outDir}/${deckName}.pdf ${outDir}/deck.pdf`.quiet();
  await $`pdftoppm -png -r 150 ${outDir}/deck.pdf ${outDir}/slide`.quiet();

  // pdftoppm pads page numbers (slide-01.png); normalize to slide-N.png.
  const glob = new Bun.Glob("slide-*.png");
  const padded = [...(await glob.scan({ cwd: outDir }))]
    .sort()
    .map((p) => `${outDir}/${p}`)
    .filter((p) => /^slide-\d+\.png$/.test(p));
  if (padded.length === 0) throw new Error(`slide image rendering produced no output in ${outDir}`);

  const normalized: string[] = [];
  for (let i = 0; i < padded.length; i++) {
    const target = `${outDir}/slide-${i + 1}.png`;
    await $`mv ${padded[i]} ${target}`.quiet();
    normalized.push(target);
  }
  return normalized;
}

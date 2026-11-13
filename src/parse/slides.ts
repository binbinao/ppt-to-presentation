import { mkdir, rename, rm } from "node:fs/promises";
import { $ } from "bun";

// Render each slide to PNG via LibreOffice → PDF → pdftoppm.
// Returns PNG paths in slide order, normalized to slide-N.png (1-based).
export async function renderSlideImages(deckPath: string, outDir: string): Promise<string[]> {
  await mkdir(outDir, { recursive: true });
  const deckName = deckPath.replace(/.*\//, "").replace(/\.pptx$/, "");

  await $`soffice --headless --convert-to pdf --outdir ${outDir} ${deckPath}`.quiet();
  await $`mv ${outDir}/${deckName}.pdf ${outDir}/deck.pdf`.quiet();
  await $`pdftoppm -png -r 150 ${outDir}/deck.pdf ${outDir}/slide`.quiet();

  // pdftoppm may pad page numbers (slide-01.png) or not (slide-1.png).
  // Collect raw outputs, then move them into a temp dir FIRST so that renaming
  // slide-*.png -> slide-N.png cannot overwrite sources still waiting in the
  // same directory (a >9-page deck would otherwise clobber slide-2..slide-9).
  const glob = new Bun.Glob("slide-*.png");
  const raw: string[] = [];
  for await (const p of glob.scan({ cwd: outDir })) {
    if (/^slide-\d+\.png$/.test(p)) raw.push(p);
  }
  if (raw.length === 0) throw new Error(`slide image rendering produced no output in ${outDir}`);
  // Natural numeric sort by the page number embedded in the filename.
  raw.sort((a, b) => {
    const na = Number(a.match(/slide-(\d+)\.png/)![1]);
    const nb = Number(b.match(/slide-(\d+)\.png/)![1]);
    return na - nb;
  });

  const tmpDir = `${outDir}/.raw`;
  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });
  for (const p of raw) await rename(`${outDir}/${p}`, `${tmpDir}/${p}`);

  const normalized: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const target = `${outDir}/slide-${i + 1}.png`;
    await rename(`${tmpDir}/${raw[i]}`, target);
    normalized.push(target);
  }
  await rm(tmpDir, { recursive: true, force: true });
  return normalized;
}

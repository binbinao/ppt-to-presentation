import { $ } from "bun";
import { classifyPalette, type DeckPalette } from "./voice";

// Sample the deck's dominant color from slide images (ffmpeg 1x1 average RGB).
// Prefers the cover + section pages (1, 3, 9, 12 in this deck) — content pages
// are mostly white and would dilute the corporate blue. Falls back gracefully.
export async function sampleDeckPalette(imagePaths: string[]): Promise<DeckPalette | undefined> {
  const picks = imagePaths.filter((_, i) => [0, 2, 8, 11].includes(i)).slice(0, 4);
  const samples: Array<[number, number, number]> = [];
  for (const p of picks.length ? picks : imagePaths.slice(0, 1)) {
    try {
      const res = await $`ffmpeg -v error -i ${p} -vf scale=1:1 -f rawvideo -pix_fmt rgb24 -`.quiet().nothrow();
      const buf = typeof res.stdout === "string" ? Buffer.from(res.stdout, "binary") : Buffer.from(res.stdout);
      if (buf.length >= 3) samples.push([buf[0]!, buf[1]!, buf[2]!]);
    } catch { /* skip unreadable page */ }
  }
  if (!samples.length) return undefined;
  const avg = [0, 1, 2].map((c) => Math.round(samples.reduce((n, s) => n + s[c]!, 0) / samples.length));
  const avgHex = avg.map((v) => v.toString(16).padStart(2, "0")).join("");
  return { avgHex, ...classifyPalette(avgHex) };
}

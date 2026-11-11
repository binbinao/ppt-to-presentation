import type { Outline, Script } from "../schema";

// Alignment invariant (spec): segments align to slides by the `slide` field,
// never array order. Returns problem list; empty = aligned.
export function checkAlignment(outline: Outline, script: Script): string[] {
  const problems: string[] = [];
  const slideNums = new Set(outline.slides.map((s) => s.slide));
  const seen = new Set<number>();

  for (const seg of script.segments) {
    if (seen.has(seg.slide)) problems.push(`duplicate segment for slide ${seg.slide}`);
    seen.add(seg.slide);
    if (!slideNums.has(seg.slide)) problems.push(`segment references slide ${seg.slide} which does not exist in outline`);
  }

  for (let n = 1; n <= outline.deck.slideCount; n++) {
    if (!seen.has(n)) problems.push(`slide ${n} has no segment (missing narration)`);
  }

  return problems;
}

import type { Script } from "../schema";

// Alignment invariant (spec): segments align to slides by the `slide` field,
// never array order. Render sorts by slide so output order is deterministic
// regardless of how the agent wrote script.json (SKILL.md documents this
// normalization). Pure function — returns a new script.
export function sortSegmentsBySlide(script: Script): Script {
  const segments = [...script.segments].sort((a, b) => a.slide - b.slide);
  return { ...script, segments };
}

// Standard per-slide audio file name produced by tts.ts.
export function SEGMENT_FILE(slide: number): string {
  return `segment-${slide}.mp3`;
}

// Build slide -> audio path lookup by slide FIELD (never index position).
// audioPaths[i] must correspond to script.segments[i] — the order tts.ts
// synthesized them in — but the returned map keys by slide so downstream
// consumers (Remotion compositions) can never drift with array order.
export function buildAudioLookup(script: Script, audioPaths: string[]): Map<number, string> {
  if (audioPaths.length !== script.segments.length) {
    throw new Error(`audio count ${audioPaths.length} != segment count ${script.segments.length}`);
  }
  const lookup = new Map<number, string>();
  script.segments.forEach((seg, i) => {
    const path = audioPaths[i];
    if (!path) throw new Error(`slide ${seg.slide}: missing audio path at index ${i}`);
    if (!path.endsWith(SEGMENT_FILE(seg.slide))) {
      throw new Error(`slide ${seg.slide}: audio path ${path} does not match expected ${SEGMENT_FILE(seg.slide)}`);
    }
    lookup.set(seg.slide, path);
  });
  return lookup;
}

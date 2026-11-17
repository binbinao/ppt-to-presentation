// Duration band check: turns SKILL.md's "20–60s" guidance into a machine
// checkable warning. Warning-level, not a hard gate — an information-dense
// slide may legitimately need longer, and the orchestrating agent judges.

export function durationBand(durationSec: number): string | null {
  if (durationSec < 5) return `under 5s — narration is likely too thin for the slide`;
  if (durationSec > 90) return `over 90s — narration is likely too long; consider trimming`;
  return null;
}

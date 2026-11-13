// Pure subtitle helper shared by Remotion render and post-render QA.
// Kept in a .ts file (no JSX) so the QA CLI can import it without pulling in React.
export function subtitleFromNarration(narration: string, maxLen = 26): string {
  const first = narration.split(/[。！？!?\n]/)[0]?.trim() ?? "";
  const clause = first.split(/[，,；;]/)[0]?.trim() ?? first;
  const chars = Array.from(clause);
  return chars.length <= maxLen ? clause : chars.slice(0, maxLen).join("") + "…";
}

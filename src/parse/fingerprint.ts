import { createHash } from "node:crypto";

// Short sha256 fingerprint of the source deck. Written into outline.deck by
// parse; review/render verify it so a re-generated deck cannot silently pair
// with narration written for the old content (page count unchanged trap).
export function deckFingerprint(pptxBytes: Uint8Array): string {
  return createHash("sha256").update(pptxBytes).digest("hex").slice(0, 8);
}

export function checkDeckFingerprint(outlineFp: string | undefined, currentFp: string): string[] {
  if (!outlineFp) return []; // pre-fingerprint outline — grandfathered
  if (outlineFp !== currentFp) {
    return [`deck fingerprint mismatch (outline: ${outlineFp}, current: ${currentFp}) — the deck changed since draft; re-run parse + draft`];
  }
  return [];
}

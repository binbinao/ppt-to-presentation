// Cross-segment transition check (weak heuristic).
// Why this exists: the per-segment checks in narration.ts judge each page in
// isolation. A deck can score perfectly there and still read like a list —
// every page restarting from zero, no 起承转合 between pages. A real viewer
// hears that as abrupt, mechanical page changes even when each page is fine.
//
// This is deliberately a WEAK check: it only asserts that each segment (except
// the first) opens with an explicit connective, i.e. the writer had to reach
// back to the previous page on purpose. It cannot judge whether the logic
// actually carries over — that stays an LLM job. It is enforced as a blocking
// review gate so "no transition at all" can never pass review silently.

export type TransitionRow = {
  slide: number;
  opening: string; // first N chars of the segment
  connector: string | null; // matched connective, null = none
};

// Connectives that imply "I am picking up something from before".
// Ordered longest-first so the reported match is the most specific one.
const CONNECTIVES = [
  "第一条", "同一", "同一个", "这笔账", "这个数", "这三个", "这六个", "这就是", "这就",
  "说到这个", "回到", "接下来", "再看", "先说", "既然", "于是", "所以", "但是", "但",
  "还有", "更麻烦", "更", "而", "因为", "如果", "然后把", "把四", "把十",
  "四个能", "四个必", "第一顺位", "第二顺位", "第三顺位", "第四顺位",
  "算一遍", "算一笔", "风险有", "最硬的是", "最致命的", "有一种", "有能做", "有活的",
  "关掉",
];

const OPENING_CHARS = 24;

// List-style openers the writing rules explicitly forbid. A segment that
// starts with one of these is a hard start EVEN IF a connective appears later
// in the opening window (e.g. "另外还有…" contains 还有 but is still a list).
const BANNED_STARTS = [
  "另外", "此外", "再者", "下一", "下一个", "下一项", "secondly",
];
// "第 N 个方向/点/方面/项/部分" — numbered-list openers.
const BANNED_NUMBERED = /^第[一二三四五六七八九十百零〇\d]+(个(方向|点|方面|项|部分|条|步|类)?|，)/;

function isBannedStart(opening: string): boolean {
  if (BANNED_NUMBERED.test(opening)) return true;
  return BANNED_STARTS.some((b) => opening.startsWith(b.trim()));
}

export function checkTransitions(segments: Array<{ slide: number; narration: string }>): TransitionRow[] {
  return segments.map((seg, i) => {
    const opening = Array.from(seg.narration.trim()).slice(0, OPENING_CHARS).join("");
    if (i === 0) return { slide: seg.slide, opening, connector: "(开篇)" };
    const connector = isBannedStart(opening)
      ? null
      : CONNECTIVES.find((c) => opening.startsWith(c) || opening.includes(c)) ?? null;
    return { slide: seg.slide, opening, connector };
  });
}

export function transitionProblems(rows: TransitionRow[]): string[] {
  return rows
    .filter((r) => r.slide !== rows[0]?.slide && r.connector === null)
    .map((r) => `slide ${r.slide}: 段首没有承接词，疑似硬起 —— 「${r.opening}…」`);
}

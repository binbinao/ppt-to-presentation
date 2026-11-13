// Static narration QA — pure functions, no runtime deps, unit-testable.
// edge-tts CLI XML-escapes text into <speak>, so SSML/phoneme tags are spoken
// literally: phoneme-level polyphone control is NOT possible through this TTS.
// What we CAN do: (1) flag polyphone / Latin / bare-number / awkward-punctuation
// risks so the writer rewrites them at source, (2) enforce sentence rhythm,
// (3) surface numbers for content-fidelity review. Semantic "通顺/悦听/符合"
// judgement stays an LLM job in the orchestration layer; this provides signals.

export type IssueKind =
  | "polyphone" // 多音字风险词
  | "latin" // 英文/字母串，读音不确定
  | "bare-number" // 裸阿拉伯数字，朗读读法不稳
  | "long-sentence" // 无标点长句，朗读易断气
  | "no-final-punct" // 段落缺句末标点
  | "awkward-punct"; // 连续/异常标点

export type NarrationIssue = { kind: IssueKind; detail: string };

export type NarrationReport = {
  slide: number;
  charCount: number;
  sentenceCount: number;
  longestClauseLen: number;
  latinTokens: string[];
  numbers: string[];
  issues: NarrationIssue[];
  polyphones: string[];
};

// 高频多音字：神经 TTS 多能按上下文读对，但下列组合在"技术稿 + 数字/专名"
// 上下文里偶发误读，列出供听觉复核；写稿时优先改写规避（见 SKILL 写稿规范）。
const POLYPHONE_RISKS: Array<{ re: RegExp; hint: string }> = [
  { re: /行业|银行|行长|行列/g, hint: "行 (háng/xíng)" },
  { re: /重复|重来|重叠|重新/g, hint: "重 (chóng/zhòng)" },
  { re: /长大|长程|长文|长短|增长/g, hint: "长 (cháng/zhǎng)" },
  { re: /幻觉率|效率|概率|命中率|比率/g, hint: "率 (lǜ/shuài)" },
  { re: /差距|差不多|偏差|误差/g, hint: "差 (chā/chà/cī)" },
  { re: /降至|降低|下降|投降/g, hint: "降 (jiàng/xiáng)" },
  { re: /只学|只有|只是/g, hint: "只 (zhī/zhǐ)" },
  { re: /都在|都是|全都/g, hint: "都 (dōu/dū)" },
  { re: /干活|干部|干净/g, hint: "干 (gàn/gān)" },
  { re: /模型|模式|模拟|模样/g, hint: "模 (mó/mú)" },
  { re: /调度|调整|调研|空调/g, hint: "调 (diào/tiáo)" },
  { re: /还有|还原|归还/g, hint: "还 (hái/huán)" },
  { re: /为了|认为|作为|为难/g, hint: "为 (wèi/wéi)" },
];

// 任何标点都视为可停顿点；连续无标点片段过长 = 朗读断气风险。
const CLAUSE_SPLIT = /[，。！？；：、,.!?;:\n]/;
const SENTENCE_END = /[。！？!?]$/;
const LATIN_RE = /[A-Za-z][A-Za-z0-9.\-]*/g;
const NUMBER_RE = /\d[\d.,]*%?/g;

export const LONG_CLAUSE_THRESHOLD = 34;

export function analyzeNarration(slide: number, text: string): NarrationReport {
  const issues: NarrationIssue[] = [];
  const charCount = Array.from(text).length;

  // 断句 / 节奏
  const clauses = text.split(CLAUSE_SPLIT).map((c) => Array.from(c.trim()).length);
  const longestClauseLen = clauses.reduce((m, n) => Math.max(m, n), 0);
  const sentenceCount = (text.match(/[。！？!?]/g) ?? []).length;
  if (longestClauseLen > LONG_CLAUSE_THRESHOLD) {
    issues.push({ kind: "long-sentence", detail: `最长无标点片段 ${longestClauseLen} 字 > ${LONG_CLAUSE_THRESHOLD}，建议断句` });
  }
  if (!SENTENCE_END.test(text.trim())) {
    issues.push({ kind: "no-final-punct", detail: "段落缺句末标点，朗读收尾会悬空" });
  }
  if (/[，,]{2,}|[。！？!?]{2,}/.test(text)) {
    issues.push({ kind: "awkward-punct", detail: "存在连续标点，朗读会异常停顿" });
  }

  // 多音字风险词
  const polyphones: string[] = [];
  for (const { re, hint } of POLYPHONE_RISKS) {
    const m = text.match(re);
    if (m) {
      polyphones.push(...m.map((w) => `${w}[${hint}]`));
    }
  }
  if (polyphones.length) {
    issues.push({ kind: "polyphone", detail: `${polyphones.length} 处多音字/异读词，需听觉复核或改写规避` });
  }

  // 英文/字母串（读音不确定，优先中文化）
  const latinTokens = Array.from(new Set(text.match(LATIN_RE) ?? []));
  if (latinTokens.length) {
    issues.push({ kind: "latin", detail: `${latinTokens.length} 个英文/字母串：${latinTokens.slice(0, 12).join(" / ")}${latinTokens.length > 12 ? " …" : ""}` });
  }

  // 裸数字（内容符合性信号 + 朗读读法）
  const numbers = Array.from(new Set(text.match(NUMBER_RE) ?? []));

  return { slide, charCount, sentenceCount, longestClauseLen, latinTokens, numbers, issues, polyphones };
}

export function analyzeScript(segments: Array<{ slide: number; narration: string }>): NarrationReport[] {
  return segments.map((s) => analyzeNarration(s.slide, s.narration));
}

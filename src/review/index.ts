import { validateScript, validateOutline } from "../schema";
import { checkAlignment } from "../draft/align";
import { analyzeScript, type NarrationReport, LONG_CLAUSE_THRESHOLD } from "./narration";
import { durationBand } from "./band";
import { checkDeckFingerprint } from "../parse/fingerprint";
import { resolveVoice } from "../render/tts";
import { checkTransitions, transitionProblems, type TransitionRow } from "./transitions";
import { mkdir } from "node:fs/promises";

// Script review (spec step 3):
//   HARD GATE  — schema + alignment + empty narration. Blocking (exit 1).
//   QA REPORT  — 通顺性 / 文字悦听 / 内容符合性 signals, plus an explicit LLM
//                self-review checklist the orchestrating agent must answer.
// Static analysis can flag rhythm/polyphone/Latin/number risks but semantic
// judgement ("is it fluent, pleasant to hear, faithful to the slide") is an
// LLM job; we emit the checklist + evidence so it can't be skipped silently.
export type ScriptQaReport = {
  deckTitle: string;
  slideCount: number;
  voice: { id: string; reason: string; palette?: { avgHex: string; cool: boolean; dark: boolean } };
  totals: {
    segments: number;
    chars: number;
    sentences: number;
    polyphones: number;
    latinTokens: number;
    numbers: number;
    longClauses: number;
  };
  perSlide: NarrationReport[];
  transitions: TransitionRow[];
  transitionGaps: number;
  llmChecklist: string[];
};

export async function buildScriptQaReport(
  script: ReturnType<typeof validateScript>,
  outline: ReturnType<typeof validateOutline>,
): Promise<ScriptQaReport> {
  const reports = analyzeScript(script.segments);
  const transitions = checkTransitions(script.segments);
  const transitionGaps = transitionProblems(transitions).length;
  const voice = await resolveVoice(script.deck.title, script.segments[0]?.narration ?? "");
  return {
    deckTitle: script.deck.title,
    slideCount: script.deck.slideCount,
    voice: { id: voice.voice, reason: voice.reason, palette: voice.palette },
    totals: {
      segments: script.segments.length,
      chars: reports.reduce((n, r) => n + r.charCount, 0),
      sentences: reports.reduce((n, r) => n + r.sentenceCount, 0),
      polyphones: reports.reduce((n, r) => n + r.polyphones.length, 0),
      latinTokens: reports.reduce((n, r) => n + r.latinTokens.length, 0),
      numbers: reports.reduce((n, r) => n + r.numbers.length, 0),
      longClauses: reports.reduce((n, r) => n + (r.longestClauseLen > LONG_CLAUSE_THRESHOLD ? 1 : 0), 0),
    },
    perSlide: reports,
    transitions,
    transitionGaps,
    llmChecklist: [
      "通顺性：逐段默读，无病句、无成分残缺、无中英夹杂卡壳",
      "文字悦听：数字/单位/缩写已口语化转写，无不读出声的符号，长句已断句",
      "多音字：报告列出的异读词已按上下文确认读法，或改写规避",
      "内容符合性：每段陈述都能在对应页 outline（title/body/notes）找到依据，无编造数值",
      "段间衔接：每段开头承接上一页的结论或数字，结尾给下一页留钩子（问句或「但…」）；章节切换处写一句过渡；禁止「第 N 个方向」「另外」「下一项」式硬起（脚本弱校验见下节，逻辑是否接上须逐段通读）",
      "音色匹配：voice 选择符合 deck 底色/题材，必要时用 PPT2VID_VOICE 覆盖",
    ],
  };
}

export function renderQaMarkdown(r: ScriptQaReport): string {
  const L: string[] = [];
  L.push(`# 文字稿 Review 报告 — ${r.deckTitle}`);
  L.push("");
  L.push(`- 页数/段数：${r.slideCount} / ${r.totals.segments}`);
  L.push(`- 音色：**${r.voice.id}** — ${r.voice.reason}`);
  if (r.voice.palette) L.push(`- deck 主色采样：#${r.voice.palette.avgHex}（${r.voice.palette.cool ? "冷色" : "暖色"} / ${r.voice.palette.dark ? "深调" : "浅调"}）→ 选音色的客观依据`);
  L.push(`- 全稿：${r.totals.chars} 字，${r.totals.sentences} 句`);
  L.push(`- 风险信号：多音字/异读词 ${r.totals.polyphones} 处、英文串 ${r.totals.latinTokens} 个、数字 ${r.totals.numbers} 个、超长无标点句 ${r.totals.longClauses} 段`);
  L.push("");
  L.push("## 逐页信号");
  L.push("");
  L.push("| 页 | 字数 | 句数 | 最长无标点 | 主要信号 |");
  L.push("|---:|---:|---:|---:|---|");
  for (const p of r.perSlide) {
    const sig = p.issues.length ? p.issues.map((i) => i.detail).join("；") : "—";
    L.push(`| ${p.slide} | ${p.charCount} | ${p.sentenceCount} | ${p.longestClauseLen} | ${sig.replace(/\|/g, "\\|")} |`);
  }
  L.push("");
  L.push("## 多音字/异读词清单（须听觉复核或改写规避）");
  L.push("");
  const allPoly = r.perSlide.flatMap((p) => p.polyphones.map((w) => `p${p.slide} ${w}`));
  L.push(allPoly.length ? allPoly.map((x) => `- ${x}`).join("\n") : "- 无");
  L.push("");
  L.push("## 段间衔接检查（弱校验：只看段首有没有承接词）");
  L.push("");
  L.push(`- 无承接词的段：**${r.transitionGaps} / ${Math.max(r.transitions.length - 1, 1)}** ${r.transitionGaps === 0 ? "✅" : "⚠️ 疑似逐页硬起、读起来像清单，review 会拦截"}`);
  L.push("");
  L.push("| 页 | 段首 24 字 | 承接词 |");
  L.push("|---:|---|---|");
  for (const t of r.transitions) {
    L.push(`| ${t.slide} | ${t.opening.replace(/\|/g, "\\|")} | ${t.connector ?? "**无**"} |`);
  }
  L.push("");
  L.push("> 注意：这只是代词/连词的机械检查。有承接词不等于逻辑真的接上了，");
  L.push("> 段与段的论证关系仍须 agent 逐段通读确认（起—承—转—合，且每页结尾要为下一页留钩子）。");
  L.push("");
  L.push("## LLM 自审清单（agent 必须逐项确认后才可进入 render）");
  L.push("");
  r.llmChecklist.forEach((c, i) => L.push(`${i + 1}. ${c}`));
  L.push("");
  L.push("> 说明：edge-tts CLI 会把文本 XML-escape 进 `<speak>`，SSML/`<phoneme>` 会被字面朗读，");
  L.push("> 因此无法做音素级多音字控制；工程手段是「风险词检测 → 改写规避 → 神经语音上下文判断」。");
  return L.join("\n") + "\n";
}

async function main() {
  const scriptPath = process.argv[2] ?? "build/script.json";
  const script = validateScript(await Bun.file(scriptPath).json());
  const outline = validateOutline(await Bun.file("build/outline.json").json());

  // HARD GATE — blocking
  const problems: string[] = [];
  problems.push(...checkAlignment(outline, script));
  for (const seg of script.segments) {
    if (seg.narration.trim().length === 0) problems.push(`slide ${seg.slide}: narration is empty`);
  }
  // Transition hard gate — every non-opening segment must reach back to the
  // previous page with an explicit connective; hard-starts block review.
  problems.push(...transitionProblems(checkTransitions(script.segments)));
  // Deck fingerprint: the source pptx must not have changed since parse/draft.
  const fingerprintFile = Bun.file("build/deck-fingerprint.txt");
  if (await fingerprintFile.exists()) {
    problems.push(...checkDeckFingerprint(outline.deck.fingerprint, (await fingerprintFile.text()).trim()));
  }
  if (problems.length > 0) {
    console.error(`REVIEW FAILED — ${problems.length} problem(s):`);
    problems.forEach((p, i) => console.error(`${i + 1}. ${p}`));
    process.exit(1);
  }

  // Duration band — advisory warnings (information-dense slides may exceed).
  for (const seg of script.segments) {
    if (seg.durationSec !== undefined) {
      const band = durationBand(seg.durationSec);
      if (band) console.warn(`[band] slide ${seg.slide}: durationSec ${seg.durationSec.toFixed(1)}s — ${band}`);
    }
  }

  // QA REPORT — advisory, always written so the agent can act on it
  const report = await buildScriptQaReport(script, outline);
  await mkdir("build", { recursive: true });
  await Bun.write("build/script-qa.md", renderQaMarkdown(report));
  console.log(`REVIEW PASSED — ${script.segments.length} segments ready for render`);
  console.log(`[qa] 文字稿报告 → build/script-qa.md`);
  console.log(`[qa] 音色 ${report.voice.id} | 多音字/异读词 ${report.totals.polyphones} 处 | 超长句 ${report.totals.longClauses} 段 | 英文串 ${report.totals.latinTokens} 个 | 段间无承接 ${report.transitionGaps} 处`);
  console.log("[qa] agent 须按 build/script-qa.md 的「LLM 自审清单」逐项确认（通顺性/悦听/内容符合性）后再 render");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

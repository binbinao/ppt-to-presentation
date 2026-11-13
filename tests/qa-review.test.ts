import { describe, expect, test } from "bun:test";
import { analyzeNarration, LONG_CLAUSE_THRESHOLD } from "../src/review/narration";
import { classifyPalette, moodFromPalette, selectVoice, inferDeckMood } from "../src/render/voice";
import { subtitleFromNarration } from "../src/render/subtitle";

describe("analyzeNarration — 断句/多音字/悦听信号", () => {
  test("正常短句：无长句/无句末缺失问题", () => {
    const r = analyzeNarration(1, "大家好，欢迎观看本次介绍。这一版主打生产力。谢谢。");
    expect(r.longestClauseLen <= LONG_CLAUSE_THRESHOLD).toBe(true);
    expect(r.issues.some((i) => i.kind === "long-sentence")).toBe(false);
    expect(r.issues.some((i) => i.kind === "no-final-punct")).toBe(false);
  });

  test("超长无标点片段被标记", () => {
    const long = "这是一段没有任何标点用来测试朗读断气风险的连续文字".repeat(3);
    const r = analyzeNarration(2, long + "。");
    expect(r.issues.some((i) => i.kind === "long-sentence")).toBe(true);
  });

  test("缺句末标点被标记", () => {
    const r = analyzeNarration(3, "这句话没有结尾标点");
    expect(r.issues.some((i) => i.kind === "no-final-punct")).toBe(true);
  });

  test("多音字风险词被检出", () => {
    const r = analyzeNarration(4, "银行行业的幻觉率下降，重复训练长程任务。");
    expect(r.polyphones.length).toBeGreaterThan(0);
    expect(r.issues.some((i) => i.kind === "polyphone")).toBe(true);
  });

  test("英文串去重收集", () => {
    const r = analyzeNarration(5, "使用 Agent 和 Agent 以及 MoE 架构。");
    expect(r.latinTokens).toContain("Agent");
    expect(r.latinTokens).toContain("MoE");
    expect(r.latinTokens.filter((x) => x === "Agent").length).toBe(1);
  });
});

describe("voice — 按 deck 底色选音色", () => {
  test("深蓝冷色分类正确", () => {
    const p = classifyPalette("155fd4");
    expect(p.cool).toBe(true);
    expect(p.dark).toBe(true);
  });
  test("暖色/浅色不判技术类", () => {
    expect(moodFromPalette(classifyPalette("f0e0d0"))).toBeUndefined();
  });
  test("深蓝 palette 优先判定沉稳男声", () => {
    const v = selectVoice({ deckTitle: "随便什么标题", palette: { avgHex: "155fd4", ...classifyPalette("155fd4") } });
    expect(v.voice).toBe("zh-CN-YunyangNeural");
    expect(v.reason).toContain("155fd4");
    expect(v.reason).toContain("沉稳专业男声");
  });
  test("环境变量覆盖优先", () => {
    const v = selectVoice({ deckTitle: "技术发布", envVoice: "zh-CN-XiaoxiaoNeural", palette: { avgHex: "155fd4", ...classifyPalette("155fd4") } });
    expect(v.voice).toBe("zh-CN-XiaoxiaoNeural");
  });
  test("标题关键词也能判技术类", () => {
    expect(inferDeckMood("混元大模型技术发布基准评测报告")).toBe("technical");
  });
});

describe("subtitleFromNarration — 字幕取自旁白首句且不溢出", () => {
  test("取首个分句", () => {
    expect(subtitleFromNarration("大家好，欢迎观看本次介绍这一版主打生产力。后面还有内容。")).toBe("大家好");
  });
  test("超长截断到 maxLen 并加省略号", () => {
    const s = subtitleFromNarration("这是一段很长很长很长很长很长很长很长很长很长很长的开场白没有标点", 10);
    expect(Array.from(s).length).toBeLessThanOrEqual(11);
    expect(s.endsWith("…")).toBe(true);
  });
  test("不同页旁白产生不同字幕", () => {
    const a = subtitleFromNarration("能力跃升带来全面提升。后续说明。");
    const b = subtitleFromNarration("安全审计只学防守。后续说明。");
    expect(a).not.toBe(b);
  });
});

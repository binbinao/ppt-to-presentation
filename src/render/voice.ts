// Voice selection — pure, testable.
// edge-tts zh-CN voices (verified via `edge-tts --list-voices` on 7.3.1):
//   zh-CN-XiaoxiaoNeural  Female  News, Novel       Warm
//   zh-CN-XiaoyiNeural    Female  Cartoon, Novel    Lively
//   zh-CN-YunjianNeural   Male    Sports, Novel     Passion
//   zh-CN-YunxiNeural     Male    Novel             Lively, Sunshine
//   zh-CN-YunxiaNeural    Male    Cartoon, Novel    Cute
//   zh-CN-YunyangNeural   Male    News              Professional, Reliable
//   zh-CN-liaoning-XiaobeiNeural / shaanxi-XiaoniNeural  Female dialect
//
// Rule: technical / research / blue-corporate decks -> calm professional male
// (Yunyang) by default; lively/marketing decks may use warm female (Xiaoxiao).
// Env PPT2VID_VOICE always wins so a human can override without editing code.

export type DeckMood = "technical" | "general" | "lively";

// Dominant color sampled from the deck's cover/section slides (ffmpeg 1x1
// average). Cool deep-blue corporate palettes signal a technical/research
// deck -> calm professional male voice. This is the "看底色选音色" rule: the
// color is objective evidence, not a guess from the title.
export type DeckPalette = { avgHex: string; cool: boolean; dark: boolean };

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function classifyPalette(avgHex: string): { cool: boolean; dark: boolean } {
  const [r, g, b] = hexToRgb(avgHex);
  const cool = b > r + 20 && b >= g; // blue-dominant
  const dark = (r + g + b) / 3 < 150; // deep tone
  return { cool, dark };
}

// A deep-blue / cool deck is treated as technical regardless of title wording.
export function moodFromPalette(p: { cool: boolean; dark: boolean }): DeckMood | undefined {
  return p.cool && p.dark ? "technical" : undefined;
}

export const VOICE_CATALOG = {
  "zh-CN-YunyangNeural": { gender: "male", tone: "professional, reliable, calm", mood: "technical" },
  "zh-CN-YunjianNeural": { gender: "male", tone: "passionate, sports commentary", mood: "lively" },
  "zh-CN-YunxiNeural": { gender: "male", tone: "lively, sunshine", mood: "lively" },
  "zh-CN-XiaoxiaoNeural": { gender: "female", tone: "warm, news", mood: "general" },
  "zh-CN-XiaoyiNeural": { gender: "female", tone: "lively, cartoon", mood: "lively" },
} as const;

export type VoiceId = keyof typeof VOICE_CATALOG;

export const DEFAULT_VOICE: VoiceId = "zh-CN-YunyangNeural";

const TECHNICAL_HINTS = [
  "技术", "发布", "基准", "模型", "架构", "参数", "评测", "调研", "报告", "方案",
  "研发", "工程", "算法", "部署", "安全", "审计", "生产力", "产品", "平台", "数据",
];

export function inferDeckMood(title: string, sampleText = ""): DeckMood {
  const hay = `${title} ${sampleText}`;
  const techHits = TECHNICAL_HINTS.reduce((n, k) => n + (hay.includes(k) ? 1 : 0), 0);
  if (techHits >= 2) return "technical";
  if (/营销|活动|趣味|卡通|故事|轻松|漫画|儿童/.test(hay)) return "lively";
  return "general";
}

// Returns { voice, reason } so review reports can explain the choice.
export function selectVoice(opts: {
  deckTitle: string;
  sampleText?: string;
  envVoice?: string;
  moodOverride?: DeckMood;
  palette?: { avgHex: string; cool: boolean; dark: boolean };
}): { voice: VoiceId; mood: DeckMood; reason: string; palette?: DeckPalette } {
  if (opts.envVoice && opts.envVoice in VOICE_CATALOG) {
    return { voice: opts.envVoice as VoiceId, mood: "general", reason: `环境变量 PPT2VID_VOICE 显式指定 ${opts.envVoice}` };
  }
  const palette = opts.palette as DeckPalette | undefined;
  const paletteMood = palette ? moodFromPalette(palette) : undefined;
  const mood = opts.moodOverride ?? paletteMood ?? inferDeckMood(opts.deckTitle, opts.sampleText);
  const basis = paletteMood
    ? `deck 主色采样 #${palette!.avgHex}（冷色深蓝${palette!.dark ? "·深调" : ""}）→ 判定技术/研报类`
    : `标题与正文关键词判定为 ${mood} 类`;
  if (mood === "technical") {
    return { voice: "zh-CN-YunyangNeural", mood, palette, reason: `${basis} → 沉稳专业男声 zh-CN-YunyangNeural (News / Professional·Reliable)` };
  }
  if (mood === "lively") {
    return { voice: "zh-CN-YunxiNeural", mood, palette, reason: `${basis} → 明快男声 zh-CN-YunxiNeural` };
  }
  return { voice: "zh-CN-XiaoxiaoNeural", mood, palette, reason: `${basis} → 温和女声 zh-CN-XiaoxiaoNeural` };
}

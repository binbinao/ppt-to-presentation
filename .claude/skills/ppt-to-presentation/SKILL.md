---
name: ppt-to-presentation
description: 把一份 PPT (.pptx) 自动转换成带旁白的介绍视频。四步流水线：解读 PPT → 写演讲稿并逐页匹配 → 审稿检查 → 合成视频。当用户要求"把 PPT 转成视频""给演示文稿配讲解"时使用。
---

# PPT → 介绍视频

把用户提供的 .pptx 转换为带旁白的宣讲视频。你（agent）负责编排与 LLM 工作（写稿、审稿）；脚本负责解析、校验、TTS、渲染。

## 环境前置检查

开始前确认外部 CLI 可用，缺失则提示安装后再继续：

```bash
which soffice pdftoppm edge-tts ffmpeg bunx
```

- `soffice`：`brew install --cask libreoffice`
- `pdftoppm`：`brew install poppler`
- `edge-tts`：`pip3 install edge-tts`
- `ffmpeg`：`brew install ffmpeg`

依赖已装则跳过：`bun install`。

## 流程

### 步骤 1 — parse：解读 PPT

```bash
bun run parse <deck.pptx>
```

产出：
- `build/outline.json`：逐页 `{ slide, title, body[], notes, image }`（slide 从 1 起，对齐 PPT 页码）
- `build/slides/slide-N.png`：每页高保真页面图

读取 `build/outline.json` 全文，掌握每页内容与演讲者备注——这是写稿的原始素材。

### 步骤 2 — draft：写演讲稿并逐页匹配

**这是你的 LLM 工作。** 为每一页撰写一段旁白（narration），写入 `build/script.json`：

```json
{
  "deck": { "title": "<deck title>", "slideCount": 3 },
  "segments": [
    { "slide": 1, "narration": "第一页的旁白文案…" },
    { "slide": 2, "narration": "…" }
  ]
}
```

写作要求：
- **一页一段**，`slide` 字段必须与 outline 页码一一对应（校验按字段对齐，不按数组顺序）
- 融合该页 `title`/`body`/`notes`：notes 优先作为该页讲解口径
- 页间衔接自然，可加开场白与收尾句
- 口语化、可朗读；每段长度与页面信息量匹配（约 20–60 秒语速）
- 语言跟随 PPT 原文语言

写完先跑校验：

```bash
bun run draft build/script.json
```

退出码非 0：按输出的问题清单修订后重跑，直到通过。

### 步骤 3 — review：审稿门

先自审（LLM 检查，逐项过）：
1. **通顺性**：每段独立朗读是否顺畅，无病句
2. **合理性**：陈述是否忠实于页面内容，无编造
3. **逻辑性**：页间顺序是否形成完整叙事，过渡句是否承上启下
4. **一致性**：术语、称谓前后统一
5. **匹配度**：每段讲解与对应页面内容是否贴合

自审发现问题 → 直接修订 `build/script.json` 并重跑 `bun run draft`。自审通过后跑门：

```bash
bun run review build/script.json
```

退出码 0 = 审稿门通过；非 0 = 按编号问题清单修订，回到本步开头。**此门未通过禁止进入步骤 4。**

### 步骤 4 — render：合成视频

```bash
bun run render build/script.json
```

脚本自动完成：edge-tts 逐段合成旁白（`build/audio/segment-N.mp3`）、探测时长回填 `script.json` 的 `durationSec`、Remotion 按页渲染、ffmpeg 拼接。

产出：`output/video.mp4`。

渲染后抽查：随机看 2–3 段画面与音频是否对齐（可用 `bunx remotion studio src/render/remotion/Root.tsx` 预览）。用户对画面动效有要求时，调整 `src/render/remotion/SlideComposition.tsx` 后重跑 render。

## 关键约束

- `script.json` 的 `segments[].slide` 必须覆盖 1..slideCount，无重复、无缺页——`draft`/`review` 会强制校验
- 中间产物都在 `build/`，最终视频在 `output/`；每一步可独立重跑
- `durationSec` 由 render 阶段自动回填，写稿时不要手填

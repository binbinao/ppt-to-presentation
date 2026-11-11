# ppt-to-presentation 设计文档

日期：2026-11-11
状态：已与用户确认方案 A（Bun 全栈）

## 目标

superpowers 风格技能：输入一份 PPT（.pptx），输出一段带旁白的介绍视频。流程四步：

1. **parse** — 解读 PPT，产出 `outline.json`（逐页结构化内容 + 高保真页面图）
2. **draft** — 按页撰写演讲稿，产出 `script.json`（页↔旁白映射）
3. **review** — 审稿：通顺性/合理性/逻辑性检查，schema 门校验，不通过回步骤 2
4. **render** — edge-tts 生成逐段音频，Remotion 合成视频

## 已确认决策

| 决策点 | 结论 | 理由 |
|---|---|---|
| 执行主体 | AI agent 编排技能流程 | draft/review 由 LLM 完成，脚本只做数据传递与校验 |
| 技能形态 | superpowers 技能（SKILL.md + references/） | 与现有工作流一致 |
| 运行时 | Bun + TypeScript，全栈单运行时 | workstation 已装 1.4.4；不混用包管理器 |
| 页面画面 | pptx→pdf→png 高保真页图，Remotion 做包装动效（转场/字幕/进度条） | 忠实还原原 PPT 视觉，工作量可控 |
| TTS | edge-tts CLI 子进程 | 免费、中文效果好、无需写 Python 代码 |
| LLM 调用 | 对话内由 agent 执行，脚本不做 API 调用 | 用户明确选择 manual 模式 |

## 架构与数据流

```
deck.pptx
  │ bun run parse
  ▼
build/outline.json  ←→  build/slides/slide-N.png（页面图）
  │ agent 写稿（对话内）
  ▼
build/script.json ──→ bun run review（schema 门，退出码非0=不通过）──→ 修订
  │ 通过后
  ▼
bun run render
  ├─ edge-tts：每段 narration → build/audio/segment-N.mp3（时长写回 script.json）
  └─ Remotion：页图 + 动效 + 音频 → output/video.mp4
```

- 步骤间只经 JSON 文件耦合，均落盘 `build/`，每步可独立重跑。
- `script.json` 是人可审可手改的枢纽产物。
- 审稿是循环：review 输出问题清单，agent 携清单修订 draft，而非整体重来。

## 数据契约（Zod schema，单一事实源）

`src/schema.ts` 定义并导出，所有步骤 CLI 输入输出均校验：

```ts
// outline.json
Outline = {
  deck: { title: string; slideCount: number }
  slides: Array<{
    slide: number        // 1 起始，与 PPT 页码对齐
    title: string
    body: string[]       // 文本要点
    notes: string        // 演讲者备注（可空）
    image: string        // build/slides/slide-N.png 相对路径
  }>
}

// script.json
Script = {
  deck: { title: string; slideCount: number }
  segments: Array<{
    slide: number        // 不变式：与 slides 一一对应，页码连续
    narration: string    // 旁白文案
    durationSec?: number // render 后回填，供对齐校验
  }>
}
```

**映射不变式**：review 与 render 均以 `slide` 字段驱动对齐，禁止数组顺序隐式对齐。

## 模块划分

```
.claude/skills/ppt-to-presentation/SKILL.md   # 技能入口：编排四步、审稿门
.claude/skills/ppt-to-presentation/references/  # 分步细节
src/
├── schema.ts        # Zod schema（outline/script）
├── parse/index.ts   # JSZip 解 pptx XML → outline.json；soffice+pdftoppm 出页图
├── draft/index.ts   # schema 校验 CLI（写稿本体由 agent 完成）
├── review/index.ts  # 校验 + 审查清单生成（逻辑门）
├── render/tts.ts    # edge-tts 子进程调度，时长探测写回 script.json
└── render/remotion/ # Remotion 工程：静态页图 + 转场/字幕动效
```

## 外部依赖（本机需安装）

- LibreOffice（`soffice`）：pptx → pdf
- poppler（`pdftoppm`）：pdf → png
- edge-tts CLI：`uvx edge-tts` 或 `pipx install edge-tts`
- 当前均未安装（已实测），脚手架阶段需补装并在 SKILL.md 环境检查中前置校验。

## 错误处理

- 可预期错误（页缺失、XML 解析失败、schema 不匹配）抛带上下文 `Error`（含页码），库层不打日志。
- 编排层（SKILL.md）决定重试或中止；review 退出码非 0 即审稿门不通过。

## 测试策略

- `bun test`：
  - parse：`fixtures/sample.pptx` 断言页数/标题/备注提取
  - schema：映射不变式（segment.slide 连续且与 slides 一一对应）
  - tts：时长探测逻辑（mock 子进程）
- render 产物：`bunx remotion studio` 人工核验，不写像素级断言。
- 端到端冒烟：小样 PPT 跑 parse→review 门（render 依赖外部 CLI 装好后再验）。

## 范围界定（YAGNI）

- 不做：完全重绘 PPT 模板的 React 组件、LLM API 调用、API key 配置、多语言 UI、自动重试渲染。
- 后续可扩展：`--auto` 模式（API 全自动）、动画级重绘（方案 B 路线保留）。

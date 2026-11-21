---
name: ppt-to-presentation
description: 把 .pptx 演示文稿自动转换成带旁白的介绍视频（MP4）。当用户提供 PPT/deck 文件并要求"转成视频""配音/配讲解""做成宣讲/介绍视频""PPT 变视频""narrated video"等时使用。输入必须是 .pptx 文件；只改 PPT 内容、只要页面图/PDF/纯文字稿时不用本技能。五步流水线：解读 PPT → 写演讲稿并逐页匹配 → 文字稿 review → 合成视频 → 成片 QA。
---

# PPT → 介绍视频

把用户提供的 .pptx 转换为带旁白的宣讲视频。你（agent）负责编排与 LLM 工作（写稿、审稿、试听试看）；脚本负责解析、校验、TTS、渲染、客观 QA。

## 环境前置检查

开始前确认外部 CLI 可用，缺失则提示安装后再继续：

```bash
which soffice pdftoppm edge-tts ffmpeg bun bunx ffprobe; node --version
```

- `node` 需 ≥20.19（Remotion rspack 硬依赖）
- `edge-tts` 需 ≥7.3.1（旧版被微软 Sec-MS-GEC 校验拒 403）
- 渲染前确认浏览器存在（macOS 默认 `/Applications/Google Chrome.app`；Linux 无系统 Chrome 时 `npx remotion browser ensure`，render 用 `REMOTION_BROWSER=<chrome-headless-shell 路径>` 覆盖）
- 轻量依赖（poppler、edge-tts、ffmpeg）缺失可直接执行安装命令；LibreOffice 这类大件（~1GB）先询问用户再装
- **TTS 连通性冒烟**（在写稿前跑，失败提前终止不浪费 LLM 工作）：`edge-tts --voice zh-CN-XiaoxiaoNeural --text ping --write-media /tmp/tts-probe.mp3`，产物 >0 字节即通

依赖已装则跳过：`bun install`（若 `node_modules/zod` 残缺报 Cannot find module，删目录后 `bun install --force`）。

## 流程总览

```
① parse  → ② draft(写稿) → ③ review(文字稿) → ④ render → ⑤ qa(成片)
```

## 步骤 1 — parse：解读 PPT

```bash
bun run parse <deck.pptx>
```

产出 `build/outline.json`（逐页 `{slide,title,body[],notes,image}`，slide 从 1 起）+ `build/slides/slide-N.png` 页图。

读取 `build/outline.json` 全文掌握每页内容与演讲者备注——这是写稿唯一素材，**不得编造页面里没有的数值或结论**。具备读图能力时，逐页对照 `build/slides/slide-N.png`（尤其图表/表格页：outline 的 body 来自 XML 文本提取，图内信息大概率不在其中）。

## 步骤 2 — draft：写演讲稿并逐页匹配

**这是你的 LLM 工作。** 为每一页撰写一段旁白，写入 `build/script.json`：

```json
{
  "deck": { "title": "<deck title>", "slideCount": 16 },
  "segments": [
    { "slide": 1, "narration": "第一页的旁白文案…" }
  ]
}
```

> `deck` 两个字段照抄 `build/outline.json` 的 `deck`（title 是文件名、slideCount 是真实页数），不要自行改写。

### 音色选择（写稿前先定）

TTS 音色由 `src/render/voice.ts` 按 **deck 底色采样 + 标题关键词** 自动选：
- 深蓝冷色 / 技术研报类 deck（如本 Hy4 deck，主色 #0f5ad4）→ `zh-CN-YunyangNeural`（沉稳专业男声，News / Professional·Reliable）
- 轻快营销类 → `zh-CN-YunxiNeural`；通用 → `zh-CN-XiaoxiaoNeural`
- 人工覆盖：`PPT2VID_VOICE=zh-CN-YunyangNeural bun run render …`

写稿语气要跟音色一致：技术类用克制、笃定、播报式陈述；不用「啦/哦/超赞」等轻快口语。

### 写稿规范（直接决定悦听度，务必遵守）

1. **一页一段**，`slide` 字段与 outline 页码一一对应（校验按字段对齐，不按数组顺序）
2. 融合该页 `title`/`body`/`notes`，notes 优先作讲解口径；**页间必须做起承转合**（详见下方专节，review 硬门会拦截硬起）
3. **断句**：每句 ≤ 25 字左右，用逗号/句号显式断开；禁止 34 字以上无标点长句；每段以句号/问号收尾
4. **口语化转写**：
   - 阿拉伯数字、百分号、单位一律写成中文读法（如「七百七十 B」→ 读「七百七十 B」中 B 也要写成「毕」或「十亿」看语境；「5.45%」→「百分之五点四五」；「18.1pt」→「十八点一分」）
   - 英文缩写/专名尽量中文化：Agent→智能体、API→接口、tokens→词元、UE/Unity→游戏引擎名可保留但前后加中文说明；实在要留英文，确保是常见读音
   - 符号（`/`、`+`、`→`、`&`）改成文字（「和」「加上」「到」），不朗读符号
5. **多音字**：`行/重/长/率/差/降/只/都/干/模/调/还/为` 等异读词，优先改写成无歧义同义词（如「行业」→「产业」、「重新」→「再次」、「长程」→「长距离」需谨慎）；确实要保留的，在 review 报告里标记、成片后试听确认
6. **内容符合性**：所有数字、结论必须能在对应页 outline 里找到依据，不臆造；术语/称谓全片统一
7. **时长锚点**：实测中文语速 ≈ 4.5 字/秒——每段 90–270 汉字（约 20–60 秒）；用户指定总时长时按页数均分再按信息量微调。单段超 300 字说明该页信息量失衡，回看 body 做取舍（精炼讲解，不逐字念 body）。语言跟随 PPT 原文；音色按上文规则自动选定，非中文 deck 且无适配音色时**先停下询问用户**（当前 TTS 音色库以中文为主）。

### 段间起承转合（review 硬门；转场生不生硬全看这里）

逐页各写各的、段段从零起步，就算每页都合格，连起来也像清单——观众会觉得翻页很生硬。写稿时必须让整片逻辑递进：

1. **每段开头承接上一页**：用上一页的结论或数字起头（「既然……」「回到刚才那个数字」「这六个点里，最……」）。**禁止**「第 N 个方向」「另外」「下一项」「接下来介绍」这类清单式硬起。
2. **每段结尾给下一页留钩子**：用问句或「但……」收尾（「那具体落在哪？」「但真正好看的还在后面。」），把观众的注意力接到下一页。
3. **章节切换处写一句过渡**：换主题时先一句话把上一章收住、再引出下一章，不要让听众自己猜为什么要换页。

示范（承接→展开→钩子）：
- ❌ 硬起：「第二，秋天的水景花园……」
- ✅ 承接：「刚才那片银杏，其实只是开场。真正让整座公园出圈的，是水景花园那片倒影……但倒影最浓的时候，还得再等半个月。」

`bun run review` 会对每段段首 24 字做弱校验（是否出现承接词），**无承接词的段必须为 0，否则 review 直接 exit 1**。注意这只是弱校验——它只保证段首有连词、不保证逻辑真的接上；你仍须逐段通读，确认上一页的结论/数字确实被接住。
写完先跑校验：

```bash
bun run draft build/script.json
```

退出码非 0：按输出问题清单修订后重跑，直到通过。

## 步骤 3 — review：文字稿 review 门

```bash
bun run review build/script.json
```

- **硬门**（exit 1 阻断）：schema、页↔稿对齐、空段、**段间衔接（每段段首须承接上一页，无承接词即拦截）**
- **文字稿 QA 报告** → `build/script-qa.md`：逐页统计字数/句数/最长无标点片段、多音字异读词清单、英文串、裸数字、超长句；并列出 **LLM 自审清单**

你（agent）必须打开 `build/script-qa.md`，逐项完成自审并据此修订 `script.json`：

1. **通顺性**：逐段默读，无病句、无成分残缺、无中英夹杂卡壳
2. **文字悦听**：数字/单位/缩写已口语化转写，无念不出的符号，长句已断句，多音字已改写或标记
3. **内容符合性**：每段陈述在对应页 outline 有依据，无编造数值
4. **一致性 / 音色匹配**：术语统一、音色符合 deck 底色；**段间衔接**：逐段确认开头承接上一页的结论/数字、结尾给下一页留了钩子（问句或「但…」）、章节切换处有过渡句（报告「## 段间衔接检查」节须为 0 缺口，且逐段通读逻辑真的接上）

**此门未通过禁止进入步骤 4。** 修订后重跑 `draft` 和 `review`，直到报告里的风险信号降到可接受、且你能逐项确认自审清单。

> 诚实边界：edge-tts CLI 会把文本 XML-escape 进 `<speak>`，SSML/`<phoneme>` 会被字面朗读，**无法做音素级多音字控制**；工程手段是「风险词检测 → 改写规避 → 神经语音上下文判断 → 成片试听」。本机 `faster_whisper` tiny 模型对专名/数字识别很差，只能做粗检，不足以自动判定读音对错，故不接进硬门。

## 步骤 4 — render：合成视频

```bash
REMOTION_BROWSER="<chrome-headless-shell 路径>" bun run render build/script.json
```

脚本自动：按选定音色逐段 edge-tts 合成（单段失败自动重试 4 次并校验时长）、ffprobe 回填 `durationSec`、Remotion 按页渲染、ffmpeg 拼接 → `output/video.mp4`。

字幕条取自**该页旁白首句**（截断到 26 字），而非 `slide.title`——企业模板常把「腾讯集团」放在每页第一个形状里，当字幕会 16 页全一样。

## 步骤 5 — qa：成片 review

```bash
bun run qa
```

产出：
- `build/video-qa.md` — **音画同步**（成片时长 vs 分段合计漂移、音轨覆盖、逐页抽帧成功数）+ **观览合适性**（字幕唯一性/长度、黑屏检测、逐页时间轴）
- `build/qa-contact-sheet.jpg` — 每页中点抽帧的 4×N 拼图，作为目视证据

你（agent）必须：
1. 看 `build/video-qa.md` 的客观指标，确认 PASS
2. **用 vision 打开拼图**，逐页目视确认：页面切换正确、无黑屏/花屏/裁切、字幕条可见且各页不同、页面停留时长够读
3. **试听**（有条件时）：抽查多音字风险词、数字、英文专名实际读音，以及句间停顿是否自然
4. 观感/节奏/音画贴合等主观项写进交付说明，无法靠数值判定

> 客观检查 ≠ 全部通过：字幕唯一性是按当前 script + 渲染逻辑的预测值，不是从视频 OCR；页面观感、读音对错必须靠目视 + 试听。

## References

- `references/qa-and-voice.md` — 双层 QA（文字稿/成片）、edge-tts 多音字与断句边界、按 deck 底色选音色、>9 页页图 / WSS 重试 / 字幕 / Remotion 拼图踩坑。
- `references/linux-setup.md` — Linux 前置与本机适配备忘。

## 交付与验收（robinji 偏好）

- 用户会亲自打开交付物并回传具体问题（乱码、页图错位、音色不对、字幕千篇一律…）。**交付前必自检**，别把"渲染完成"当"完成"——有效交付是能被打开的成品 + 真跑过的验证结论。
- 视频交付：`.mp4` 用 `MEDIA:` 直接发对话；随附 `build/script-qa.md` + `build/video-qa.md` 与拼图，把主观项（读音/观感/节奏）如实写进说明，**不谎称"全部通过"**（客观 PASS ≠ 主观合格，见 reference 的诚实边界）。
- 生成类任务默认内建**文字稿 + 成片**两道显式 review，不等用户指出才补；音色/断句/多音字这类"悦听"维度要主动设计，不是默认值凑合。

## 失败处理

- **draft/review 非 0**：按问题清单修订重跑；同一问题连续 2 轮仍不过 → 停止盲试，向用户报告分歧点与修订思路。
- **parse 非 0**：先分类——路径/usage 错误 → 确认文件存在；pptx 损坏或加密 → 告知用户换文件；soffice/pdftoppm 报错信息不足时手动重跑 `soffice --headless --convert-to pdf --outdir build/slides <deck>` 看完整输出。
- **render 非 0**：edge-tts 失败多为网络抖动 → 直接重跑（幂等：已有有效音频自动跳过，仅失败段重合成）；Remotion/Chrome 报错 → 对照 README"已知环境注意事项"；仍失败 → 附完整命令输出报告用户。
- **每步产物可独立重跑**：TTS 会跳过已有效的 `segment-N.mp3`，重跑只补失败段；改了 PPT 必须重跑 parse + draft（页图会变）。

## 关键约束

- `segments[].slide` 必须覆盖 1..slideCount，无重复、无缺页——`draft`/`review` 强制校验
- `durationSec` 由 render 自动回填，写稿时不要手填
- 中间产物在 `build/`，最终视频在 `output/`；每步可独立重跑
- 字幕内容来自 narration，改字幕=改讲稿首句

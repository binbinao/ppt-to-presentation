# ppt-to-presentation 评审待办清单（Backlog）

来源：2026-11-17 五视角评审（Code Reviewer / Software Architect / Video Streaming Engineer / Voice AI Integration Engineer / Prompt Engineer），全部结论经实测取证。用户已确认按推荐方案执行。

## 已定决策

| # | 决策点 | 结论 |
|---|---|---|
| 1 | 渲染架构 | 短期 C（逐段渲染 + `remotion bundle` 缓存止血）→ --auto 前演进为 A（单 Composition + `<Sequence>` 整片渲染，消除 N 次 bundle/Chrome 冷启动，A/V 帧级对齐，为跨页转场留路） |
| 2 | 多语言/音色 | B — voice 配置化：schema 加 optional `voice`（draft 由 LLM 按 PPT 语言选定）、`TTS_VOICE` env 覆盖默认、SKILL 写映射表（中文 → zh-CN-XiaoxiaoNeural，英文 → en-US-EmmaMultilingualNeural）；非中文 deck 且无适配音色时停下询问用户 |
| 3 | 字幕条 | 显示 narration（听障/静音场景价值；标题已烙在页图里，title 覆盖冗余）；长文 2–3 行 clamp |
| 4 | 乱序 segments | 脚本静默排序：render 侧按 slide 升序稳定排序后再 TTS/渲染/拼接；SKILL 声明"顺序由脚本归一"；checkAlignment 加顺序 warning（不阻断） |
| 5 | 优先级 | 按①→⑥执行 |

---

## ① PPT 解析三连修（数据源头正确性）+ 回归测试

三缺陷同根因（正则解析 XML），一并解决——换轻量解析器（fast-xml-parser）或手写修复：

- [ ] XML 实体解码：`&amp;` `&lt;` `&gt;` `&quot;` `&apos;` + `&#NNN;`/`&#xHHHH;`（实测 `A &amp; B` 直进 outline）
- [ ] rels 解析两遍法：先 match 完整 `<Relationship .../>` 标签再分别提取 Id/Target/Type，消除属性顺序耦合（实测换序即 parse 失败）；兼容单引号属性
- [ ] 文本按 `<a:p>` 段落合并（段内 join runs），标题改用 `<p:ph type="title|ctrTitle">` 占位符识别 + 首 run fallback
- [ ] 回归测试：①含实体 run ②属性换序 rels ③单段多 run ④notes 缺失 slide
- [ ] 延伸（同文件）：`<a:fld>` 字段文本过滤（页码/日期不进正文/notes）

## ② Render 层对齐恢复字段驱动

- [ ] `audio` props 改 `Record<slide, path>` 按表查询，废除下标对齐（SlideComposition 注释与实现一致）
- [ ] render 入口对 segments 按 slide 升序稳定排序（TTS/渲染/concat 全部基于排序后顺序）
- [ ] render 开头调 `checkAlignment`（纯函数，防绕过 review 直渲）
- [ ] `checkAlignment` 加乱序 warning
- [ ] Root.tsx 去掉 `durationSec ?? 3` 兜底——缺失直接抛错（render 刚回填过，缺失=被改坏）

## ③ TTS 健壮性

- [ ] 每段 2–3 次指数退避重试（1s/2s/4s）
- [ ] 幂等续传：跳过已存在、ffprobe 可读、时长>0 的 segment-N.mp3（排除 0 字节残留）
- [ ] 完整性校验：文件 >0 字节 + 实测时长 vs 4.5 字/秒估算期望（<60% 标记可疑报警）
- [ ] 每段失败 rethrow 带 slide 上下文与 stderr（`slide N: edge-tts failed: ...`）
- [ ] SKILL.md 步骤 0 加连通性冒烟（合成一句到 /tmp，失败提前终止，不浪费 LLM 工作）

## ④ SKILL.md 批量修订

- [ ] 语言策略改写（决策 2）：voice 映射表 + 非中文 deck 停下询问
- [ ] 时长锚点：中文 ≈4.5 字/秒（实测），每段 90–270 汉字（英文 50–150 词）；指定总时长时按页均分再按信息量微调
- [ ] 新增"失败处理"一节：draft/review 非 0（2 轮上限后停止盲试报告用户）、parse 非 0（分类：路径/损坏/工具报错）、render 非 0（edge-tts 网络抖动重跑幂等；Remotion 对照 README 环境注意事项）
- [ ] description 触发词扩充 + 输入条件/排除项（"配音""做成介绍视频""deck to narrated video"等；只要页面图/PDF/纯文字稿时不用本技能）
- [ ] "渲染后抽查"改为可执行命令：抽帧读图核对（`ffmpeg -ss N -i video -frames:v 1`）+ durationSec 与 ffprobe 交叉核对；studio 仅在用户要求时启动（入口 index.ts、本机须 --rspack）
- [ ] 环境检查补 `node --version`（≥20.19）与 Chrome 存在性；明确轻量依赖 agent 可自装、LibreOffice 大件先询问
- [ ] 审稿循环收敛出口：自审显式结论 + 同一问题 2 轮不过即停止报告
- [ ] script.json 示例注明：deck 两字段照抄 build/outline.json（title 是文件名）
- [ ] narration 可读性规则：数字/百分比/缩写写成读法，禁括号补充语
- [ ] 可选指引：具备读图能力时逐页对照 slide-N.png（图表/表格页）
- [ ] 统一 spec/SKILL/AGENTS 三处审稿循环指向（失败回 draft）

## ⑤ 一行级修复（随手批）

- [ ] 各 CLI catch 打印 `e.stderr`（ShellError 有此字段）
- [ ] `.gitignore` 补 `public/`；删除孤儿 `output/remotion-props.json`
- [ ] schema：`image: z.string().min(1)`；parse 显式断言 `imagePaths.length === rawSlides.length`（去 `?? ""` 兜底）
- [ ] schema：narration `.refine(trim 非空)`（集中到 schema 层）；title/notes/narration 长度上限
- [ ] align/schema：`slideCount === slides.length` + 页码连续校验；script.deck 与 outline.deck 不一致告警
- [ ] slides.ts：deckName sanitize（`[\w.-]`）+ 解析前清空 outDir + numeric 排序
- [ ] props 改文件传递（`--props=build/remotion-props.json`），清 output/ 孤儿
- [ ] parse/index.ts 统一走 `validateOutline`（弃 `OutlineSchema.parse`）

## ⑥ --auto 前置（结构性）

- [ ] render 断点续跑：阶段产物跳过（TTS 按 narration 内容哈希判失效；segment mp4 存在跳过）+ `--force`；`synthesizeAll` 不再回写 script.json（duration 移入 render 侧 build/plan.json，script 回归纯 LLM 产物）
- [ ] 审稿落盘：`build/review-notes.json`（`{slide, issue, severity, resolved?}`），review CLI 校验上轮未 resolved 项；draft CLI 加时长 band check（<5s / >90s 告警）
- [ ] `bun run doctor`：版本/可用性检查（soffice/pdftoppm/edge-tts/ffmpeg/Chrome/Node），parse 前置调用
- [ ] 渲染架构转决策 1-A：单 Composition + `<Sequence>` + 音频帧级 pad（`tailPadSec` 0.4s，消除 21–33ms/段的取整误差与 AAC priming 漂移）
- [ ] deck 指纹：pptx sha256 短哈希写入 outline.deck，review/render 校验（防 PPT 改内容页数不变导致旧稿配新图）
- [ ] 测试补齐：render 三段纯逻辑（syncPublicAssets 路径映射、segments.txt 构造、assetPath 剥离）+ checkAlignment 乱序行为断言
- [ ] schema.ts 注释：方案 B（动画重绘）需 major 升级；单 Composition 迁移是转场需求的结构转折点

## 设计确认项（确认前不动）

- 4:3 deck 黑边（当前 16:9 巧合性理想；未来按幻灯片宽高比出图或加底色）
- 音频码率显式化（AAC 320k 立体声源 24k 单声道 mp3，无听感增益但绝对值小）
- pptx 图片型标题/SmartArt 内容丢失（占位符识别后仍需 fallback 提示）

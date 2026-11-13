# Linux 环境适配备忘（本机实测，2026-11-12；16 页 deck 追加修订 2026-11-13）

本机环境：TencentOS / dnf，Python 3.11（hermes venv 无 pip 模块，用 `uv pip`），Node 22.15.0。
技能上游是 Mac 环境开发的，SKILL.md 里的前置检查与 `src/render/index.ts` 的 Chrome 路径都写死了 Mac，Linux 需按下述处理。

## 一次装齐依赖（已验证）

```bash
# Bun 运行时（本机原缺，npm 全局装）
npm install -g bun            # → bun 1.4.4

# poppler（pdftoppm，本机原缺）
dnf install -y poppler-utils  # → pdftoppm 23.08.0

# edge-tts 必须 ≥7.3.1（7.2.7 会被微软 Sec-MS-GEC 校验拒 403）
uv pip install --python /hermes-app/venv/bin/python --upgrade edge-tts   # → 7.3.1
# 验证：edge-tts --voice zh-CN-XiaoxiaoNeural --text '测试' --write-media /tmp/t.mp3

# Remotion 渲染用的 Chrome Headless Shell（本机无系统 Chrome）
cd <skill_dir> && npx remotion browser ensure
# 落到 node_modules/.remotion/chrome-headless-shell/linux64/.../chrome-headless-shell
```

soffice(LibreOffice 24.8)、ffmpeg(7.0.2) 本机已有。

## 坑与修复

1. **作者提交的 `node_modules/zod` 残缺**（Mac 打包漏 `v4/core/json-schema-processors.js`），
   `bun test` 报 `Cannot find module` → 必须删掉再强制重装：
   ```bash
   rm -rf node_modules/zod && bun install --force
   ```
   单纯 `bun install` 不会覆盖已存在的残缺目录。修完 15/15 全绿。

2. **`src/render/index.ts` 硬编码 Mac Chrome 路径** `/Applications/Google Chrome.app/...`。
   Linux 用环境变量 `REMOTION_BROWSER` 覆盖（脚本已支持 `process.env.REMOTION_BROWSER ?? <MacPath>`）：
   ```bash
   CHROME=$(find node_modules/.remotion -name chrome-headless-shell -type f | head -1)
   REMOTION_BROWSER="$CHROME" bun run render build/script.json
   ```

3. **edge-tts 7.2.7 → 403 WSServerHandshakeError**（`wss://speech.platform.bing.com/...`
   Sec-MS-GEC 令牌过期）。升级 7.3.1 即恢复，非技能 bug、非网络封锁。

4. `public/AGENTS.md` 是作者误提交的**另一个项目**的知识库维护规则，与本技能无关，
   已删除以免污染技能加载上下文。仓库根 `AGENTS.md` 是本技能的项目说明（保留）。

5. 脚本用 `Bun.$` 起本地子进程（soffice / pdftoppm / edge-tts / ffprobe / ffmpeg / remotion / mv），
   参数均为内部路径与常量；安全审计：无 curl|bash、无 eval、无 base64 混淆、无密钥读取、无外传。

6. **`src/parse/slides.ts` 在 >9 页 deck 上确定性错乱**（2026-11-13 实测 16 页首次暴露）：
   pdftoppm 对 16 页输出 `slide-1.png … slide-16.png`（不补零），旧代码 `padded.sort()` 是
   **字符串排序** → 顺序变成 `1,10,11,…,16,2,3,…`；且 `mv` 的源和目标都在 `build/slides/`
   同目录，边改名边把还没轮到的源文件踩掉 → 最后只剩 9 张错乱图，加上一轮 2 页 fixture
   残留的 `slide-17/18.png`，而 outline 引用的是 `slide-1..16` → render 必然找不到图。
   **修复**：先把所有 `slide-*.png` 用 `rename` 移进临时子目录 `.raw`，再按文件名里的数字
   做自然数序排序、逐个 rename 回 `slide-N.png`，最后删 `.raw`；导入 `mkdir, rename, rm`。
   parse 前先 `rm -rf build/slides` 清残留。
   这类「源和目标同目录、按字符串序重命名」是通用陷阱：先把源文件隔离出目录再写回。

7. **`src/render/tts.ts` 对 edge-tts 的 WSS 偶发断连无韧性**（2026-11-13 实测）：
   16 段串行合成时，任一段连接中途掉线会留一个 **0 字节 mp3**，紧接着 `probeDurationSec`
   的 ffprobe 读不到时长就抛错、整条 render 中止；`.quiet()` 还会吞掉子命令错误，日志只报
   `Failed with exit code 1`，看不出是第几段。单段手动重试通常立刻成功（网络抖动，非文本问题）。
   **修复**：抽出 `synthesizeSegment()`，单段最多重试 4 次
   （`Bun.$ ... .quiet().nothrow()` + `Bun.sleep(800*i)` 退避），每次以 `probeDurationSec(out)>0`
   为通过条件，全失败才抛带上下文的 Error。`.nothrow()` / `Bun.sleep` 在 bun 1.4.4 实测可用。
   教训是 **retry pattern + 产物校验**，不是「edge-tts 会失败」——永远验证产物字节/时长，
   别只信子进程退出码。

> ⚠️ 第 6–11 条都是**对源码的本地改动**，不在上游公开仓里。
> 从上游重装/升级会覆盖丢失，需重新应用并按验证清单复验。

8. **QA 体系（2026-11-13 robinji review 后新增，五步流水线）**：
   `bun run review` 现在除硬门外产出 `build/script-qa.md`（逐页字数/句数/最长无标点、
   多音字异读词清单、英文串、裸数字 + **LLM 自审清单**：通顺性/悦听/内容符合性）；
   新增 `bun run qa` 产出 `build/video-qa.md`（音画同步：时长漂移/音轨覆盖、观览合适性：
   字幕唯一性/长度/黑屏检测）+ `build/qa-contact-sheet.jpg`（每页中点抽帧 4×N 拼图，
   给 agent 用 vision 目视）。纯函数集中在 `src/review/narration.ts`、`src/render/subtitle.ts`、
   `src/render/voice.ts`、`src/render/palette.ts`，单测 `tests/qa-review.test.ts`。
   - 拼图必须用 `Bun.spawn(argv[])` 传**数组**：`Bun.$\`...${inputs}...\`` 里 `inputs` 是
     join 的单个字符串会被当**一个**畸形 argv；且 hstack 补位不能复用同一标签
     （一个 filter label 不能被消费两次），要 `color=c=black` 生成独立补位帧。写单图加 `-update 1`。
   - 黑屏检测：`ffprobe -f lavfi -i movie=<jpg>,signalstats` 取 `YAVG<12`。

9. **音色按 deck 底色 + 字幕修 bug（2026-11-13）**：
   `voice.ts` 用 ffmpeg `scale=1:1` 采样封面/章节页平均 RGB，冷色深调（b>r+20 且均值<150）
   → 技术研报类 → 沉稳专业男声 `zh-CN-YunyangNeural`（News/Professional·Reliable）；
   旧固定女声 `Xiaoxiao` 退役。`PPT2VID_VOICE` 环境变量可强制覆盖。
   本 deck 实测主色 `#0f5ad4`。edge-tts 中文男声：`Yunyang`(沉稳/News)、`Yunjian`(激情)、
   `Yunxi`(明快)、`Yunxia`(卡通)，女声 `Xiaoxiao`/`Xiaoyi` + 两种方言。
   **字幕 bug**：企业模板把「腾讯集团」放在每页 shape[0]，旧代码用 `slide.title` 当字幕导致
   16 页全一样。改为 `subtitleFromNarration(narration)` 取该页旁白首句（截 26 字），与音频强关联。

10. **多音字/断句的能力边界（诚实结论，别踩）**：
    edge-tts CLI 把 text `xml.sax.escape` 后包进 `<speak><prosody>`，**SSML/`<phoneme>` 标签会被
    字面朗读**，无法音素级控制。可行手段只有：风险词检测（行/重/长/率/差/降/只/都/干/模/调/还/为）
    → **同义改写规避**（行业→产业、重新→再次、长程→长流程、幻觉率→幻觉比例）→ 神经语音
    上下文判断 → 成片试听。数字/百分号/符号一律中文口语化转写（5.45%→百分之五点四五，
    `/`→和，→→到）。本机 `faster_whisper` tiny 能跑但对专名/数字误识严重（「混元Hy4」→
    「同學會員還四」），**只配做粗检，不能自动判读音对错，不接硬门**。

11. **发 iWiki 拿播放链接（2026-11-13 实测）**：
    `iwiki` MCP 实际有 38 个工具（skill 文档只列了 31，且把 `getSpaceInfoByKey` 写错，
    真名 `getSpaceInfo`）。附件上传走 `prepareAttachmentUpload(doc_id, filename)` → 拿预签名
    `url`+`attachment_id` → `curl -X PUT --data-binary @file "$url"`（COS 签名 120s 内）
    → `completeAttachmentUpload(attachmentid, filepath)`。**prepare 与 PUT 必须严格配对**
    （为拿 URL 重复调 prepare 会让 complete 绑定错 id）；`getAttachmentDownloadUrl` 返回
    5 分钟有效签名 URL，别当长期链接，给用户的应是文档页 `https://iwiki.woa.com/p/<docid>`。
    iWiki DOC 的 HtmlTransformer 会**过滤 `<video>`/`<iframe>`/`<source>` 标签**，无法内嵌播放器，
    只能放附件链接（点开由 iWiki 附件预览播放）。本机直连 iwiki.woa.com 域名的持久端点
    curl 超时（内网隔离，MCP 能通），不影响文档内引用。

## 端到端验证结果（fixtures/sample.pptx）

`parse → draft → review → render` 四步全绿；审稿门负向测试（重复段+缺页）正确拦截并退出 1。
产物 `output/video.mp4`：1.1MB / 24.9s / 1920×1080 / H.264+AAC，两段旁白音轨齐全，
`durationSec` 自动回填（12.0s / 12.7s），抽帧确认两页 PPT 内容+字幕条正确切换。

工作流命令：
```bash
bun run parse fixtures/sample.pptx     # → build/outline.json + build/slides/slide-N.png
# 由 agent 按页写 build/script.json（schema 见 SKILL.md）
bun run draft build/script.json        # schema + 页↔稿对齐门
bun run review build/script.json       # 审稿硬门，退出 0 才可 render
REMOTION_BROWSER="$CHROME" bun run render build/script.json   # → output/video.mp4
```

## >9 页真实 deck 的验证清单（2026-11-13，16 页中文 deck 全绿）

- [ ] `bun test` **28/28**（原 15 + `qa-review.test.ts` 13：narration/voice/subtitle 纯函数）
- [ ] `rm -rf build/slides && bun run parse <deck.pptx>` → 日志 `N slides, N images`（两个数必须相等）
- [ ] outline 每个 `image` 路径都存在；`find build/slides -name '*.png' | wc -l` == N
- [ ] 抽 4 帧（封面/章节页/内容页/附录）拼图核对页序，防字符串排序错乱
- [ ] **步骤2 写稿**：数字/符号口语化、长句≤34字、多音字改写；`build/script-qa.md` 里
      超长句应归零，英文串只剩必要专名
- [ ] **步骤3 文字稿 review**：draft 门（含负向测试：造重复页+缺页应 exit 1）+ review 门；
      agent 逐项确认自审清单（通顺性/悦听/内容符合性/音色匹配）
- [ ] `resolveVoice()` 实测：`voice=zh-CN-YunyangNeural`、palette `#0f5ad4` cool+dark（技术 deck）
- [ ] **步骤4 render**：`REMOTION_BROWSER="$CHROME" bun run render`：TTS 段数 == N、
      每个 mp3 >0 字节（WSS 抖动自动重试）、`durationSec` 全部回填
- [ ] ffprobe：分段 mp4 数 == N；Σ durationSec ≈ 成片时长（差 <1s 是容器封装余量）；
      音视频双轨 duration 都覆盖全长
- [ ] **步骤5 成片 QA**：`bun run qa` → `video-qa.md` 客观项 PASS（时长漂移<1.5s、
      音轨差<1.5s、字幕 N/N 唯一、超28字0页、黑帧0）；用 vision 看 `qa-contact-sheet.jpg`
      逐页目视；有条件试听多音字/数字/英文专名读音
- [ ] 本机参考值：16 页中文约 2900 字 → 成片 ~10min / 36MB / 1920×1080 / 30fps H.264+AAC；
      16 段 TTS + 16 段 Remotion 渲染约 5 分钟（后台跑 + 完成通知更省心）

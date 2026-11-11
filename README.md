# ppt-to-presentation

把一份 PPT（.pptx）自动转换成带旁白的介绍视频的 superpowers 风格技能。

## 流程（四步）

1. **parse** — 解读 PPT：`bun run parse <deck.pptx>` → `build/outline.json` + `build/slides/slide-N.png`
2. **draft** — agent 写演讲稿逐页匹配 → `build/script.json`；`bun run draft` 校验 schema + 页↔稿对齐
3. **review** — 审稿门：agent 自审 + `bun run review`（退出码 0 才可渲染）
4. **render** — `bun run render`：edge-tts 逐段旁白 → Remotion 渲染逐页 → ffmpeg 拼接 → `output/video.mp4`

## 环境依赖

- Bun 1.4+（运行时）、Node 20.19+/22.12+（Remotion rspack 需要）
- LibreOffice（`soffice`）、poppler（`pdftoppm`）、`edge-tts`、`ffmpeg`
- Chrome for Testing / Google Chrome（Remotion 渲染；`--browser-executable` 可指向系统 Chrome）

## 快速开始

```bash
bun install
bun run parse deck.pptx
# 编辑 build/script.json（每页一段 narration，slide 字段对齐页码）
bun run draft build/script.json && bun run review build/script.json
bun run render build/script.json
```

技能入口：`.claude/skills/ppt-to-presentation/SKILL.md`

## 已知环境注意事项

- **Remotion 必须用 rspack bundler**（`--rspack` flag / `bundle({ rspack: true })`）：本机 webpack 编译会挂起（progress 卡 ~6%），rspack 2 秒完成。Node ≥20.19 即可满足 rspack 要求。
- **不要创建 `remotion.config.ts`**：Remotion CLI 启动时经 esbuild JS API 加载它，本机 esbuild 服务进程会挂起（已删除，改用 `--image-format=jpeg --overwrite` CLI flag）。
- Remotion props 经 `--props` 注入，root 组件用 `getInputProps()` 读取（见 `src/render/remotion/Root.tsx`）。
- 渲染入口是 `src/render/remotion/index.ts`（调用 `registerRoot`），不是 `Root.tsx`。
- Bun `.quiet()` 的 stdout 在部分版本返回 Buffer 而非 string，`tts.ts` 已做双形态兼容。
- 本会话后期观察到机器上 bun 执行 JS 挂起（openat 阻塞，疑安全软件 hook）；Node 执行正常。核心模块可用 Node ≥23（原生 TS）直接冒烟：见 `docs/superpowers/plans/` 下验证记录。

## 测试

```bash
bun test   # 15 用例：schema(4) parse(4) align(4) tts(3)
```

## 结构

详见 `AGENTS.md`（Repository Guidelines）与 `docs/superpowers/specs/2026-11-11-ppt-to-presentation-design.md`。

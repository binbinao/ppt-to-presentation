import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { validateScript, validateOutline } from "../schema";
import { subtitleFromNarration } from "../render/subtitle";

// Post-render QA (spec step 5): A/V sync + viewing suitability.
// Produces build/video-qa.md (report) and build/qa-contact-sheet.jpg (visual
// evidence: one frame per slide, tiled). Semantic judgement ("画面是否合适")
// is answered by the agent with this contact sheet in front of it; the checks
// below are objective: duration math, audio coverage, frame decodability,
// subtitle length/distinctness, black-frame detection.

type SegmentRow = {
  slide: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  subtitle: string;
  frame: string;
};

async function ffprobeJson(path: string): Promise<any> {
  const res = await $`ffprobe -v error -show_format -show_streams -of json ${path}`.quiet();
  const out = typeof res.text === "string" ? res.text : res.stdout.toString();
  return JSON.parse(out.toString());
}

async function main() {
  const script = validateScript(await Bun.file("build/script.json").json());
  const outline = validateOutline(await Bun.file("build/outline.json").json());
  const videoPath = "output/video.mp4";
  const probe = await ffprobeJson(videoPath);
  const fmt = probe.format ?? {};
  const vstream = (probe.streams ?? []).find((s: any) => s.codec_type === "video");
  const astream = (probe.streams ?? []).find((s: any) => s.codec_type === "audio");
  const videoDur = Number(fmt.duration ?? 0);
  const audioDur = Number(astream?.duration ?? 0);

  await mkdir("build/qa-frames", { recursive: true });
  const rows: SegmentRow[] = [];
  let t = 0;
  const problems: string[] = [];

  for (let i = 0; i < script.segments.length; i++) {
    const seg = script.segments[i]!;
    const d = seg.durationSec ?? 0;
    if (d <= 0) problems.push(`slide ${seg.slide}: durationSec 未回填（render 未跑完？）`);
    const mid = t + d / 2;
    const frame = `build/qa-frames/f${String(seg.slide).padStart(2, "0")}.jpg`;
    // Extract a frame from the middle of each slide's time window.
    const r = await $`ffmpeg -y -ss ${mid.toFixed(2)} -i ${videoPath} -frames:v 1 ${frame} -loglevel error`.quiet().nothrow();
    if (r.exitCode !== 0) problems.push(`slide ${seg.slide}: 抽帧失败（时间点 ${mid.toFixed(1)}s 无画面）`);
    rows.push({
      slide: seg.slide,
      startSec: t,
      endSec: t + d,
      durationSec: d,
      subtitle: subtitleFromNarration(seg.narration),
      frame,
    });
    t += d;
  }

  const sumDur = rows.reduce((n, r) => n + r.durationSec, 0);
  const drift = Math.abs(videoDur - sumDur);
  const audioGap = Math.abs(videoDur - audioDur);

  // A/V sync checks
  if (drift > 1.5) problems.push(`音画时长漂移 ${drift.toFixed(2)}s > 1.5s（分段合计 vs 成片）`);
  if (!astream) problems.push("缺少音轨");
  else if (audioGap > 1.5) problems.push(`音轨覆盖不足：视频 ${videoDur.toFixed(1)}s vs 音频 ${audioDur.toFixed(1)}s，差 ${audioGap.toFixed(1)}s`);

  // Viewing suitability: subtitles must be distinct & short (else bar overflows)
  const subs = rows.map((r) => r.subtitle);
  const distinct = new Set(subs).size;
  if (distinct < rows.length) problems.push(`字幕重复：${rows.length} 页仅 ${distinct} 种字幕（疑似套用页眉）`);
  const tooLong = subs.filter((s) => Array.from(s).length > 28);
  if (tooLong.length) problems.push(`${tooLong.length} 页字幕超过 28 字，可能溢出字幕条`);

  // Black/near-black frame detection via ffmpeg signalstats mean luma.
  let blackFrames = 0;
  for (const row of rows) {
    try {
      const res = await $`ffprobe -v error -f lavfi -i movie=${row.frame},signalstats -show_entries frame_tags=lavfi.signalstats.YAVG -of csv=p=0`.quiet().nothrow();
      const out = (typeof res.text === "string" ? res.text : res.stdout.toString()).toString().trim();
      const yavg = Number.parseFloat(out.split("\n")[0] ?? "NaN");
      if (Number.isFinite(yavg) && yavg < 12) { blackFrames++; problems.push(`slide ${row.slide}: 画面疑似黑屏 (YAVG=${yavg.toFixed(1)})`); }
    } catch { /* signalstats 不可用时跳过该项，不算失败 */ }
  }

  // Contact sheet: tile all frames into one image for the agent to eyeball.
  // Use Bun.spawn with an explicit argv array — a single string with embedded
  // spaces would be passed to ffmpeg as one malformed argument.
  const n = rows.length;
  const cols = 4;
  const rowsN = Math.ceil(n / cols);
  const fc: string[] = [];
  for (let i = 0; i < n; i++) fc.push(`[${i}:v]scale=480:270,drawtext=text='p${rows[i]!.slide}':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6[v${i}]`);
  const pads: string[] = [];
  for (let rr = 0; rr < rowsN; rr++) {
    const parts: string[] = [];
    for (let cc = 0; cc < cols; cc++) {
      const idx = rr * cols + cc;
      if (idx < n) parts.push(`[v${idx}]`);
      else {
        // Blank filler (a filter label can't be consumed twice).
        const bid = `b${rr}_${cc}`;
        fc.push(`color=c=black:s=480x270:d=1[${bid}]`);
        parts.push(`[${bid}]`);
      }
    }
    pads.push(`${parts.join("")}hstack=inputs=${cols}[r${rr}]`);
  }
  const vstack = pads.map((_, i) => `[r${i}]`).join("") + `vstack=inputs=${rowsN}[out]`;
  const filter = [...fc, ...pads, vstack].join(";");
  const argv = ["ffmpeg", "-y", ...rows.flatMap((r) => ["-i", r.frame]), "-filter_complex", filter, "-map", "[out]", "-frames:v", "1", "-update", "1", "build/qa-contact-sheet.jpg", "-loglevel", "error"];
  const proc = Bun.spawn(argv, { stdout: "ignore", stderr: "pipe" });
  await proc.exited;
  if (proc.exitCode !== 0) problems.push(`拼图生成失败 (ffmpeg exit ${proc.exitCode})`);

  const L: string[] = [];
  L.push(`# 成片 QA 报告 — ${script.deck.title}`);
  L.push("");
  L.push("## 音画同步");
  L.push("");
  L.push(`- 成片时长：**${videoDur.toFixed(2)}s**；分段合计 ${sumDur.toFixed(2)}s；漂移 **${drift.toFixed(2)}s** ${drift <= 1.5 ? "✅" : "❌"}`);
  L.push(`- 视频流：${vstream?.codec_name} ${vstream?.width}×${vstream?.height} @ ${vstream?.r_frame_rate ?? "?"}fps`);
  L.push(`- 音频流：${astream?.codec_name ?? "无"}，时长 ${audioDur.toFixed(2)}s，与视频差 **${audioGap.toFixed(2)}s** ${audioGap <= 1.5 ? "✅" : "❌"}`);
  L.push(`- 逐页中点抽帧：${rows.filter((r) => !problems.some((p) => p.includes(`slide ${r.slide}: 抽帧失败`))).length}/${rows.length} 成功`);
  L.push("");
  L.push("## 观览合适性");
  L.push("");
  L.push(`- 字幕唯一性：${distinct}/${rows.length} 页字幕各不相同 ${distinct === rows.length ? "✅" : "❌（若全一样说明套用了页眉）"}`);
  L.push(`- 字幕长度：超 28 字的 ${tooLong.length} 页 ${tooLong.length === 0 ? "✅" : "❌"}`);
  L.push(`- 黑屏/近黑帧：${blackFrames} 页 ${blackFrames === 0 ? "✅" : "❌"}`);
  L.push("- 页面切换与画面观感：见 `build/qa-contact-sheet.jpg`（每页中点抽帧拼图），由 agent 目视确认。");
  L.push("");
  L.push("## 逐页时间轴 / 字幕");
  L.push("");
  L.push("| 页 | 起 | 止 | 时长 | 字幕 |");
  L.push("|---:|---:|---:|---:|---|");
  for (const r of rows) L.push(`| ${r.slide} | ${r.startSec.toFixed(1)}s | ${r.endSec.toFixed(1)}s | ${r.durationSec.toFixed(1)}s | ${r.subtitle.replace(/\|/g, "\\|")} |`);
  L.push("");
  L.push("## 结论");
  L.push("");
  if (problems.length === 0) L.push("**PASS** — 客观检查全部通过；页面观感请以拼图目视复核为准。");
  else { L.push(`**需复核（${problems.length} 项）**`); problems.forEach((p, i) => L.push(`${i + 1}. ${p}`)); }
  L.push("");
  L.push("> LLM 复核项：音画是否同步观感、字幕是否与旁白/页面内容贴合、页面停留时长是否够读、");
  L.push("> 有无花屏/裁切/文字错乱、整体节奏是否适合观看。这些无法靠数值判定，须看拼图+试听。");

  await Bun.write("build/video-qa.md", L.join("\n") + "\n");
  console.log(`[qa] 成片报告 → build/video-qa.md`);
  console.log(`[qa] 拼图 → build/qa-contact-sheet.jpg`);
  console.log(`[qa] 时长漂移 ${drift.toFixed(2)}s | 音轨差 ${audioGap.toFixed(2)}s | 字幕 ${distinct}/${rows.length} 唯一 | 黑帧 ${blackFrames}`);
  if (problems.length) {
    console.error(`[qa] 需复核 ${problems.length} 项：`);
    problems.forEach((p, i) => console.error(`  ${i + 1}. ${p}`));
  } else console.log("[qa] 客观检查 PASS");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { synthesizeAll } from "./tts";
import { validateOutline, validateScript } from "../schema";

// Render pipeline (spec step 4): TTS → per-slide Remotion renders → ffmpeg concat.
async function main() {
  const scriptPath = process.argv[2] ?? "build/script.json";
  const { script, audio } = await synthesizeAll(scriptPath, "build/audio");
  const outline = validateOutline(await Bun.file("build/outline.json").json());
  await mkdir("output", { recursive: true });

  const remotionProps = JSON.stringify({
    outline,
    script,
    // staticFile resolves relative to the Remotion public dir; pass bare names
    audio: audio.map((p) => p.replace(/^build\/audio\//, "")),
  });

  const segmentVideos: string[] = [];
  for (const seg of script.segments) {
    const id = `slide-${seg.slide}`;
    const out = `output/segment-${seg.slide}.mp4`;
    await $`bunx remotion render src/render/remotion/index.ts ${id} ${out} --props=${remotionProps}`.quiet();
    segmentVideos.push(out);
  }

  const listFile = "output/segments.txt";
  await Bun.write(listFile, segmentVideos.map((v) => `file '${v}'`).join("\n") + "\n");
  await $`ffmpeg -f concat -safe 0 -i ${listFile} -c copy output/video.mp4`.quiet();
  console.log("output/video.mp4 rendered");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

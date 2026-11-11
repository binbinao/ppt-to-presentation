import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { synthesizeAll } from "./tts";
import { validateOutline, validateScript } from "../schema";

// Render pipeline (spec step 4): TTS → per-slide Remotion renders → ffmpeg concat.
// Remotion serves ./public via staticFile; sync render assets there first.
async function syncPublicAssets(audio: string[], images: string[]): Promise<void> {
  await mkdir("public/audio", { recursive: true });
  await mkdir("public/slides", { recursive: true });
  for (const a of audio) {
    const dest = `public/${a.replace(/^build\//, "")}`;
    await Bun.write(dest, Bun.file(a));
  }
  for (const img of images) {
    const dest = `public/${img.replace(/^build\//, "")}`;
    await Bun.write(dest, Bun.file(img));
  }
}

async function main() {
  const scriptPath = process.argv[2] ?? "build/script.json";
  const { script, audio } = await synthesizeAll(scriptPath, "build/audio");
  const outline = validateOutline(await Bun.file("build/outline.json").json());
  await mkdir("output", { recursive: true });
  await syncPublicAssets(audio, outline.slides.map((s) => s.image));

  const remotionProps = JSON.stringify({
    outline,
    script,
    // Full build/-relative paths; SlideComposition strips build/ for staticFile.
    audio,
  });

  // This machine: webpack bundler hangs, remotion.config.ts breaks CLI startup,
  // and the bundled headless shell renderer hangs — hence --rspack, no config
  // file, and the system Chrome executable. Flags are default-safe elsewhere.
  const remotionFlags = [
    "--rspack",
    `--browser-executable=${process.env.REMOTION_BROWSER ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}`,
    "--chrome-mode=chrome-for-testing",
    "--image-format=jpeg",
    "--overwrite",
    "--timeout=120000",
  ].join(" ");

  const segmentVideos: string[] = [];
  for (const seg of script.segments) {
    const id = `slide-${seg.slide}`;
    const out = `output/segment-${seg.slide}.mp4`;
    await $`bunx remotion render src/render/remotion/index.ts ${id} ${out} --props=${remotionProps} ${remotionFlags}`.quiet();
    segmentVideos.push(out);
  }

  const listFile = "output/segments.txt";
  // ffmpeg resolves list entries relative to the list file's directory.
  await Bun.write(listFile, segmentVideos.map((v) => `file '${v.replace(/^output\//, "")}'`).join("\n") + "\n");
  await $`ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy output/video.mp4`.quiet();
  console.log("output/video.mp4 rendered");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

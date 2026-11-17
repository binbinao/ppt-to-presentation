import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { synthesizeAll } from "./tts";
import { validateOutline, validateScript } from "../schema";
import { checkAlignment } from "../draft/align";
import { sortSegmentsBySlide, buildAudioLookup, SEGMENT_FILE } from "./segments";

// Print the tail of stderr from a failed Bun shell command — without this the
// only diagnostic is "Failed with exit code N" (.quiet() swallows output).
function printShellError(e: unknown, context: string): never {
  const err = e as { stderr?: Buffer | string; message?: string };
  const stderr = err?.stderr ? `\n${err.stderr.toString().trim().split("\n").slice(-15).join("\n")}` : "";
  console.error(`${context} failed: ${err?.message ?? e}${stderr}`);
  process.exit(1);
}

// Render pipeline (spec step 4): TTS → per-slide Remotion renders → ffmpeg concat.
// Remotion serves ./public via staticFile; sync render assets there first.
async function syncPublicAssets(audioLookup: Map<number, string>, images: Map<number, string>): Promise<void> {
  await mkdir("public/audio", { recursive: true });
  await mkdir("public/slides", { recursive: true });
  for (const [slide, path] of audioLookup) {
    const dest = `public/${path.replace(/^build\//, "")}`;
    await Bun.write(dest, Bun.file(path));
  }
  for (const [slide, path] of images) {
    const dest = `public/${path.replace(/^build\//, "")}`;
    await Bun.write(dest, Bun.file(path));
  }
}

async function main() {
  const scriptPath = process.argv[2] ?? "build/script.json";
  const { script: rawScript, audio } = await synthesizeAll(scriptPath, "build/audio");
  const outline = validateOutline(await Bun.file("build/outline.json").json());

  // Alignment gate at the render entry too (review can be bypassed).
  const script = validateScript(rawScript);
  const alignmentProblems = checkAlignment(outline, script);
  if (alignmentProblems.length > 0) {
    console.error(`render aborted — alignment invariant violated:\n${alignmentProblems.map((p) => `- ${p}`).join("\n")}`);
    process.exit(1);
  }

  // Field-driven order: sort by slide so output is deterministic regardless of
  // how the agent wrote script.json (SKILL.md documents this normalization).
  const sorted = sortSegmentsBySlide(script);

  const audioLookup = buildAudioLookup(sorted, audio);
  const imageLookup = new Map(outline.slides.map((s) => [s.slide, s.image]));
  await mkdir("output", { recursive: true });
  await syncPublicAssets(audioLookup, imageLookup);

  const remotionProps = JSON.stringify({
    outline,
    script: sorted,
    // slide -> audio path map; compositions resolve by slide field.
    audio: Object.fromEntries([...audioLookup.entries()].map(([slide, p]) => [slide, p])),
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
  for (const seg of sorted.segments) {
    const id = `slide-${seg.slide}`;
    const out = `output/segment-${seg.slide}.mp4`;
    try {
      await $`bunx remotion render src/render/remotion/index.ts ${id} ${out} --props=${remotionProps} ${remotionFlags}`.quiet();
    } catch (e) {
      printShellError(e, `remotion render slide ${seg.slide}`);
    }
    segmentVideos.push(out);
  }

  const listFile = "output/segments.txt";
  // ffmpeg resolves list entries relative to the list file's directory.
  await Bun.write(listFile, segmentVideos.map((v) => `file '${v.replace(/^output\//, "")}'`).join("\n") + "\n");
  try {
    await $`ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy output/video.mp4`.quiet();
  } catch (e) {
    printShellError(e, "ffmpeg concat");
  }
  console.log(`output/video.mp4 rendered (${sorted.segments.length} slides)`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

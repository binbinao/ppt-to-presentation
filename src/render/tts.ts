import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { validateScript } from "../schema";
import type { Script } from "../schema";

export const VOICE = "zh-CN-XiaoxiaoNeural";

// Pure: given probed durations (segment order), return script with durationSec filled.
export function computeSegmentPlan(script: Script, durationsSec: number[]): Script {
  if (durationsSec.length !== script.segments.length) {
    throw new Error(`duration probe count ${durationsSec.length} != segment count ${script.segments.length}`);
  }
  const segments = script.segments.map((seg, i) => {
    const d = durationsSec[i]!;
    if (d <= 0) throw new Error(`slide ${seg.slide}: probed audio duration must be positive, got ${d}`);
    return { ...seg, durationSec: d };
  });
  return { ...script, segments };
}

export async function probeDurationSec(path: string): Promise<number> {
  const res = await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${path}`.quiet();
  const d = Number.parseFloat(res.text.trim());
  if (!Number.isFinite(d) || d <= 0) throw new Error(`ffprobe could not read duration for ${path}`);
  return d;
}

// Synthesize narration audio per segment via edge-tts CLI, probe durations,
// and backfill durationSec into script.json for Remotion frame math.
export async function synthesizeAll(scriptPath: string, audioDir: string): Promise<{ script: Script; audio: string[] }> {
  const script: Script = validateScript(await Bun.file(scriptPath).json());
  await mkdir(audioDir, { recursive: true });

  const audio: string[] = [];
  const durations: number[] = [];
  for (const seg of script.segments) {
    const out = `${audioDir}/segment-${seg.slide}.mp3`;
    await $`edge-tts --voice ${VOICE} --text ${seg.narration} --write-media ${out}`.quiet();
    audio.push(out);
    durations.push(await probeDurationSec(out));
  }

  const updated = computeSegmentPlan(script, durations);
  await Bun.write(scriptPath, JSON.stringify(updated, null, 2));
  return { script: updated, audio };
}

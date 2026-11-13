import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { validateScript, validateOutline } from "../schema";
import type { Script } from "../schema";
import { selectVoice, type DeckPalette } from "./voice";
import { sampleDeckPalette } from "./palette";

// Voice is resolved per run from deck palette + env override (see voice.ts).
export const VOICE = "zh-CN-YunyangNeural";

export async function resolveVoice(deckTitle: string, sampleText?: string): Promise<{ voice: string; reason: string; palette?: DeckPalette }> {
  let palette: DeckPalette | undefined;
  try {
    const outline = validateOutline(await Bun.file("build/outline.json").json());
    palette = await sampleDeckPalette(outline.slides.map((s) => s.image));
  } catch { /* no outline yet (e.g. unit context) — fall back to text cues */ }
  const r = selectVoice({ deckTitle, sampleText, envVoice: process.env.PPT2VID_VOICE, palette });
  return { voice: r.voice, reason: r.reason, palette: r.palette };
}

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
  const out = typeof res.text === "string" ? res.text : res.stdout.toString();
  const d = Number.parseFloat(out.toString().trim());
  if (!Number.isFinite(d) || d <= 0) throw new Error(`ffprobe could not read duration for ${path}`);
  return d;
}

// Synthesize narration audio per segment via edge-tts CLI, probing durations
// and backfilling durationSec into script.json for Remotion frame math.
// edge-tts uses a WSS stream that occasionally drops mid-transfer and leaves a
// 0-byte file; retry each segment a few times and verify a playable duration
// instead of letting one flaky connection abort the whole render.
async function synthesizeSegment(voice: string, text: string, out: string): Promise<number> {
  const attempts = 4;
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    await $`edge-tts --voice ${voice} --text ${text} --write-media ${out}`.quiet().nothrow();
    try {
      const d = await probeDurationSec(out);
      if (d > 0) return d;
    } catch (e) {
      lastErr = e;
    }
    // Brief backoff before retrying the WSS connection.
    await Bun.sleep(800 * i);
  }
  throw new Error(`edge-tts failed for ${out} after ${attempts} attempts: ${lastErr instanceof Error ? lastErr.message : lastErr}`);
}

export async function synthesizeAll(scriptPath: string, audioDir: string): Promise<{ script: Script; audio: string[] }> {
  const script: Script = validateScript(await Bun.file(scriptPath).json());
  await mkdir(audioDir, { recursive: true });

  const { voice, reason } = await resolveVoice(script.deck.title, script.segments[0]?.narration ?? "");
  console.log(`[tts] voice=${voice} — ${reason}`);

  const audio: string[] = [];
  const durations: number[] = [];
  for (const seg of script.segments) {
    const out = `${audioDir}/segment-${seg.slide}.mp3`;
    const d = await synthesizeSegment(voice, seg.narration, out);
    audio.push(out);
    durations.push(d);
  }

  const updated = computeSegmentPlan(script, durations);
  await Bun.write(scriptPath, JSON.stringify(updated, null, 2));
  return { script: updated, audio };
}

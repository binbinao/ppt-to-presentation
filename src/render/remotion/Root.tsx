import React from "react";
import { z } from "zod";
import { Composition, getInputProps } from "remotion";
import { SlideComposition, FPS } from "./SlideComposition";
import { validateOutline, validateScript, type Outline, type Script } from "../../schema";

export const slidePropsSchema = z.object({
  slide: z.number().int().positive(),
});

export type SlideIndexProps = z.infer<typeof slidePropsSchema>;

// Input props injected via --props (see render CLI); read with getInputProps().
export type RemotionProps = {
  outline: Outline;
  script: Script;
  audio: Record<number, string>; // slide number -> audio path (field-driven, never array index)
};

// One composition per segment; rendered individually then ffmpeg-concatenated.
// Composition receives only its slide number and resolves everything from
// inputProps — Remotion merges inputProps over defaultProps, so same-named
// keys in defaultProps would be clobbered (see SlideComposition).
// durationSec is required: the render CLI backfills it before invoking
// Remotion; a missing value means script.json was hand-edited and must fail
// loudly instead of silently truncating audio to 3s.
export const RemotionRoot: React.FC = () => {
  const input = getInputProps<RemotionProps>();
  const { outline, script } = input;
  if (!outline || !script) {
    throw new Error("render: missing input props (outline/script) — pass --props to remotion render");
  }
  validateOutline(outline);
  validateScript(script);
  for (const seg of script.segments) {
    if (seg.durationSec === undefined) {
      throw new Error(`render: slide ${seg.slide} missing durationSec — script.json must be backfilled by the render pipeline, not hand-edited`);
    }
  }

  return (
    <>
      {script.segments.map((seg) => {
        const slide = outline.slides.find((s) => s.slide === seg.slide);
        if (!slide) throw new Error(`render: slide ${seg.slide} missing from outline`);
        const durationSec = seg.durationSec!;
        return (
          <Composition
            key={seg.slide}
            id={`slide-${seg.slide}`}
            schema={slidePropsSchema}
            component={SlideComposition}
            defaultProps={{ slide: seg.slide }}
            durationInFrames={Math.ceil(durationSec * FPS)}
            fps={FPS}
            width={1920}
            height={1080}
          />
        );
      })}
    </>
  );
};

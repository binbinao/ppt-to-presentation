import React from "react";
import { z } from "zod";
import { Composition, getInputProps } from "remotion";
import { SlideComposition, FPS, type SlideProps } from "./SlideComposition";
import type { Outline, Script } from "../../schema";

export const slidePropsSchema = z.object({
  title: z.string(),
  image: z.string(),
  audio: z.string(),
  durationSec: z.number(),
});

// Type alias satisfies Remotion's Record<string, unknown> constraint.
export type RemotionProps = {
  outline: Outline;
  script: Script;
  audio: string[];
};

// One composition per segment; rendered individually then ffmpeg-concatenated.
// Input props arrive via Remotion --props; read with getInputProps() at render time.
export const RemotionRoot: React.FC = () => {
  const input = getInputProps<RemotionProps>();
  const { outline, script, audio } = input;
  if (!outline || !script) throw new Error("render: missing input props (outline/script) — pass --props to remotion render");
  return (
    <>
      {script.segments.map((seg, i) => {
        const slide = outline.slides.find((s) => s.slide === seg.slide);
        if (!slide) throw new Error(`render: slide ${seg.slide} missing from outline`);
        const durationSec = seg.durationSec ?? 3;
        return (
          <Composition
            key={seg.slide}
            id={`slide-${seg.slide}`}
            schema={slidePropsSchema}
            component={SlideComposition}
            defaultProps={{ title: slide.title, image: slide.image, audio: audio[i] ?? "", durationSec }}
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

import React from "react";
import { z } from "zod";
import { Composition } from "remotion";
import { SlideComposition, FPS, type SlideProps } from "./SlideComposition";
import type { Outline, Script } from "../../schema";

export const slidePropsSchema = z.object({
  title: z.string(),
  image: z.string(),
  audio: z.string(),
  durationSec: z.number(),
});

export interface RemotionProps {
  outline: Outline;
  script: Script;
  audio: string[];
}

// One composition per segment; rendered individually then ffmpeg-concatenated.
export const RemotionRoot: React.FC<RemotionProps> = ({ outline, script, audio }) => {
  return (
    <>
      {script.segments.map((seg, i) => {
        const slide = outline.slides.find((s) => s.slide === seg.slide);
        if (!slide) throw new Error(`render: slide ${seg.slide} missing from outline`);
        const durationSec = seg.durationSec ?? 3;
        return (
          <Composition<typeof slidePropsSchema._output, typeof slidePropsSchema>
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

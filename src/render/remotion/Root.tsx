import React from "react";
import { z } from "zod";
import { Composition, getInputProps } from "remotion";
import { SlideComposition, FPS } from "./SlideComposition";
import { validateOutline, validateScript, type Outline, type Script } from "../../schema";

export const slidePropsSchema = z.object({
  segmentIndex: z.number().int().nonnegative(),
});

export type SegmentIndexProps = z.infer<typeof slidePropsSchema>;

// Input props injected via --props (see render CLI); read with getInputProps().
export type RemotionProps = {
  outline: Outline;
  script: Script;
  audio: string[];
};

// One composition per segment; rendered individually then ffmpeg-concatenated.
// Per-slide props are NOT passed through defaultProps because Remotion merges
// inputProps over composition defaultProps (same-named keys would be clobbered).
// Instead each composition receives only its segmentIndex and resolves its own
// data from getInputProps() inside SlideComposition.
export const RemotionRoot: React.FC = () => {
  const input = getInputProps<RemotionProps>();
  const { outline, script } = input;
  if (!outline || !script) {
    throw new Error("render: missing input props (outline/script) — pass --props to remotion render");
  }
  validateOutline(outline);
  validateScript(script);

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
            defaultProps={{ segmentIndex: i }}
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

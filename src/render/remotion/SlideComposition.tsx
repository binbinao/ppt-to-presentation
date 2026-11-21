import React from "react";
import { AbsoluteFill, Audio, Img, getInputProps, staticFile } from "remotion";
import { subtitleFromNarration } from "../subtitle";

// Type alias (not interface) so it satisfies Record<string, unknown> constraints.
export type SlideProps = {
  slide: number;
};

// 30 fps; composition duration derived from narration audio length.
export const FPS = 30;

// Remotion serves the public/ dir at staticFile's base. The render CLI copies
// build/slides and build/audio into public/ before rendering; these paths are
// relative to public/.
export const slideAssetPath = (imageRel: string): string => imageRel.replace(/^build\//, "");
export const audioAssetPath = (audioRel: string): string => audioRel.replace(/^build\//, "");

// One slide per segment: static high-fidelity page image + narration audio +
// subtitle bar. Resolves its own data from input props by SLIDE FIELD (the
// alignment invariant) — audio is looked up via the Record<slide, path> map,
// never by array index. Subtitle shows the narration's first clause (from
// subtitle.ts) so each page's bar is unique even with repeated page headers.
export const SlideComposition: React.FC<SlideProps> = ({ slide: slideNumber }) => {
  const input = getInputProps<{
    outline: { slides: Array<{ slide: number; title: string; image: string }> };
    script: { segments: Array<{ slide: number; narration: string; durationSec?: number }> };
    audio: Record<number, string>;
    // PPT2VID_SUBTITLES=0 skips the caption bar (see render/index.ts).
    subtitles?: boolean;
  }>();

  const seg = input.script?.segments.find((s) => s.slide === slideNumber);
  if (!seg) throw new Error(`SlideComposition: slide ${slideNumber} missing from input props`);
  const audioPath = input.audio?.[slideNumber];
  if (typeof audioPath !== "string") {
    throw new Error(`SlideComposition: audio for slide ${slideNumber} missing from audio lookup`);
  }
  const slide = input.outline?.slides.find((s) => s.slide === slideNumber);
  if (!slide) throw new Error(`SlideComposition: slide ${slideNumber} missing from outline`);
  if (typeof slide.image !== "string") throw new Error(`SlideComposition: slide ${slideNumber} image missing`);
  const durationSec = seg.durationSec;
  if (durationSec === undefined) throw new Error(`SlideComposition: slide ${slideNumber} durationSec missing`);

  const subtitle = subtitleFromNarration(seg.narration);

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioAssetPath(audioPath))} />
      <Img src={staticFile(slideAssetPath(slide.image))} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      {input.subtitles === false ? null : (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 40,
            right: 40,
            background: "rgba(0,0,0,0.55)",
            color: "white",
            padding: "12px 20px",
            borderRadius: 8,
            fontSize: 26,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Audio, Img, getInputProps, staticFile } from "remotion";

// Type alias (not interface) so it satisfies Record<string, unknown> constraints.
export type SlideProps = {
  segmentIndex: number;
};

// 30 fps; composition duration derived from narration audio length.
export const FPS = 30;

// Remotion serves the public/ dir at staticFile's base. The render CLI copies
// build/slides and build/audio into public/ before rendering; these paths are
// relative to public/.
export const slideAssetPath = (imageRel: string): string => imageRel.replace(/^build\//, "");
export const audioAssetPath = (audioRel: string): string => audioRel.replace(/^build\//, "");

// One slide per segment: static high-fidelity page image + narration audio +
// subtitle bar. Resolves its own data from input props (see Root.tsx for why).
export const SlideComposition: React.FC<SlideProps> = ({ segmentIndex }) => {
  const input = getInputProps<{
    outline: { slides: Array<{ slide: number; title: string; image: string }> };
    script: { segments: Array<{ slide: number; durationSec?: number }> };
    audio: string[];
  }>();

  const seg = input.script?.segments[segmentIndex];
  if (!seg) throw new Error(`SlideComposition: segment ${segmentIndex} missing from input props`);
  // Align by slide field (invariant): audio files are named segment-<slide>.mp3
  const audioPath = input.audio?.[segmentIndex];
  if (typeof audioPath !== "string") {
    throw new Error(`SlideComposition: audio[${segmentIndex}] missing or not a string`);
  }
  const slide = input.outline?.slides.find((s) => s.slide === seg.slide);
  if (!slide) throw new Error(`SlideComposition: slide ${seg.slide} missing from outline`);
  if (typeof slide.image !== "string") throw new Error(`SlideComposition: slide ${seg.slide} image missing`);
  const durationSec = seg.durationSec ?? 3;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioAssetPath(audioPath))} />
      <Img src={staticFile(slideAssetPath(slide.image))} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
          fontSize: 28,
        }}
      >
        {slide.title}
      </div>
    </AbsoluteFill>
  );
};

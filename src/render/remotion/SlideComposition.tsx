import React from "react";
import { AbsoluteFill, Audio, Img, staticFile } from "remotion";

// Type alias (not interface) so it satisfies Record<string, unknown> constraints.
export type SlideProps = {
  title: string;
  image: string; // path under build/, resolved via staticFile
  audio: string; // path under build/audio
  durationSec: number;
};

// 30 fps; composition duration derived from narration audio length.
export const FPS = 30;

// One slide per segment: static high-fidelity page image + narration audio +
// subtitle bar. Animation (transitions, progress) is a later concern (YAGNI).
export const SlideComposition: React.FC<SlideProps> = ({ title, image, audio, durationSec }) => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile(audio)} />
      <Img src={staticFile(image)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
        {title}
      </div>
    </AbsoluteFill>
  );
};

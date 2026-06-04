import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

interface VideoClipProps {
  file: string;
}

export const VideoClip: React.FC<VideoClipProps> = ({ file }) => {
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(file)}
        volume={1}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </AbsoluteFill>
  );
};

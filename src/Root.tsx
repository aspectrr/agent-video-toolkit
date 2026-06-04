import React from "react";
import { Composition } from "remotion";
import { DayTwoComposition } from "./DayTwoComposition";
import { totalFrames } from "./editData";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DayTwo"
      component={DayTwoComposition}
      durationInFrames={totalFrames()}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

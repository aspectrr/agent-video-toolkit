import React from "react";
import { AbsoluteFill, Series, useCurrentFrame } from "remotion";
import { VideoClip } from "./VideoClip";
import {
  clips,
  clipDurationFrames,
  getClipFrameOffsets,
  tasks,
} from "./editData";

const clipOffsets = getClipFrameOffsets();

export const DayTwoComposition: React.FC = () => {
  const frame = useCurrentFrame();

  // Determine current clip index
  let currentClipIndex = -1;
  for (let i = 0; i < clips.length; i++) {
    if (
      frame >= clipOffsets[i] &&
      frame < clipOffsets[i] + clipDurationFrames(clips[i])
    ) {
      currentClipIndex = i;
      break;
    }
  }

  // DAY #2: appears at 2s, holds 3s, disappears instantly
  const ANIM_START = 60;
  const HOLD_DURATION = 90;
  const TEXT_END = ANIM_START + HOLD_DURATION;
  const textVisible = frame >= ANIM_START && frame < TEXT_END;

  // Task list — typing animation per task
  const TYPING_SPEED = 2; // frames per character
  const PREFIX = "- [ ] ";

  const visibleTasks = tasks
    .map((task, i) => {
      if (currentClipIndex < task.appearAtClip) return null;
      const taskAppearFrame = clipOffsets[task.appearAtClip];
      const framesSinceAppear = frame - taskAppearFrame;

      // Typing animation: reveal characters over time
      const totalChars = PREFIX.length + task.text.length;
      const charsTyped = Math.min(
        totalChars,
        Math.floor(framesSinceAppear / TYPING_SPEED),
      );

      // How many of those chars are into the actual task text (past the prefix)
      const textCharsTyped = Math.max(0, charsTyped - PREFIX.length);
      const prefixVisible = charsTyped >= PREFIX.length;

      const displayText = prefixVisible
        ? task.text.slice(0, textCharsTyped)
        : "";
      const showPrefix = charsTyped > 0;
      const showCursor = charsTyped < totalChars;
      const isComplete = charsTyped >= totalChars;

      return {
        ...task,
        index: i,
        showPrefix,
        displayText,
        showCursor,
        isComplete,
      };
    })
    .filter(Boolean) as Array<{
    text: string;
    index: number;
    showPrefix: boolean;
    displayText: string;
    showCursor: boolean;
    isComplete: boolean;
  }>;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Series>
        {clips.map((clip) => (
          <Series.Sequence
            key={clip.id}
            durationInFrames={clipDurationFrames(clip)}
          >
            <VideoClip file={clip.file} />
          </Series.Sequence>
        ))}
      </Series>

      {/* DAY #2 — full screen, instant on/off */}
      {textVisible && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "2% 0",
          }}
        >
          <div
            style={{
              fontSize: 1000,
              fontWeight: 900,
              fontFamily:
                "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif",
              color: "white",
              letterSpacing: 10,
              lineHeight: 0.5,
              userSelect: "none",
              textAlign: "center",
            }}
          >
            DAY
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              lineHeight: 0.5,
            }}
          >
            <span
              style={{
                fontSize: 1000,
                fontWeight: 900,
                fontFamily:
                  "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif",
                color: "white",
                marginRight: 10,
                userSelect: "none",
              }}
            >
              #
            </span>
            <span
              style={{
                fontSize: 1000,
                fontWeight: 900,
                fontFamily:
                  "'SF Pro Display', 'Helvetica Neue', system-ui, sans-serif",
                color: "white",
                userSelect: "none",
                display: "inline-block",
              }}
            >
              2
            </span>
          </div>
        </AbsoluteFill>
      )}

      {/* TERMINAL TODO — left side, markdown checklist with typing animation */}
      {visibleTasks.length > 0 && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              left: "3%",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            {/* Terminal window */}
            <div
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.82)",
                backdropFilter: "blur(16px)",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.08)",
                borderStyle: "solid",
                overflow: "hidden",
                minWidth: 340,
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.06), " +
                  "0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              {/* Title bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 14px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "#ff5f57",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "#febc2e",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "#28c840",
                  }}
                />
                <span
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 11,
                    fontFamily: "'SF Mono', 'Fira Code', 'Menlo', monospace",
                    marginLeft: 8,
                    fontWeight: 500,
                  }}
                >
                  to-do.md
                </span>
              </div>

              {/* Terminal body */}
              <div
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  fontFamily: "'SF Mono', 'Fira Code', 'Menlo', monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {/* Header */}
                <div
                  style={{ color: "rgba(255,255,255,0.4)", marginBottom: 4 }}
                >
                  # to-do list
                </div>

                {visibleTasks.map((task) => (
                  <div key={task.index} style={{ whiteSpace: "nowrap" }}>
                    {task.showPrefix && (
                      <span style={{ color: "#7EC8E3" }}>{"- [ ] "}</span>
                    )}
                    <span style={{ color: "rgba(255,255,255,0.88)" }}>
                      {task.displayText}
                    </span>
                    {task.showCursor && (
                      <span
                        style={{
                          color: "#FA8072",
                          animation: "blink 0.6s step-end infinite",
                        }}
                      >
                        ▌
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

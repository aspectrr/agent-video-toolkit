# Video Toolkit

Remotion-powered video editing toolkit. Transcribe source footage, plan edits, compose with overlays, render final videos.

## Structure

```
├── src/                    # Remotion compositions & components
│   ├── Root.tsx            # Composition registration
│   ├── index.ts            # registerRoot entry
│   ├── editData.ts         # Clip definitions, task list, timing
│   ├── DayTwoComposition.tsx
│   └── VideoClip.tsx       # Reusable video clip player
├── public/
│   └── audio/              # Sound effects
├── transcribe/             # Python transcription tool (mlx-whisper)
│   ├── transcribe.py       # Transcribes videos → JSON + .txt
│   └── transcripts/        # Generated transcripts
├── videos/                 # Source footage (gitignored)
├── remotion.config.ts
├── package.json
└── tsconfig.json
```

## Workflow

### 1. Transcribe

```bash
# Drop source videos into videos/
bun run transcribe
# Outputs to transcribe/transcripts/
```

### 2. Plan edits

Edit `src/editData.ts` — define clips (source file, start/end timestamps), tasks, and timing.

### 3. Extract clips

```bash
# Extract each planned clip as a small mp4 for fast Remotion rendering
ffmpeg -ss START -i videos/SOURCE.MOV -t DURATION \
  -c:v libx264 -preset ultrafast -crf 22 \
  -c:a aac -b:a 192k -movflags +faststart \
  -y public/clips/clip-name.mp4
```

### 4. Preview

```bash
bun run dev
```

### 5. Render

```bash
bun run render DayTwo out/final.mp4 --codec h264 --crf 20
```

## Reusable Components

- **`VideoClip`** — Plays a video file from `public/`
- **`DayTwoComposition`** — Full video composition with Series clips, DAY #2 overlay, and terminal-style todo list
- **`editData.ts`** — Data-driven clip list and task definitions

## Tools

- **Remotion** — React-based video composition
- **FFmpeg** — Clip extraction, format conversion
- **mlx-whisper** — Local transcription on Apple Silicon

import mlx_whisper
import json
import os

VIDEOS_DIR = os.path.join(os.path.dirname(__file__), "..", "videos")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "transcripts")

os.makedirs(OUTPUT_DIR, exist_ok=True)

MODEL = "mlx-community/whisper-large-v3-turbo"

videos = sorted([f for f in os.listdir(VIDEOS_DIR) if f.endswith(".MOV")])

for video in videos:
    video_path = os.path.join(VIDEOS_DIR, video)
    out_name = os.path.splitext(video)[0] + ".json"
    out_path = os.path.join(OUTPUT_DIR, out_name)

    if os.path.exists(out_path):
        print(f"Skipping {video} (already transcribed)")
        continue

    print(f"Transcribing {video}...")
    result = mlx_whisper.transcribe(
        video_path,
        path_or_hf_repo=MODEL,
        word_timestamps=True,
        verbose=False,
    )

    with open(out_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Saved {out_path}")

    # Also save a readable text version
    txt_path = os.path.join(OUTPUT_DIR, os.path.splitext(video)[0] + ".txt")
    with open(txt_path, "w") as f:
        for seg in result["segments"]:
            start = seg["start"]
            end = seg["end"]
            text = seg["text"].strip()
            f.write(f"[{start:.2f} - {end:.2f}] {text}\n")

    print(f"Saved {txt_path}")

print("Done!")

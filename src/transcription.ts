import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
}

export class TranscriptionService {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || "";
    if (!this.openaiApiKey) {
      console.error("Warning: OPENAI_API_KEY not set. Transcription will fail.");
    }
  }

  /**
   * Extract audio from video using ffmpeg
   */
  private async extractAudio(videoPath: string): Promise<string> {
    const tempDir = os.tmpdir();
    const audioPath = path.join(tempDir, `imovie-mcp-${Date.now()}.mp3`);
    
    // Extract audio using ffmpeg
    const ffmpegCmd = `ffmpeg -i "${videoPath}" -vn -ar 16000 -ac 1 -c:a libmp3lame -q:a 2 "${audioPath}" -y`;
    
    try {
      await execAsync(ffmpegCmd);
      return audioPath;
    } catch (error) {
      throw new Error(`Failed to extract audio: ${error}`);
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   */
  async transcribe(videoPath: string): Promise<TranscriptionResult> {
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    // Extract audio
    const audioPath = await this.extractAudio(videoPath);

    try {
      // Use curl to call Whisper API
      const curlCmd = `curl -s https://api.openai.com/v1/audio/transcriptions \
        -H "Authorization: Bearer ${this.openaiApiKey}" \
        -H "Content-Type: multipart/form-data" \
        -F file=@"${audioPath}" \
        -F model="whisper-1" \
        -F response_format="verbose_json" \
        -F timestamp_granularities="word"`;

      const { stdout } = await execAsync(curlCmd);
      const response = JSON.parse(stdout);

      // Clean up temp audio file
      fs.unlinkSync(audioPath);

      if (response.error) {
        throw new Error(`Whisper API error: ${response.error.message}`);
      }

      // Parse segments with timestamps
      const segments: TranscriptionSegment[] = [];
      
      if (response.words) {
        // Group words into sentences/segments
        let currentSegment: TranscriptionSegment | null = null;
        
        for (const word of response.words) {
          if (!currentSegment || word.start - currentSegment.end > 1) {
            // Start new segment
            if (currentSegment) {
              segments.push(currentSegment);
            }
            currentSegment = {
              start: word.start,
              end: word.end,
              text: word.word,
            };
          } else {
            // Add to current segment
            currentSegment.text += " " + word.word;
            currentSegment.end = word.end;
          }
        }
        
        if (currentSegment) {
          segments.push(currentSegment);
        }
      }

      return {
        text: response.text,
        segments,
      };
    } catch (error) {
      // Clean up on error
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
      throw error;
    }
  }

  /**
   * Transcribe multiple videos
   */
  async transcribeMultiple(videoPaths: string[]): Promise<Map<string, TranscriptionResult>> {
    const results = new Map<string, TranscriptionResult>();
    
    for (const path of videoPaths) {
      try {
        const result = await this.transcribe(path);
        results.set(path, result);
      } catch (error) {
        console.error(`Failed to transcribe ${path}:`, error);
      }
    }
    
    return results;
  }
}

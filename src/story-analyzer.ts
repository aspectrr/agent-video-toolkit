import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

interface VideoTranscript {
  filePath: string;
  fullText: string;
  segments: TranscriptionSegment[];
}

export interface StorySegment {
  sourceVideo: string;
  startTime: number;
  endTime: number;
  text: string;
  relevance: number; // 0-1 score
  topic: string;
}

export interface StoryAnalysis {
  title: string;
  summary: string;
  segments: StorySegment[];
  totalDuration: number;
  themes: string[];
}

export class StoryAnalyzer {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || "";
  }

  /**
   * Analyze transcripts and create a coherent storyline
   */
  async analyzeStory(
    transcripts: Map<string, VideoTranscript>,
    options: {
      targetDuration?: number; // in seconds
      focusTopics?: string[];
      style?: "chronological" | "thematic" | "highlights";
    } = {}
  ): Promise<StoryAnalysis> {
    // Build context for LLM
    const videoContexts: string[] = [];
    
    for (const [filePath, transcript] of transcripts) {
      const fileName = filePath.split("/").pop() || filePath;
      videoContexts.push(`
Video: ${fileName}
Full Transcript: ${transcript.fullText}
Segments:
${transcript.segments.map(s => `  [${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s]: ${s.text}`).join("\n")}
`);
    }

    const prompt = `
You are a video editor AI. Analyze these video transcripts and create a coherent storyline.

${videoContexts.join("\n---\n")}

Task: Create a compelling narrative by selecting the best segments from these videos.
${options.targetDuration ? `Target duration: ${options.targetDuration} seconds` : ""}
${options.focusTopics ? `Focus on these topics: ${options.focusTopics.join(", ")}` : ""}
${options.style ? `Story style: ${options.style}` : ""}

For each selected segment, provide:
1. Source video file path
2. Start time (seconds)
3. End time (seconds)
4. The text content
5. Why this segment was chosen (relevance to story)
6. Topic/theme of the segment

Format your response as JSON:
{
  "title": "Story title",
  "summary": "Brief summary of the narrative arc",
  "segments": [
    {
      "sourceVideo": "/path/to/video.mp4",
      "startTime": 12.5,
      "endTime": 18.2,
      "text": "segment text",
      "relevance": 0.9,
      "topic": "topic name"
    }
  ],
  "themes": ["theme1", "theme2"]
}

Important: 
- Select segments that flow logically
- Trim dead air, ums, and irrelevant parts
- Create emotional arc (setup → conflict → resolution)
- Ensure smooth transitions between segments
`;

    try {
      const response = await this.callOpenAI(prompt);
      const analysis = JSON.parse(response);
      
      // Calculate total duration
      const totalDuration = analysis.segments.reduce(
        (sum: number, seg: StorySegment) => sum + (seg.endTime - seg.startTime),
        0
      );

      return {
        title: analysis.title,
        summary: analysis.summary,
        segments: analysis.segments,
        totalDuration,
        themes: analysis.themes || [],
      };
    } catch (error) {
      console.error("Story analysis failed:", error);
      throw error;
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const curlCmd = `curl -s https://api.openai.com/v1/chat/completions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${this.openaiApiKey}" \
      -d '{
        "model": "gpt-4o",
        "messages": [
          {"role": "system", "content": "You are a professional video editor AI that analyzes transcripts and creates compelling narratives."},
          {"role": "user", "content": ${JSON.stringify(prompt)}}
        ],
        "temperature": 0.7
      }'`;

    const { stdout } = await execAsync(curlCmd);
    const response = JSON.parse(stdout);

    if (response.error) {
      throw new Error(`OpenAI API error: ${response.error.message}`);
    }

    return response.choices[0].message.content;
  }

  /**
   * Generate a highlight reel from a single video
   */
  async generateHighlights(
    transcript: VideoTranscript,
    options: {
      highlightCount?: number;
      minDuration?: number;
      maxDuration?: number;
    } = {}
  ): Promise<StorySegment[]> {
    const prompt = `
Analyze this video transcript and identify the ${options.highlightCount || 5} most engaging moments.

Video: ${transcript.filePath}
Transcript: ${transcript.fullText}

Select segments that are:
- Emotionally impactful
- Key insights or revelations
- Memorable quotes
- Clear topic transitions

${options.minDuration ? `Minimum segment duration: ${options.minDuration}s` : ""}
${options.maxDuration ? `Maximum segment duration: ${options.maxDuration}s` : ""}

Return as JSON array:
[
  {
    "startTime": 45.2,
    "endTime": 52.8,
    "text": "the selected text",
    "relevance": 0.95,
    "topic": "why this is a highlight"
  }
]
`;

    try {
      const response = await this.callOpenAI(prompt);
      const highlights = JSON.parse(response);
      
      return highlights.map((h: any) => ({
        sourceVideo: transcript.filePath,
        startTime: h.startTime,
        endTime: h.endTime,
        text: h.text,
        relevance: h.relevance,
        topic: h.topic,
      }));
    } catch (error) {
      console.error("Highlight generation failed:", error);
      throw error;
    }
  }
}

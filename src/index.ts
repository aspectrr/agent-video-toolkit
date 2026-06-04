#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as path from "path";
import * as os from "os";
import { TranscriptionService } from "./transcription.js";
import { iMovieController } from "./imovie.js";
import { StoryAnalyzer, StoryAnalysis } from "./story-analyzer.js";
import { FolderWatcher, VideoFile } from "./folder-watcher.js";

// Configuration
const WATCH_FOLDER = process.env.IMOVIE_WATCH_FOLDER || path.join(os.homedir(), "Movies", "iMovie MCP Input");

// Services
const transcriptionService = new TranscriptionService();
const imovieController = new iMovieController();
const storyAnalyzer = new StoryAnalyzer();

// MCP Server
const server = new Server(
  {
    name: "imovie-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: "scan_videos",
    description: "Scan the watch folder for video files",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "transcribe_videos",
    description: "Transcribe one or more video files using Whisper",
    inputSchema: {
      type: "object",
      properties: {
        videoPaths: {
          type: "array",
          items: { type: "string" },
          description: "Array of video file paths to transcribe",
        },
      },
      required: ["videoPaths"],
    },
  },
  {
    name: "analyze_story",
    description: "Analyze transcripts and create a coherent storyline",
    inputSchema: {
      type: "object",
      properties: {
        transcripts: {
          type: "object",
          description: "Map of video paths to transcription data",
        },
        targetDuration: {
          type: "number",
          description: "Target duration in seconds for the final video",
        },
        style: {
          type: "string",
          enum: ["chronological", "thematic", "highlights"],
          description: "Story editing style",
        },
        focusTopics: {
          type: "array",
          items: { type: "string" },
          description: "Topics to focus on",
        },
      },
      required: ["transcripts"],
    },
  },
  {
    name: "create_imovie_project",
    description: "Create a new iMovie project",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name for the new project",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "apply_edits",
    description: "Apply edit decisions to create final video in iMovie",
    inputSchema: {
      type: "object",
      properties: {
        projectName: {
          type: "string",
          description: "Name of the iMovie project",
        },
        edits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sourceVideo: { type: "string" },
              startTime: { type: "number" },
              endTime: { type: "number" },
              position: { type: "number" },
            },
          },
          description: "Array of edit decisions",
        },
        addTransitions: {
          type: "boolean",
          description: "Whether to add transitions between clips",
        },
      },
      required: ["projectName", "edits"],
    },
  },
  {
    name: "export_project",
    description: "Export an iMovie project to a file",
    inputSchema: {
      type: "object",
      properties: {
        projectName: {
          type: "string",
          description: "Name of the iMovie project",
        },
        outputPath: {
          type: "string",
          description: "Path to export the video to",
        },
        quality: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Export quality",
        },
      },
      required: ["projectName", "outputPath"],
    },
  },
  {
    name: "auto_edit_videos",
    description: "Full pipeline: transcribe, analyze, and edit videos into a coherent story",
    inputSchema: {
      type: "object",
      properties: {
        videoPaths: {
          type: "array",
          items: { type: "string" },
          description: "Array of video file paths",
        },
        projectName: {
          type: "string",
          description: "Name for the iMovie project",
        },
        targetDuration: {
          type: "number",
          description: "Target duration in seconds",
        },
        style: {
          type: "string",
          enum: ["chronological", "thematic", "highlights"],
          description: "Editing style",
        },
        addTransitions: {
          type: "boolean",
          description: "Add transitions between clips",
        },
      },
      required: ["videoPaths", "projectName"],
    },
  },
];

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "scan_videos": {
        const watcher = new FolderWatcher(WATCH_FOLDER, async () => {});
        const videos = watcher.getAllVideos();
        
        return {
          content: [
            {
              type: "text",
              text: `Found ${videos.length} video(s) in ${WATCH_FOLDER}:\n\n${
                videos.map(v => `- ${v.name} (${(v.size / 1024 / 1024).toFixed(1)} MB)`).join("\n")
              }`,
            },
          ],
        };
      }

      case "transcribe_videos": {
        const { videoPaths } = args as { videoPaths: string[] };
        const results = await transcriptionService.transcribeMultiple(videoPaths);
        
        const output: string[] = [];
        for (const [path, result] of results) {
          output.push(`\n## ${path}`);
          output.push(`Full text: ${result.text}`);
          output.push(`Segments: ${result.segments.length}`);
          output.push("\nSegments with timestamps:");
          result.segments.forEach(seg => {
            output.push(`  [${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s]: ${seg.text}`);
          });
        }

        return {
          content: [
            {
              type: "text",
              text: output.join("\n"),
            },
          ],
        };
      }

      case "analyze_story": {
        const { transcripts, targetDuration, style, focusTopics } = args as {
          transcripts: Record<string, { text: string; segments: any[] }>;
          targetDuration?: number;
          style?: "chronological" | "thematic" | "highlights";
          focusTopics?: string[];
        };

        const transcriptMap = new Map(Object.entries(transcripts).map(([k, v]) => [
          k,
          { filePath: k, fullText: v.text, segments: v.segments }
        ]));

        const analysis = await storyAnalyzer.analyzeStory(transcriptMap, {
          targetDuration,
          style,
          focusTopics,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      }

      case "create_imovie_project": {
        const { name } = args as { name: string };
        await imovieController.createProject(name);
        
        return {
          content: [
            {
              type: "text",
              text: `Created iMovie project: "${name}"`,
            },
          ],
        };
      }

      case "apply_edits": {
        const { projectName, edits, addTransitions } = args as {
          projectName: string;
          edits: any[];
          addTransitions?: boolean;
        };

        await imovieController.applyEdits(projectName, edits, {
          addTransitions,
        });

        return {
          content: [
            {
              type: "text",
              text: `Applied ${edits.length} edits to project "${projectName}"`,
            },
          ],
        };
      }

      case "export_project": {
        const { projectName, outputPath, quality } = args as {
          projectName: string;
          outputPath: string;
          quality?: "high" | "medium" | "low";
        };

        await imovieController.exportProject(projectName, outputPath, quality);

        return {
          content: [
            {
              type: "text",
              text: `Exported "${projectName}" to ${outputPath}`,
            },
          ],
        };
      }

      case "auto_edit_videos": {
        const { videoPaths, projectName, targetDuration, style, addTransitions } = args as {
          videoPaths: string[];
          projectName: string;
          targetDuration?: number;
          style?: "chronological" | "thematic" | "highlights";
          addTransitions?: boolean;
        };

        // Step 1: Transcribe
        console.log("Step 1: Transcribing videos...");
        const transcripts = await transcriptionService.transcribeMultiple(videoPaths);
        
        // Step 2: Analyze story
        console.log("Step 2: Analyzing story...");
        const transcriptMap = new Map();
        for (const [path, result] of transcripts) {
          transcriptMap.set(path, {
            filePath: path,
            fullText: result.text,
            segments: result.segments,
          });
        }
        
        const analysis = await storyAnalyzer.analyzeStory(transcriptMap, {
          targetDuration,
          style,
        });

        // Step 3: Apply edits
        console.log("Step 3: Creating iMovie project...");
        const edits = analysis.segments.map((seg, index) => ({
          sourceVideo: seg.sourceVideo,
          startTime: seg.startTime,
          endTime: seg.endTime,
          position: index,
        }));

        await imovieController.applyEdits(projectName, edits, {
          addTransitions,
        });

        return {
          content: [
            {
              type: "text",
              text: `✅ Auto-edit complete!\n\n**Story: ${analysis.title}**\n${analysis.summary}\n\nCreated project "${projectName}" with ${edits.length} clips (${analysis.totalDuration.toFixed(1)}s total)\n\nThemes: ${analysis.themes.join(", ")}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("iMovie MCP Server running on stdio");
}

main().catch(console.error);

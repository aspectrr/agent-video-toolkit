# iMovie MCP Server

An MCP (Model Context Protocol) server that enables AI-powered video editing with iMovie on macOS. Drop videos in a folder, ask an AI to create a coherent story, and watch it automatically edit in iMovie.

## Features

- 📁 **Folder Watching**: Automatically detects new videos in a watch folder
- 🎙️ **Transcription**: Uses OpenAI Whisper for accurate speech-to-text with timestamps
- 🧠 **AI Story Analysis**: GPT-4o analyzes transcripts and creates compelling narratives
- 🎬 **iMovie Automation**: Controls iMovie via AppleScript to execute edits
- ✨ **Smart Editing**: Automatically trims, arranges, and adds transitions

## Installation

### Prerequisites

- macOS with iMovie installed
- Node.js 18+
- ffmpeg (`brew install ffmpeg`)
- OpenAI API key

### Setup

1. Clone this repository:
```bash
git clone <repo-url>
cd imovie-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Set environment variables:
```bash
export OPENAI_API_KEY="your-key-here"
export IMOVIE_WATCH_FOLDER="$HOME/Movies/iMovie MCP Input"  # optional, defaults to ~/Movies/iMovie MCP Input
```

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "imovie": {
      "command": "node",
      "args": ["/path/to/imovie-mcp-server/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

## Available Tools

### 1. `scan_videos`
Scan the watch folder for video files.

### 2. `transcribe_videos`
Transcribe videos using Whisper API with word-level timestamps.

**Parameters:**
- `videoPaths`: Array of video file paths

### 3. `analyze_story`
Analyze transcripts and create a coherent storyline.

**Parameters:**
- `transcripts`: Map of video paths to transcription data
- `targetDuration`: Target duration in seconds (optional)
- `style`: `"chronological"`, `"thematic"`, or `"highlights"` (optional)
- `focusTopics`: Array of topics to focus on (optional)

### 4. `create_imovie_project`
Create a new iMovie project.

**Parameters:**
- `name`: Project name

### 5. `apply_edits`
Apply edit decisions to create the final video.

**Parameters:**
- `projectName`: iMovie project name
- `edits`: Array of edit decisions with sourceVideo, startTime, endTime, position
- `addTransitions`: Whether to add transitions (optional)

### 6. `export_project`
Export an iMovie project to a file.

**Parameters:**
- `projectName`: iMovie project name
- `outputPath`: Export destination
- `quality`: `"high"`, `"medium"`, or `"low"` (optional)

### 7. `auto_edit_videos` ⭐
**Full pipeline**: Transcribe → Analyze → Edit in one command.

**Parameters:**
- `videoPaths`: Array of video file paths
- `projectName`: Name for the iMovie project
- `targetDuration`: Target duration in seconds (optional)
- `style`: Editing style (optional)
- `addTransitions`: Add transitions between clips (optional)

## Example Workflow

1. **Drop videos** in `~/Movies/iMovie MCP Input/`

2. **Ask Claude:**
   > "I just dropped 5 interview videos in my watch folder. Can you create a 3-minute highlight reel that tells a story about my startup journey?"

3. **Claude will:**
   - Scan for videos
   - Transcribe each one
   - Analyze the content
   - Create an iMovie project
   - Trim and arrange clips
   - Add transitions
   - Export the final video

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Videos    │────▶│  Transcribe  │────▶│   Analyze   │
│   Folder    │     │  (Whisper)   │     │  (GPT-4o)   │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                                         Edit Decisions
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Export    │◀────│    iMovie    │◀────│   Execute   │
│   Video     │     │  (AppleScript)│     │   (MCP)     │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Limitations

- iMovie's AppleScript support is limited compared to Final Cut Pro
- Some advanced editing features may not be available
- Requires macOS (iMovie is Mac-only)
- iMovie must be installed and accessible

## Future Enhancements

- [ ] Support for image overlays and B-roll
- [ ] Background music selection
- [ ] Custom title templates
- [ ] Integration with other video editors (Final Cut Pro, DaVinci Resolve)
- [ ] Real-time preview before export
- [ ] Custom transition effects

## License

MIT

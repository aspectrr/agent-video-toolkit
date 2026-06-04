import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

export interface VideoClip {
  filePath: string;
  startTime?: number; // in seconds
  endTime?: number;   // in seconds
}

export interface EditDecision {
  sourceVideo: string;
  startTime: number;
  endTime: number;
  position: number; // position in final timeline
}

export class iMovieController {
  /**
   * Execute AppleScript command
   */
  private async executeAppleScript(script: string): Promise<string> {
    const escapedScript = script.replace(/"/g, '\\"');
    const cmd = `osascript -e "${escapedScript}"`;
    
    try {
      const { stdout } = await execAsync(cmd);
      return stdout.trim();
    } catch (error) {
      throw new Error(`AppleScript execution failed: ${error}`);
    }
  }

  /**
   * Check if iMovie is running
   */
  async isRunning(): Promise<boolean> {
    try {
      const script = `tell application "System Events" to return name of processes contains "iMovie"`;
      const result = await this.executeAppleScript(script);
      return result === "true";
    } catch {
      return false;
    }
  }

  /**
   * Launch iMovie
   */
  async launch(): Promise<void> {
    const script = `tell application "iMovie" to activate`;
    await this.executeAppleScript(script);
    // Wait for iMovie to fully launch
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  /**
   * Create a new project
   */
  async createProject(name: string): Promise<void> {
    const script = `
      tell application "iMovie"
        activate
        set newProject to make new project
        set name of newProject to "${name}"
        return name of newProject
      end tell
    `;
    await this.executeAppleScript(script);
  }

  /**
   * Import media file into iMovie
   */
  async importMedia(filePath: string, projectName: string): Promise<string> {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const script = `
      tell application "iMovie"
        set theProject to project "${projectName}"
        set importedClip to import file "${filePath}" to theProject
        return name of importedClip
      end tell
    `;
    
    return await this.executeAppleScript(script);
  }

  /**
   * Add clip to timeline at specific position
   */
  async addToTimeline(
    projectName: string,
    clipName: string,
    startTime: number,
    endTime: number,
    position: number
  ): Promise<void> {
    const script = `
      tell application "iMovie"
        set theProject to project "${projectName}"
        set theClip to clip clipName of theProject
        -- Add clip to timeline at position
        add theClip to timeline of theProject at position ${position}
      end tell
    `;
    await this.executeAppleScript(script);
  }

  /**
   * Add transition between clips
   */
  async addTransition(
    projectName: string,
    transitionType: "cross dissolve" | "fade" | "wipe" | "slide",
    position: number
  ): Promise<void> {
    const script = `
      tell application "iMovie"
        set theProject to project "${projectName}"
        add transition "${transitionType}" to timeline of theProject at position ${position}
      end tell
    `;
    await this.executeAppleScript(script);
  }

  /**
   * Add text overlay/title
   */
  async addTitle(
    projectName: string,
    text: string,
    position: number,
    duration: number
  ): Promise<void> {
    const script = `
      tell application "iMovie"
        set theProject to project "${projectName}"
        set newTitle to make new title with properties {text:"${text}"}
        add newTitle to timeline of theProject at position ${position}
      end tell
    `;
    await this.executeAppleScript(script);
  }

  /**
   * Add image overlay (picture-in-picture)
   */
  async addImageOverlay(
    projectName: string,
    imagePath: string,
    position: number,
    duration: number
  ): Promise<void> {
    const script = `
      tell application "iMovie"
        set theProject to project "${projectName}"
        set theImage to import file "${imagePath}" to theProject
        add theImage to timeline of theProject at position ${position}
      end tell
    `;
    await this.executeAppleScript(script);
  }

  /**
   * Export project
   */
  async exportProject(
    projectName: string,
    outputPath: string,
    quality: "high" | "medium" | "low" = "high"
  ): Promise<void> {
    const script = `
      tell application "iMovie"
        set theProject to project "${projectName}"
        export theProject to file "${outputPath}" with properties {quality:"${quality}"}
      end tell
    `;
    await this.executeAppleScript(script);
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<string[]> {
    const script = `
      tell application "iMovie"
        set projectNames to {}
        repeat with p in projects
          set end of projectNames to name of p
        end repeat
        return projectNames
      end tell
    `;
    const result = await this.executeAppleScript(script);
    // Parse comma-separated list
    return result.split(", ").map(s => s.trim());
  }

  /**
   * Apply edit decisions to create final video
   */
  async applyEdits(
    projectName: string,
    edits: EditDecision[],
    options: {
      addTransitions?: boolean;
      transitionType?: "cross dissolve" | "fade" | "wipe";
    } = {}
  ): Promise<void> {
    // Create project
    await this.createProject(projectName);

    // Sort edits by position
    const sortedEdits = [...edits].sort((a, b) => a.position - b.position);

    // Import and add each clip
    for (let i = 0; i < sortedEdits.length; i++) {
      const edit = sortedEdits[i];
      
      // Import the media
      const clipName = await this.importMedia(edit.sourceVideo, projectName);
      
      // Add to timeline
      await this.addToTimeline(
        projectName,
        clipName,
        edit.startTime,
        edit.endTime,
        edit.position
      );

      // Add transition if requested and not last clip
      if (options.addTransitions && i < sortedEdits.length - 1) {
        await this.addTransition(
          projectName,
          options.transitionType || "cross dissolve",
          edit.position + 1
        );
      }
    }
  }
}

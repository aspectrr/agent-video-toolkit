import * as chokidar from "chokidar";
import * as path from "path";
import * as fs from "fs";

export interface VideoFile {
  path: string;
  name: string;
  size: number;
  createdAt: Date;
}

export type VideoHandler = (videos: VideoFile[]) => Promise<void>;

export class FolderWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private watchPath: string;
  private handler: VideoHandler;
  private supportedFormats = [".mp4", ".mov", ".m4v", ".avi", ".mkv"];

  constructor(watchPath: string, handler: VideoHandler) {
    this.watchPath = watchPath;
    this.handler = handler;
  }

  /**
   * Start watching the folder
   */
  start(): void {
    console.log(`Starting folder watcher for: ${this.watchPath}`);

    // Ensure directory exists
    if (!fs.existsSync(this.watchPath)) {
      console.log(`Creating watch directory: ${this.watchPath}`);
      fs.mkdirSync(this.watchPath, { recursive: true });
    }

    this.watcher = chokidar.watch(this.watchPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: false, // Process existing files on start
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    this.watcher
      .on("add", (filePath) => this.handleFile(filePath))
      .on("change", (filePath) => this.handleFile(filePath))
      .on("unlink", (filePath) => console.log(`File removed: ${filePath}`))
      .on("error", (error) => console.error("Watcher error:", error))
      .on("ready", () => console.log("Initial scan complete. Ready for changes"));
  }

  /**
   * Stop watching
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log("Folder watcher stopped");
    }
  }

  /**
   * Handle a file event
   */
  private async handleFile(filePath: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();
    
    if (!this.supportedFormats.includes(ext)) {
      return; // Skip non-video files
    }

    try {
      const stats = fs.statSync(filePath);
      
      // Wait a bit to ensure file is fully written
      await new Promise(resolve => setTimeout(resolve, 1000));

      const videoFile: VideoFile = {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        createdAt: stats.birthtime,
      };

      console.log(`New video detected: ${videoFile.name} (${this.formatBytes(videoFile.size)})`);
      
      // Get all videos in folder and process
      const allVideos = this.getAllVideos();
      await this.handler(allVideos);
    } catch (error) {
      console.error(`Error handling file ${filePath}:`, error);
    }
  }

  /**
   * Get all video files in the watch directory
   */
  getAllVideos(): VideoFile[] {
    if (!fs.existsSync(this.watchPath)) {
      return [];
    }

    const files = fs.readdirSync(this.watchPath);
    const videos: VideoFile[] = [];

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (this.supportedFormats.includes(ext)) {
        const filePath = path.join(this.watchPath, file);
        try {
          const stats = fs.statSync(filePath);
          videos.push({
            path: filePath,
            name: file,
            size: stats.size,
            createdAt: stats.birthtime,
          });
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
        }
      }
    }

    // Sort by creation date (oldest first)
    return videos.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Move processed video to done folder
   */
  moveToDone(videoPath: string): void {
    const doneDir = path.join(this.watchPath, "done");
    if (!fs.existsSync(doneDir)) {
      fs.mkdirSync(doneDir, { recursive: true });
    }

    const fileName = path.basename(videoPath);
    const destPath = path.join(doneDir, fileName);
    
    fs.renameSync(videoPath, destPath);
    console.log(`Moved ${fileName} to done folder`);
  }
}

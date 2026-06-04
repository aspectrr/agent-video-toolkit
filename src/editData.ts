export interface Clip {
  id: string;
  file: string;
  durationInSeconds: number;
  label: string;
}

export interface TaskItem {
  text: string;
  /** Clip index at which this task appears */
  appearAtClip: number;
}

export const clips: Clip[] = [
  {
    id: "intro",
    file: "clips/clip-01-intro.mp4",
    durationInSeconds: 8.2,
    label: "Day two intro",
  },
  {
    id: "cold-email",
    file: "clips/clip-02-cold-email.mp4",
    durationInSeconds: 27.24,
    label: "Cold email story",
  },
  {
    id: "free-service-bridge",
    file: "clips/clip-02b-free-service.mp4",
    durationInSeconds: 9.78,
    label: "Free service for review bridge",
  },
  {
    id: "hormozy",
    file: "clips/clip-03-hormozy.mp4",
    durationInSeconds: 39.4,
    label: "Free service for review strategy",
  },
  {
    id: "upwork-strategy",
    file: "clips/clip-04-upwork-strategy.mp4",
    durationInSeconds: 50.7,
    label: "Upwork client finding strategy",
  },
  {
    id: "market-need",
    file: "clips/clip-05-market-need.mp4",
    durationInSeconds: 21.38,
    label: "Finding market need",
  },
  {
    id: "service-business",
    file: "clips/clip-06-service-business.mp4",
    durationInSeconds: 56.16,
    label: "Service business to startup path",
  },
  {
    id: "followup",
    file: "clips/clip-07-followup.mp4",
    durationInSeconds: 15.28,
    label: "Following up with prospect",
  },
  {
    id: "pipeline-plan",
    file: "clips/clip-08-pipeline-plan.mp4",
    durationInSeconds: 52.54,
    label: "Building the pipeline",
  },
  {
    id: "upwork-agent",
    file: "clips/clip-09-upwork-agent.mp4",
    durationInSeconds: 39.96,
    label: "Upwork scanning agent plan",
  },
  {
    id: "scraping",
    file: "clips/clip-10-scraping.mp4",
    durationInSeconds: 73.94,
    label: "Scraping challenges",
  },
  {
    id: "cloudflare",
    file: "clips/clip-11-cloudflare.mp4",
    durationInSeconds: 157.74,
    label: "Cloudflare and browser tech",
  },
  {
    id: "back-agent",
    file: "clips/clip-12-back-agent.mp4",
    durationInSeconds: 18.82,
    label: "Back to work on agent",
  },
  {
    id: "day-job",
    file: "clips/clip-13-day-job.mp4",
    durationInSeconds: 39.54,
    label: "Day job context",
  },
  {
    id: "freedom",
    file: "clips/clip-14-freedom.mp4",
    durationInSeconds: 24.72,
    label: "Freedom goal",
  },
  {
    id: "managed-agents-intro",
    file: "clips/clip-15-managed-agents.mp4",
    durationInSeconds: 66.48,
    label: "Managed agents SDK vision",
  },
  {
    id: "agents-goal",
    file: "clips/clip-16-agents-goal.mp4",
    durationInSeconds: 33.86,
    label: "Managed agents is the goal",
  },
  {
    id: "pi-agents",
    file: "clips/clip-17-pi-agents.mp4",
    durationInSeconds: 52.12,
    label: "Pi for managed agents",
  },
  {
    id: "extensible",
    file: "clips/clip-18-extensible.mp4",
    durationInSeconds: 36.34,
    label: "Extensible software",
  },
  {
    id: "extensions",
    file: "clips/clip-19-extensions.mp4",
    durationInSeconds: 118.68,
    label: "Managed agents with extensions",
  },
];

/** Tasks appear as relevant topics come up in the video */
export const tasks: TaskItem[] = [
  { text: "Follow up with cold email prospect", appearAtClip: 1 },
  { text: "Offer free work for review", appearAtClip: 2 },
  { text: "Find clients via Upwork", appearAtClip: 4 },
  { text: "Schedule meeting with prospect", appearAtClip: 6 },
  { text: "Build cold email automation", appearAtClip: 7 },
  { text: "Build Upwork scraping agent", appearAtClip: 8 },
  { text: "Solve Cloudflare / scraping issues", appearAtClip: 10 },
  { text: "Quit 9-5, go independent", appearAtClip: 12 },
  { text: "Explore managed agents SDK", appearAtClip: 14 },
  { text: "Build extensions for agents", appearAtClip: 17 },
];

export const FPS = 30;

export function clipDurationFrames(clip: Clip): number {
  return Math.round(clip.durationInSeconds * FPS);
}

export function totalFrames(): number {
  return clips.reduce((sum, clip) => sum + clipDurationFrames(clip), 0);
}

export function getClipFrameOffsets(): number[] {
  const offsets: number[] = [];
  let cumulative = 0;
  for (const clip of clips) {
    offsets.push(cumulative);
    cumulative += clipDurationFrames(clip);
  }
  return offsets;
}

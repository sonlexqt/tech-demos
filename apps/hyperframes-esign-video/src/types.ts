export type FrameCompare = {
  timeSec: number;
  committedSha256: string;
  rerenderSha256: string | null;
  match: boolean | null;
};

export type DeterminismReport = {
  hyperframes: string;
  createdAt: string;
  notes: string[];
  videos: Array<{
    id: string;
    committedPath: string;
    committedSha256: string;
    rerenderPath: string | null;
    rerenderSha256: string | null;
    containerMatch: boolean | null;
    frames: FrameCompare[];
    skippedReason?: string;
  }>;
};

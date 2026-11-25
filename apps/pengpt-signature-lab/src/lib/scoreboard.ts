const KEY = "pengpt-signature-lab.scoreboard.v1";

export type BlindTrial = {
  volunteerId: string;
  displayName: string;
  leftWasReal: boolean;
  guessLeftIsReal: boolean;
  correct: boolean;
  at: string;
};

export type Scoreboard = {
  trials: BlindTrial[];
};

export function loadScoreboard(): Scoreboard {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { trials: [] };
    const parsed = JSON.parse(raw) as Scoreboard;
    if (!Array.isArray(parsed.trials)) return { trials: [] };
    return parsed;
  } catch {
    return { trials: [] };
  }
}

export function saveScoreboard(board: Scoreboard): void {
  localStorage.setItem(KEY, JSON.stringify(board));
}

export function recordTrial(trial: BlindTrial): Scoreboard {
  const board = loadScoreboard();
  board.trials.push(trial);
  saveScoreboard(board);
  return board;
}

export function resetScoreboard(): Scoreboard {
  const board = { trials: [] };
  saveScoreboard(board);
  return board;
}

export function summarize(board: Scoreboard): {
  n: number;
  correct: number;
  accuracy: number;
  byVolunteer: Record<string, { n: number; correct: number }>;
} {
  const byVolunteer: Record<string, { n: number; correct: number }> = {};
  let correct = 0;
  for (const t of board.trials) {
    if (t.correct) correct += 1;
    const row = (byVolunteer[t.volunteerId] ??= { n: 0, correct: 0 });
    row.n += 1;
    if (t.correct) row.correct += 1;
  }
  const n = board.trials.length;
  return { n, correct, accuracy: n ? correct / n : 0, byVolunteer };
}

export function downloadScoreboard(board: Scoreboard): void {
  const blob = new Blob([JSON.stringify(board, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pengpt-signature-lab-scoreboard.json";
  a.click();
  URL.revokeObjectURL(url);
}

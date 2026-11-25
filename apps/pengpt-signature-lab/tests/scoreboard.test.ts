import { describe, expect, test } from "bun:test";
import { summarize, type Scoreboard } from "../src/lib/scoreboard";

describe("scoreboard summarize", () => {
  test("empty board", () => {
    const s = summarize({ trials: [] });
    expect(s.n).toBe(0);
    expect(s.accuracy).toBe(0);
  });

  test("per-volunteer tallies", () => {
    const board: Scoreboard = {
      trials: [
        {
          volunteerId: "vol-a",
          displayName: "A",
          leftWasReal: true,
          guessLeftIsReal: true,
          correct: true,
          at: "t",
        },
        {
          volunteerId: "vol-a",
          displayName: "A",
          leftWasReal: false,
          guessLeftIsReal: true,
          correct: false,
          at: "t",
        },
        {
          volunteerId: "vol-b",
          displayName: "B",
          leftWasReal: true,
          guessLeftIsReal: true,
          correct: true,
          at: "t",
        },
      ],
    };
    const s = summarize(board);
    expect(s.n).toBe(3);
    expect(s.correct).toBe(2);
    expect(s.byVolunteer["vol-a"]).toEqual({ n: 2, correct: 1 });
    expect(s.byVolunteer["vol-b"]).toEqual({ n: 1, correct: 1 });
  });
});

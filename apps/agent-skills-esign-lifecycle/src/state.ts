import type { PersonaId, StageId, TabId } from "./types";

export interface AppState {
  tab: TabId;
  stage: StageId;
  persona: PersonaId;
  catcherId: string | null;
  seenStages: StageId[];
  blocked: string[];
}

export const initialState = (): AppState => ({
  tab: "lifecycle",
  stage: "define",
  persona: "all",
  catcherId: null,
  seenStages: ["define"],
  blocked: [],
});

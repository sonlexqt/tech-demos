import { rationalizations } from "./data/rationalizations";
import { stages } from "./data/stages";
import { initialState } from "./state";
import type { PersonaId, StageId, TabId } from "./types";
import { render } from "./ui/render";
import "./styles.css";

const mount = document.querySelector<HTMLDivElement>("#app");
if (!mount) throw new Error("#app missing");
const root = mount;

const stageIds = new Set(stages.map((s) => s.id));
const personaIds = new Set<PersonaId>(["all", "staff", "qa", "security", "webperf"]);
const excuseIds = new Set(rationalizations.map((r) => r.id));

let state = initialState();

function paint(): void {
  root.innerHTML = render(state);
}

root.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-tab], [data-stage], [data-persona], [data-excuse]");
  if (!target) return;

  const tab = target.dataset.tab;
  if (tab === "lifecycle" || tab === "compare") {
    state = { ...state, tab: tab as TabId };
    paint();
    return;
  }

  const stage = target.dataset.stage;
  if (stage && stageIds.has(stage as StageId)) {
    const id = stage as StageId;
    const seen = state.seenStages.includes(id) ? state.seenStages : [...state.seenStages, id];
    state = { ...state, tab: "lifecycle", stage: id, seenStages: seen, catcherId: null };
    paint();
    return;
  }

  const persona = target.dataset.persona;
  if (persona && personaIds.has(persona as PersonaId)) {
    state = { ...state, persona: persona as PersonaId };
    paint();
    return;
  }

  const excuse = target.dataset.excuse;
  if (excuse && excuseIds.has(excuse)) {
    const blocked = state.blocked.includes(excuse) ? state.blocked : [...state.blocked, excuse];
    state = { ...state, catcherId: excuse, blocked };
    paint();
    const card = root.querySelector(".block-card");
    card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});

paint();

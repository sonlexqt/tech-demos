import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/grain.css";
import "./styles/transitions.css";
import "./styles/catalog.css";
import "./styles/detail.css";
import { mountGrain } from "./grain";
import { startRouter } from "./router";
import { renderRoute } from "./render";

const app = document.querySelector<HTMLElement>("#app");
const grain = document.querySelector<HTMLElement>("[data-grain]");

if (grain) {
  mountGrain(grain);
}

if (app) {
  startRouter((route) => renderRoute(route, app));
}

import { boot } from "./app";
import "./style.css";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app missing");
void boot(root);

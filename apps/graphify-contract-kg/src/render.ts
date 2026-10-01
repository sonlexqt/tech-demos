import type { GraphEdge, LaidOutNode, NodeKind, PathHit } from "./types";

const KIND_CLASS: Record<NodeKind, string> = {
  party: "n-party",
  document: "n-document",
  clause: "n-clause",
  obligation: "n-obligation",
  term: "n-term",
  exhibit: "n-exhibit",
};

const R: Record<NodeKind, number> = {
  party: 22,
  document: 20,
  clause: 16,
  obligation: 16,
  term: 15,
  exhibit: 16,
};

export interface GraphViewHandlers {
  onNode(id: string): void;
  onEdge(id: string): void;
}

export class GraphView {
  private svg: SVGSVGElement;
  private root: SVGGElement;
  private handlers: GraphViewHandlers;
  private nodes: LaidOutNode[] = [];
  private edges: GraphEdge[] = [];
  private hiddenKinds = new Set<NodeKind>();
  private scale = 1;
  private tx = 0;
  private ty = 12;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  constructor(svg: SVGSVGElement, handlers: GraphViewHandlers) {
    this.svg = svg;
    this.handlers = handlers;
    this.root = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.root.setAttribute("class", "graph-root");
    this.svg.append(this.root);
    this.svg.addEventListener("wheel", this.onWheel, { passive: false });
    this.svg.addEventListener("pointerdown", this.onPointerDown);
    this.svg.addEventListener("pointermove", this.onPointerMove);
    this.svg.addEventListener("pointerup", this.onPointerUp);
    this.svg.addEventListener("pointerleave", this.onPointerUp);
  }

  setData(nodes: LaidOutNode[], edges: GraphEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.draw();
  }

  setHiddenKinds(kinds: Set<NodeKind>) {
    this.hiddenKinds = kinds;
    this.draw();
  }

  private nodeMap() {
    return new Map(this.nodes.map((n) => [n.id, n]));
  }

  private visible(id: string) {
    const node = this.nodeMap().get(id);
    return node ? !this.hiddenKinds.has(node.kind) : false;
  }

  private applyTransform() {
    this.root.setAttribute("transform", `translate(${this.tx} ${this.ty}) scale(${this.scale})`);
  }

  private onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.92 : 1.08;
    const next = Math.min(2.2, Math.max(0.55, this.scale * delta));
    const rect = this.svg.getBoundingClientRect();
    const cx = event.clientX - rect.left;
    const cy = event.clientY - rect.top;
    this.tx = cx - ((cx - this.tx) * next) / this.scale;
    this.ty = cy - ((cy - this.ty) * next) / this.scale;
    this.scale = next;
    this.applyTransform();
  };

  private onPointerDown = (event: PointerEvent) => {
    if ((event.target as Element).closest(".hit, .node")) return;
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.svg.classList.add("is-panning");
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragging) return;
    this.tx += event.clientX - this.lastX;
    this.ty += event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.applyTransform();
  };

  private onPointerUp = () => {
    this.dragging = false;
    this.svg.classList.remove("is-panning");
  };

  private curve(a: LaidOutNode, b: LaidOutNode) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const bow = Math.min(48, 14 + len * 0.08);
    const cx = mx - (dy / len) * bow;
    const cy = my + (dx / len) * bow;
    return { d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`, cx, cy };
  }

  draw() {
    this.root.replaceChildren();
    this.applyTransform();
    const byId = this.nodeMap();

    const edgeLayer = el("g", { class: "edges" });
    for (const edge of this.edges) {
      if (!this.visible(edge.source) || !this.visible(edge.target)) continue;
      const a = byId.get(edge.source);
      const b = byId.get(edge.target);
      if (!a || !b) continue;
      const { d } = this.curve(a, b);
      const group = el("g", { class: `edge e-${edge.confidence.toLowerCase()}`, "data-id": edge.id });
      const hit = el("path", { d, class: "hit" });
      const vis = el("path", { d, class: "stroke" });
      group.append(hit, vis);
      hit.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this.handlers.onEdge(edge.id);
      });
      edgeLayer.append(group);
    }
    this.root.append(edgeLayer);

    const nodeLayer = el("g", { class: "nodes" });
    for (const node of this.nodes) {
      if (this.hiddenKinds.has(node.kind)) continue;
      const r = R[node.kind];
      const group = el("g", {
        class: `node ${KIND_CLASS[node.kind]}`,
        "data-id": node.id,
        transform: `translate(${node.x} ${node.y})`,
      });
      const circle = el("circle", { r: String(r), class: "disc" });
      const label = el("text", { class: "label", y: String(r + 14) });
      label.textContent = node.label;
      group.append(circle, label);
      group.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this.handlers.onNode(node.id);
      });
      nodeLayer.append(group);
    }
    this.root.append(nodeLayer);
  }

  highlight(hit: PathHit | null, selected?: { type: "node" | "edge"; id: string }) {
    this.root.querySelectorAll(".node").forEach((n) => {
      const id = n.getAttribute("data-id") ?? "";
      n.classList.toggle("is-path", !!hit?.nodeIds.has(id));
      n.classList.toggle("is-current", hit?.currentNodeId === id);
      n.classList.toggle("is-selected", selected?.type === "node" && selected.id === id);
      n.classList.toggle("is-dim", !!hit && !hit.nodeIds.has(id));
    });
    this.root.querySelectorAll(".edge").forEach((e) => {
      const id = e.getAttribute("data-id") ?? "";
      e.classList.toggle("is-path", !!hit?.edgeIds.has(id));
      e.classList.toggle("is-current", hit?.currentEdgeId === id);
      e.classList.toggle("is-selected", selected?.type === "edge" && selected.id === id);
      e.classList.toggle("is-dim", !!hit && !hit.edgeIds.has(id));
    });
  }
}

function el(name: string, attrs: Record<string, string>) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

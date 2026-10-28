import { playWipe } from "./transitions";

export type Route =
  | { name: "catalog" }
  | { name: "about" }
  | { name: "item"; slug: string }
  | { name: "missing" };

export function parsePath(pathname: string): Route {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "") return { name: "catalog" };
  if (path === "/about") return { name: "about" };
  const item = path.match(/^\/item\/([a-z0-9-]+)$/);
  if (item) return { name: "item", slug: item[1] };
  return { name: "missing" };
}

export function startRouter(render: (route: Route) => void): void {
  const apply = (path: string) => {
    render(parsePath(path));
    const heading = document.querySelector<HTMLElement>("[data-focus-title]");
    heading?.focus();
  };

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>("a[data-nav]");
    if (!link) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target === "_blank") return;

    const url = new URL(link.href, window.location.origin);
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    if (url.pathname === window.location.pathname) return;

    void playWipe(() => {
      history.pushState({}, "", url.pathname);
      apply(url.pathname);
    });
  });

  window.addEventListener("popstate", () => {
    void playWipe(() => apply(window.location.pathname));
  });

  apply(window.location.pathname);
}

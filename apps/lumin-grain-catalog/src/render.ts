import { items, itemBySlug, type CatalogItem } from "./data";
import { renderStill } from "./stills";
import type { Route } from "./router";

function shell(main: string, title: string): string {
  document.title = title;
  return `
    <header class="site-nav">
      <a class="wordmark" data-nav href="/">Lumin</a>
      <nav class="site-nav__links" aria-label="Primary">
        <a data-nav href="/">Catalog</a>
        <a data-nav href="/about">About</a>
      </nav>
    </header>
    ${main}
    <footer class="site-foot">
      <p>Internal motion study · Lumin-themed · original build</p>
      <p>No third-party portfolio assets.</p>
    </footer>
  `;
}

function card(item: CatalogItem): string {
  return `
    <article class="card">
      <a class="card__link" data-nav href="/item/${item.slug}">
        <div class="card__still">${renderStill(item.still)}</div>
        <div class="card__meta">
          <span>${item.index}</span>
          <span>${item.dept}</span>
        </div>
        <div class="card__reveal">
          <h2>${item.title}</h2>
          <p>${item.dek}</p>
        </div>
      </a>
    </article>
  `;
}

function catalogPage(): string {
  const indexLine = items
    .map((item) => `<span>${item.index} ${item.title}</span>`)
    .join("<span class=\"hero-index__dot\" aria-hidden=\"true\">·</span>");

  return shell(
    `
    <main>
      <section class="hero">
        <p class="eyebrow">Internal showcase · Volume 01 · 2026</p>
        <div class="hero__row">
          <h1 class="display" data-focus-title tabindex="-1">Lumin</h1>
          <p class="hero__spine">Grain / Catalog</p>
        </div>
        <p class="lede">
          A cinematic index of document work —
          <em>sign, redact, prove, find</em> —
          rebuilt from scratch for studying motion on internal Lumin surfaces.
        </p>
        <p class="hero-index">${indexLine}</p>
      </section>
      <section class="catalog" aria-label="Showcase catalog">
        ${items.map(card).join("")}
      </section>
    </main>
    `,
    "Lumin Grain Catalog",
  );
}

function itemPage(item: CatalogItem): string {
  const others = items
    .filter((entry) => entry.slug !== item.slug)
    .slice(0, 3)
    .map(
      (entry) => `
        <a class="related__link" data-nav href="/item/${entry.slug}">
          <span>${entry.index}</span>
          <strong>${entry.title}</strong>
        </a>
      `,
    )
    .join("");

  return shell(
    `
    <main class="detail">
      <p class="eyebrow">
        <a data-nav href="/">Return to catalog</a>
        <span aria-hidden="true"> / </span>
        ${item.dept} · ${item.duration}
      </p>
      <h1 class="detail__title" data-focus-title tabindex="-1">${item.title}</h1>
      <p class="detail__dek">${item.dek}</p>
      <figure class="detail__still">
        ${renderStill(item.still)}
        <figcaption>${item.index} · ${item.title}</figcaption>
      </figure>
      <div class="detail__copy">
        ${item.body.map((para) => `<p>${para}</p>`).join("")}
      </div>
      <aside class="related" aria-label="Other studies">
        ${others}
      </aside>
    </main>
    `,
    `${item.title} · Lumin Grain Catalog`,
  );
}

function aboutPage(): string {
  return shell(
    `
    <main class="about">
      <p class="eyebrow">Study notes</p>
      <h1 class="detail__title" data-focus-title tabindex="-1">About this catalog</h1>
      <div class="detail__copy">
        <p>
          This is an <strong>inspired-from-scratch</strong> Lumin-themed demo.
          It studies the <em>vibe</em> of a premium dark catalog — grain, type contrast,
          wipe reveals, cinematic cards — without fetching, scraping, or copying any
          third-party portfolio markup, CSS, JavaScript, fonts, or imagery.
        </p>
        <p>
          Content is fictional and Lumin-flavored: Sign request flow, MSA countersign,
          PDF redaction, Lumin ID credentials, clause search, and sibling studies.
          Stills are original SVG geometry. Fonts are Outfit and Cormorant Garamond (OFL).
        </p>
        <p>
          Built for internal motion/style research on Lumin surfaces. Not a mirror of
          luminpdf.com, and not a clone of any film-studio or freelance portfolio.
        </p>
      </div>
      <p class="about__back"><a data-nav href="/">Return to catalog</a></p>
    </main>
    `,
    "About · Lumin Grain Catalog",
  );
}

function missingPage(): string {
  return shell(
    `
    <main class="about">
      <h1 class="detail__title" data-focus-title tabindex="-1">Not in the catalog</h1>
      <p class="detail__dek">That reel is not on this reel.</p>
      <p class="about__back"><a data-nav href="/">Return to catalog</a></p>
    </main>
    `,
    "Not found · Lumin Grain Catalog",
  );
}

export function renderRoute(route: Route, mount: HTMLElement): void {
  if (route.name === "catalog") {
    mount.innerHTML = catalogPage();
    return;
  }
  if (route.name === "about") {
    mount.innerHTML = aboutPage();
    return;
  }
  if (route.name === "item") {
    const item = itemBySlug(route.slug);
    mount.innerHTML = item ? itemPage(item) : missingPage();
    return;
  }
  mount.innerHTML = missingPage();
}

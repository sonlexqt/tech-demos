import { escapeHtml } from "../lib/html";

export function renderCode(path: string, code: string): string {
  const highlighted = highlight(code);
  const lines = highlighted.split("\n");
  return `
    <figure class="code-block">
      <figcaption>${escapeHtml(path)}</figcaption>
      <pre><code>${lines
        .map(
          (line, i) =>
            `<span class="ln">${String(i + 1).padStart(2, " ")}</span>${line || " "}`,
        )
        .join("\n")}</code></pre>
    </figure>
  `;
}

function highlight(code: string): string {
  const escaped = escapeHtml(code);
  return escaped
    .replace(
      /(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g,
      '<span class="str">$1</span>',
    )
    .replace(
      /\b(import|export|from|function|return|const|let|type|interface|class|extends|implements|new|async|await|if|else|throw|typeof|undefined|null)\b/g,
      '<span class="kw">$1</span>',
    )
    .replace(
      /\b(string|number|boolean|Date|HTMLElement|Promise)\b/g,
      '<span class="ty">$1</span>',
    );
}

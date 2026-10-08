export function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function mdLite(src: string): string {
  return esc(src)
    .replaceAll(/^### (.+)$/gm, "<h4>$1</h4>")
    .replaceAll(/^## (.+)$/gm, "<h3>$1</h3>")
    .replaceAll(/^# (.+)$/gm, "<h2>$1</h2>")
    .replaceAll(/`([^`]+)`/g, "<code>$1</code>")
    .replaceAll(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replaceAll(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replaceAll(/(<li>.*<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`)
    .replaceAll(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replaceAll(/\n{2,}/g, "</p><p>")
    .replaceAll(/^/, "<p>")
    .replaceAll(/$/, "</p>")
    .replaceAll(/<p><\/p>/g, "")
    .replaceAll(/<p>(<h[2-4]>)/g, "$1")
    .replaceAll(/(<\/h[2-4]>)<\/p>/g, "$1")
    .replaceAll(/<p>(<ul>)/g, "$1")
    .replaceAll(/(<\/ul>)<\/p>/g, "$1")
    .replaceAll(/<p>(<pre>)/g, "$1")
    .replaceAll(/(<\/pre>)<\/p>/g, "$1");
}

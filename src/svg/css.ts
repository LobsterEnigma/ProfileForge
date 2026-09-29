/**
 * Drops the CSS a card doesn't use. Every card carries the styles for every weather, holiday,
 * trick and scene it *might* show; once the SVG is built, rules whose classes appear nowhere in
 * the markup, and keyframes no remaining rule animates with, are removed. Anything that isn't a
 * plain class rule (the theme's `.pf` variables, `@media` blocks) is always kept.
 */

interface Block {
  head: string;
  body: string;
}

/** Top-level `head{body}` blocks, with nested braces kept inside the body. */
function blocks(css: string): Block[] {
  const out: Block[] = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    let depth = 1;
    let j = open + 1;
    for (; j < css.length && depth > 0; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
    }
    out.push({ head: css.slice(i, open).trim(), body: css.slice(open + 1, j - 1) });
    i = j;
  }
  return out;
}

/** Whether a selector (a list of classes, maybe with descendants) can match the markup. */
function matches(selector: string, classes: Set<string>): boolean {
  const names = selector.match(/\.[\w-]+/g);
  // Not a class selector (`.pf *` still has `.pf`): keep it.
  if (!names || /[#[:]/.test(selector.replace(/\.[\w-]+/g, ""))) return true;
  return names.every((n) => classes.has(n.slice(1)));
}

export function pruneCss(css: string, markup: string): string {
  const classes = new Set<string>();
  for (const m of markup.matchAll(/class="([^"]*)"/g)) for (const c of m[1]!.split(/\s+/)) if (c) classes.add(c);

  const all = blocks(css);
  const kept = all.filter((b) => b.head.startsWith("@") || b.head.split(",").some((s) => matches(s.trim(), classes)));
  // Keyframes survive only if a kept rule (or an inline style in the markup) names them.
  const used = kept
    .filter((b) => !b.head.startsWith("@keyframes"))
    .map((b) => b.body)
    .join(";") + markup;
  return kept
    .filter((b) => {
      const name = b.head.match(/^@keyframes\s+([\w-]+)/)?.[1];
      return !name || new RegExp(`(?:animation(?:-name)?:\\s*|[\\s,])${name}(?![\\w-])`).test(used);
    })
    .map((b) => `${b.head}{${b.body}}`)
    .join("\n");
}

/** Prunes the `<style>` of a finished SVG against the rest of it. */
export function pruneSvgStyle(svg: string): string {
  const start = svg.indexOf("<style>");
  const end = svg.indexOf("</style>", start);
  if (start < 0 || end < 0) return svg;
  const css = svg.slice(start + 7, end);
  const markup = svg.slice(0, start) + svg.slice(end + 8);
  return `${svg.slice(0, start + 7)}${pruneCss(css, markup)}${svg.slice(end)}`;
}

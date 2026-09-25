import { themeCss } from "../themes.js";
import { escapeXml } from "./escape.js";

/** A small card shown in place of the widget, so a README never renders a broken image. */
export function renderErrorCard(message: string, hint?: string, theme?: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="pf" width="480" height="90" viewBox="0 0 480 90" role="img" aria-label="${escapeXml(message)}">
<style>${themeCss(theme)}
.t{font:700 15px 'Segoe UI',Ubuntu,sans-serif;fill:var(--pf-accent)}
.h{font:400 12px 'Segoe UI',Ubuntu,sans-serif;fill:var(--pf-muted)}</style>
<rect x=".5" y=".5" width="479" height="89" rx="10" style="fill:var(--pf-bg);stroke:var(--pf-border)"/>
<text x="24" y="40" class="t">ProfileForge · ${escapeXml(message)}</text>
${hint ? `<text x="24" y="62" class="h">${escapeXml(hint)}</text>` : ""}
</svg>`;
}

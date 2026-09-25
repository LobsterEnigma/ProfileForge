/**
 * Local playground: `npm run dev` → http://localhost:3000
 * Serves /api/pet exactly like Vercel does, plus a gallery of every mood × stage.
 */
import { createServer } from "node:http";
import { handleWidget } from "../src/handler.js";
import { MOODS, STAGES } from "../src/demo.js";
import { THEME_NAMES } from "../src/themes.js";

const PORT = Number(process.env.PORT ?? 3000);

function gallery(theme: string): string {
  const tabs = THEME_NAMES.map(
    (t) => `<a href="/?theme=${t}" class="${t === theme ? "on" : ""}">${t}</a>`,
  ).join("");
  const city = `<h2>city</h2><img src="/api/city?user=demo&theme=${theme}" width="800" height="260">`;
  const rows = STAGES.map(
    (stage) => `<h2>${stage}</h2><div class="row">${MOODS.map(
      (mood) => `<figure><img src="/api/pet?user=demo&stage=${stage}&mood=${mood}&theme=${theme}" width="480" height="190"><figcaption>${mood}</figcaption></figure>`,
    ).join("")}</div>`,
  ).join("");
  return `<!doctype html><meta charset="utf-8"><title>ProfileForge gallery</title>
<style>
body{font:14px system-ui;margin:24px;background:#f6f8fa;color:#1f2328}
@media (prefers-color-scheme:dark){body{background:#010409;color:#e6edf3}}
.row{display:flex;flex-wrap:wrap;gap:16px}figure{margin:0}figcaption{opacity:.6;margin-top:4px}
nav a{margin-right:12px;color:inherit}nav a.on{font-weight:700}
form{margin:16px 0}input{font:inherit;padding:4px 8px}
</style>
<h1>ProfileForge 🦀</h1>
<nav>${tabs}</nav>
<form onsubmit="event.preventDefault();const u=encodeURIComponent(this.u.value);document.getElementById('real').src='/api/pet?theme=${theme}&user='+u;document.getElementById('real-city').src='/api/city?theme=${theme}&user='+u">
  <input name="u" placeholder="github login"> <button>Render real user</button>
  <span style="opacity:.6">(needs GITHUB_TOKEN)</span>
</form>
<img id="real" alt=""> <img id="real-city" alt="">
${city}
${rows}`;
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const route = url.pathname.match(/^\/api\/(pet|city)$/);
  if (route) {
    const response = await handleWidget(route[1] as "pet" | "city", url, { GITHUB_TOKEN: process.env.GITHUB_TOKEN });
    res.writeHead(response.status, { ...Object.fromEntries(response.headers), "cache-control": "no-store" });
    res.end(await response.text());
    return;
  }
  if (url.pathname === "/zoom") {
    // /zoom?x=3&user=demo&mood=idle (or &widget=city) → the card blown up for inspecting pixels.
    const scale = Number(url.searchParams.get("x") ?? 3);
    const widget = url.searchParams.get("widget") === "city" ? "city" : "pet";
    url.searchParams.delete("x");
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(`<body style="margin:0;background:#888"><img src="/api/${widget}${url.search}" style="width:${(widget === "city" ? 800 : 480) * scale}px;image-rendering:pixelated">`);
    return;
  }
  if (url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(gallery(url.searchParams.get("theme") ?? "auto"));
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, () => console.log(`ProfileForge dev server → http://localhost:${PORT}`));

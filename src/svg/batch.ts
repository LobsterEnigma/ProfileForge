/**
 * Collects rectangles and emits one `<path>` per fill, which keeps scenes with
 * thousands of windows small. A rectangle may move relative to the one before (a closed
 * subpath leaves the pen at its start), so neighbours cost a few characters instead of
 * full coordinates.
 */
export class RectBatch {
  private rects = new Map<string, [number, number, number, number][]>();

  add(fill: string, x: number, y: number, w: number, h: number): this {
    const list = this.rects.get(fill) ?? [];
    list.push([x, y, w, h]);
    this.rects.set(fill, list);
    return this;
  }

  toString(): string {
    return [...this.rects]
      .map(([fill, list]) => {
        const attr = fill.startsWith("var(") ? `style="fill:${fill}"` : `fill="${fill}"`;
        return `<path ${attr} d="${pathData(list)}"/>`;
      })
      .join("");
  }
}

const num = (n: number) => String(Math.round(n * 1000) / 1000);

/** Rectangles as path data: each move absolute or relative to the rect before, whichever is shorter. */
export function pathData(list: readonly (readonly [number, number, number, number])[]): string {
  let d = "";
  let px = 0;
  let py = 0;
  list.forEach(([x, y, w, h], i) => {
    const abs = `M${num(x)} ${num(y)}`;
    const rel = `m${num(x - px)} ${num(y - py)}`;
    const move = i === 0 || abs.length <= rel.length ? abs : rel;
    d += `${move}h${num(w)}v${num(h)}h${num(-w)}z`;
    px = x;
    py = y;
  });
  return d;
}

/**
 * Like RectBatch, for many small rects of a few widths (windows): each is drawn as a vertical
 * stroke `w` wide, so a window costs a short relative move and a `v`, about half the bytes.
 * Grouped by colour and width.
 */
export class LineBatch {
  private lines = new Map<string, [number, number, number][]>();

  add(color: string, x: number, y: number, w: number, h: number): this {
    const key = `${color}|${w}`;
    const list = this.lines.get(key) ?? [];
    list.push([x + w / 2, y, h]);
    this.lines.set(key, list);
    return this;
  }

  toString(): string {
    return [...this.lines]
      .map(([key, list]) => {
        const [color, w] = key.split("|") as [string, string];
        const stroke = color.startsWith("var(") ? `style="stroke:${color}"` : `stroke="${color}"`;
        let d = "";
        let px = 0;
        let py = 0;
        list.forEach(([x, y, h], i) => {
          const abs = `M${num(x)} ${num(y)}`;
          const rel = `m${num(x - px)} ${num(y - py)}`;
          d += `${i === 0 || abs.length <= rel.length ? abs : rel}v${num(h)}`;
          px = x;
          py = y + h;
        });
        return `<path ${stroke} stroke-width="${w}" d="${d}"/>`;
      })
      .join("");
  }
}

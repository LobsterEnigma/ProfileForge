/**
 * Collects rectangles and emits one `<path>` per fill, which keeps scenes with
 * thousands of windows small.
 */
export class RectBatch {
  private paths = new Map<string, string[]>();

  add(fill: string, x: number, y: number, w: number, h: number): this {
    const segs = this.paths.get(fill) ?? [];
    segs.push(`M${x} ${y}h${w}v${h}h${-w}z`);
    this.paths.set(fill, segs);
    return this;
  }

  toString(): string {
    return [...this.paths]
      .map(([fill, segs]) => {
        const attr = fill.startsWith("var(") ? `style="fill:${fill}"` : `fill="${fill}"`;
        return `<path ${attr} d="${segs.join("")}"/>`;
      })
      .join("");
  }
}

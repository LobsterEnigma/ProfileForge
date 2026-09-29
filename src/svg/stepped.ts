/**
 * A band between two stepped edges as a single path: `top(x)` and `bottom(x)` are sampled every
 * `step` px from `x0`, and the band is drawn wherever `top` is defined. Much smaller than a
 * rect per column, which matters for hills, treelines, grass and surf.
 */
export function stepped(
  fill: string,
  x0: number,
  w: number,
  top: (x: number) => number | undefined,
  bottom: (x: number, top: number) => number,
  step = 2,
): string {
  let d = "";
  for (let start = 0; start < w; start += step) {
    if (top(start) === undefined) continue;
    let end = start;
    while (end + step < w && top(end + step) !== undefined) end += step;
    let y = top(start)!;
    let run = 0;
    d += `M${x0 + start} ${y}`;
    for (let x = start; x <= end; x += step) {
      const t = top(x)!;
      if (t !== y) {
        if (run) d += `h${run}`;
        d += `V${(y = t)}`;
        run = 0;
      }
      run += step;
    }
    d += `h${run}`;
    run = 0;
    for (let x = end; x >= start; x -= step) {
      const b = bottom(x, top(x)!);
      if (b !== y) {
        if (run) d += `h-${run}`;
        d += `V${(y = b)}`;
        run = 0;
      }
      run += step;
    }
    d += `h-${run}z`;
    start = end;
  }
  if (!d) return "";
  return fill.startsWith("var(") ? `<path style="fill:${fill}" d="${d}"/>` : `<path fill="${fill}" d="${d}"/>`;
}

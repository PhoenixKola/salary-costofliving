export type XY = { x: number; y: number };

export function scalePoints(
  values: number[],
  width: number,
  height: number,
  padY = 0,
  domain?: { min: number; max: number }
): XY[] {
  if (values.length === 0) return [];
  const min = domain?.min ?? Math.min(...values);
  const max = domain?.max ?? Math.max(...values);
  const span = max - min || 1;
  const innerH = height - padY * 2;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  return values.map((v, i) => ({
    x: values.length > 1 ? i * stepX : width / 2,
    y: padY + innerH - ((v - min) / span) * innerH
  }));
}

/** Smooth line through points (Catmull-Rom converted to cubic Béziers). */
export function smoothPath(pts: XY[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Line path closed down to the bottom edge, for gradient area fills. */
export function areaPath(pts: XY[], height: number): string {
  if (pts.length < 2) return "";
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${line} L ${last.x} ${height} L ${first.x} ${height} Z`;
}

/** Indices of ~n evenly spaced elements, always including first and last. */
export function tickIndices(length: number, n: number): number[] {
  if (length <= n) return Array.from({ length }, (_, i) => i);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(Math.round((i * (length - 1)) / (n - 1)));
  }
  return [...new Set(out)];
}

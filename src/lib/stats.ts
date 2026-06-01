// Tiny descriptive-statistics helpers. All pure, no deps.

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

export function weightedMean(xs: number[], ws: number[]): number {
  let n = 0, d = 0;
  for (let i = 0; i < xs.length; i++) { n += xs[i] * ws[i]; d += ws[i]; }
  return d ? n / d : 0;
}

export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

// Linear-interpolated quantile on an already-sortable copy.
export function quantile(xs: number[], q: number): number {
  if (!xs.length) return 0;
  const a = [...xs].sort((p, n) => p - n);
  const pos = (a.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  if (lo === hi) return a[lo];
  return a[lo] + (a[hi] - a[lo]) * (pos - lo);
}

export function median(xs: number[]): number {
  return quantile(xs, 0.5);
}

export function fiveNumber(xs: number[]) {
  return {
    min: xs.length ? Math.min(...xs) : 0,
    q1: quantile(xs, 0.25),
    median: quantile(xs, 0.5),
    q3: quantile(xs, 0.75),
    max: xs.length ? Math.max(...xs) : 0,
    n: xs.length,
  };
}

// Histogram bins. Integer metrics over a small range get one bin per value;
// otherwise ~`target` equal-width buckets. Returns chart-ready rows.
export function histogram(values: number[], target = 18): { label: string; mid: number; count: number }[] {
  if (!values.length) return [];
  const min = Math.min(...values), max = Math.max(...values);
  if (min === max) return [{ label: String(min), mid: min, count: values.length }];
  const allInt = values.every((v) => Number.isInteger(v));
  const range = max - min;
  if (allInt && range <= target * 1.5) {
    const counts: Record<number, number> = {};
    for (let v = min; v <= max; v++) counts[v] = 0;
    for (const v of values) counts[v]++;
    return Object.keys(counts).map(Number).sort((a, b) => a - b).map((v) => ({ label: String(v), mid: v, count: counts[v] }));
  }
  const width = range / target;
  const bins = Array.from({ length: target }, (_, i) => ({ lo: min + i * width, hi: min + (i + 1) * width, count: 0 }));
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= target) idx = target - 1;
    if (idx < 0) idx = 0;
    bins[idx].count++;
  }
  const dec = width < 1 ? 1 : 0;
  return bins.map((b) => ({ label: `${b.lo.toFixed(dec)}`, mid: (b.lo + b.hi) / 2, count: b.count }));
}

// Pearson correlation coefficient.
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs), my = mean(ys);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den ? num / den : 0;
}

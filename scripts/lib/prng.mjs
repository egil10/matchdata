// Deterministic PRNG (mulberry32) + sampling helpers.
// Everything in the data pipeline is seeded so output is fully reproducible.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  constructor(seed) {
    this.r = mulberry32(seed);
  }
  next() {
    return this.r();
  }
  float(min, max) {
    return min + (max - min) * this.r();
  }
  int(min, max) {
    // inclusive
    return Math.floor(this.float(min, max + 1));
  }
  bool(p = 0.5) {
    return this.r() < p;
  }
  pick(arr) {
    return arr[Math.floor(this.r() * arr.length)];
  }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // Box-Muller gaussian
  gauss(mean = 0, sd = 1) {
    let u = 0;
    let v = 0;
    while (u === 0) u = this.r();
    while (v === 0) v = this.r();
    const n = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + n * sd;
  }
  // Knuth Poisson
  poisson(lambda) {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= this.r();
    } while (p > L);
    return k - 1;
  }
  // Weighted pick: items + weight function
  weighted(items, weightFn) {
    const weights = items.map((it) => Math.max(0, weightFn(it)));
    const total = weights.reduce((s, w) => s + w, 0);
    if (total <= 0) return this.pick(items);
    let t = this.r() * total;
    for (let i = 0; i < items.length; i++) {
      t -= weights[i];
      if (t <= 0) return items[i];
    }
    return items[items.length - 1];
  }
  // Sample n distinct items (weighted, without replacement)
  sampleWeighted(items, n, weightFn) {
    const pool = items.slice();
    const out = [];
    while (out.length < n && pool.length) {
      const chosen = this.weighted(pool, weightFn);
      out.push(chosen);
      pool.splice(pool.indexOf(chosen), 1);
    }
    return out;
  }
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

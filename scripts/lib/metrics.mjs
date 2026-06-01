// Pure statistical metrics — faithful re-implementation of the kampdata.no
// methodology (Team Impact, +/-/90, weighted age, weighted P/K, table sort).
// Kept dependency-free so it can run in the generator and be unit-reasoned about.

export function round(x, d = 2) {
  if (!isFinite(x)) return 0;
  const f = Math.pow(10, d);
  return Math.round(x * f) / f;
}

export function mean(xs) {
  if (!xs.length) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

// Population standard deviation of xs around an arbitrary center.
export function stdevAround(xs, center) {
  if (xs.length < 1) return 0;
  const v = xs.reduce((s, x) => s + (x - center) * (x - center), 0) / xs.length;
  return Math.sqrt(v);
}

export function popStdev(xs) {
  return stdevAround(xs, mean(xs));
}

// Goal difference per 90 minutes while the player is on the pitch.
export function plusMinus90(onGF, onGA, minutes) {
  if (!minutes) return 0;
  return ((onGF - onGA) * 90) / minutes;
}

// Points from a set of {result: 'W'|'D'|'L'}.
export function pointsOf(results) {
  let w = 0;
  let d = 0;
  for (const r of results) {
    if (r === "W") w++;
    else if (r === "D") d++;
  }
  return w * 3 + d;
}

// Strength-weighted points-per-game (used for the MVP / weighted P/K metric).
// matches: [{ points, oppPpg, minutes }]
export function weightedPpg(matches) {
  let num = 0;
  let den = 0;
  for (const m of matches) {
    const share = m.minutes / 90;
    num += m.points * m.oppPpg * share;
    den += m.oppPpg * share;
  }
  return den > 0 ? num / den : 0;
}

// Minutes-weighted average age. entries: [{ age, minutes }]
export function weightedAge(entries) {
  let num = 0;
  let den = 0;
  for (const e of entries) {
    num += e.age * e.minutes;
    den += e.minutes;
  }
  return den > 0 ? num / den : 0;
}

// Team Impact for every qualified player on a team.
// players: [{ id, minutes, pm90 }]
// Returns Map<id, { perfZ, minZ, teamImpact, qualified }>
export function computeTeamImpact(players, teamMatches, teamMfPerMatch) {
  const qualifyMin = 0.2 * teamMatches * 90;
  const qualified = players.filter((p) => p.minutes >= qualifyMin);
  const out = new Map();

  const pm90s = qualified.map((p) => p.pm90);
  const minutes = qualified.map((p) => p.minutes);
  const sigmaPerf = stdevAround(pm90s, teamMfPerMatch);
  const meanMin = mean(minutes);
  const sigmaMin = popStdev(minutes);

  for (const p of players) {
    if (p.minutes < qualifyMin) {
      out.set(p.id, { perfZ: null, minZ: null, teamImpact: null, qualified: false });
      continue;
    }
    const perfZ = sigmaPerf > 0 ? (p.pm90 - teamMfPerMatch) / sigmaPerf : 0;
    const minZ = sigmaMin > 0 ? (p.minutes - meanMin) / sigmaMin : 0;
    out.set(p.id, {
      perfZ,
      minZ,
      teamImpact: perfZ + 0.5 * minZ,
      qualified: true,
    });
  }
  return out;
}

export function teamImpactTier(ti) {
  if (ti == null) return { label: "Ikke kvalifisert", tone: "muted" };
  if (ti >= 2) return { label: "Svært verdifull", tone: "elite" };
  if (ti >= 1) return { label: "Verdifull", tone: "good" };
  if (ti > -1) return { label: "Gjennomsnittlig", tone: "avg" };
  if (ti > -2) return { label: "Under snittet", tone: "low" };
  return { label: "Svak", tone: "bad" };
}

// Official table ordering: points, then goal difference, then goals scored.
export function tableCompare(a, b) {
  return (
    b.points - a.points ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    a.name.localeCompare(b.name, "nb")
  );
}

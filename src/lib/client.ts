"use client";
import { useEffect, useState } from "react";
import type { Gender } from "./types";

export interface CPlayer {
  id: string; n: string; tm: string; ts: string; ti: string; lg: string; ln: string;
  lv: number; g: Gender; ds: "real" | "modeled"; pos: string; pg: string;
  by: number; age: number; nat: 0 | 1; caps: number; fy: string;
  k: number; st: number; sub: number; min: number; gls: number; pts: number;
  w: number; d: number; l: number; wppg: number; cap: 0 | 1;
  ppg: number; pm: number; tiv: number | null; y: number; r: number; q: 0 | 1;
}
export interface CTeam {
  id: string; n: string; s: string; lg: string; ln: string; lv: number; g: Gender;
  ds: "real" | "modeled"; city: string; fy: string; pos: number; pts: number; pl: number;
  gd: number; badge: string | null; color: string; age: number;
}
export interface CLeague {
  id: string; name: string; short: string; divisionName: string; avdeling: string | null;
  level: number; gender: Gender; color: string; dataSource: "real" | "modeled"; teamCount: number;
}
export interface CFixture {
  id: string; leagueId: string; leagueShort: string; level: number; season: number;
  round: number; date: string; time: string; status: "played" | "scheduled"; dataSource: "real" | "modeled";
  homeTeamId: string; awayTeamId: string; homeName: string; awayName: string;
  homeShort: string; awayShort: string; homeColor: string; awayColor: string;
  homeGoals: number | null; awayGoals: number | null; htHome: number | null; htAway: number | null;
  result: "H" | "A" | "D" | null;
}

const cache: Record<string, any> = {};
const inflight: Record<string, Promise<any>> = {};
const V = process.env.NEXT_PUBLIC_DATA_VERSION || "1";

function useJson<T>(url: string): T | null {
  const [data, setData] = useState<T | null>(cache[url] ?? null);
  useEffect(() => {
    if (cache[url]) { setData(cache[url]); return; }
    if (!inflight[url]) {
      // Versioned URL + force-cache: downloads once, then served from the
      // HTTP cache forever (busts only when the data version changes).
      inflight[url] = fetch(`${url}?v=${V}`, { cache: "force-cache" })
        .then((r) => r.json())
        .then((d) => (cache[url] = d));
    }
    let alive = true;
    inflight[url].then((d) => alive && setData(d));
    return () => { alive = false; };
  }, [url]);
  return data;
}

export const usePlayers = () => useJson<CPlayer[]>("/data/players.json");
export const useTeams = () => useJson<CTeam[]>("/data/teams.json");
export const useLeagues = () => useJson<CLeague[]>("/data/leagues.json");
export const useFixtures = () => useJson<CFixture[]>("/data/fixtures.json");

export function useGender(): Gender {
  const [g, setG] = useState<Gender>("men");
  useEffect(() => {
    const read = () => {
      const m = document.cookie.match(/kd-gender=(men|women)/);
      setG((m?.[1] as Gender) || "men");
    };
    read();
    const onGender = (e: Event) => setG(((e as CustomEvent).detail as Gender) || "men");
    window.addEventListener("kd-gender", onGender);
    return () => window.removeEventListener("kd-gender", onGender);
  }, []);
  return g;
}

export function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

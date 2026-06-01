"use client";
import { useCallback, useEffect, useState } from "react";

const KEY = "kd-favs";
type Kind = "p" | "t";
type Favs = { p: string[]; t: string[] };

function read(): Favs {
  if (typeof window === "undefined") return { p: [], t: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    return { p: raw?.p ?? [], t: raw?.t ?? [] };
  } catch {
    return { p: [], t: [] };
  }
}

export function useFavorites() {
  const [favs, setFavs] = useState<Favs>({ p: [], t: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavs(read());
    setReady(true);
    const h = () => setFavs(read());
    window.addEventListener("kd-favs", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("kd-favs", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const toggle = useCallback((kind: Kind, id: string) => {
    setFavs((prev) => {
      const set = new Set(prev[kind]);
      set.has(id) ? set.delete(id) : set.add(id);
      const next = { ...prev, [kind]: [...set] };
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("kd-favs"));
      return next;
    });
  }, []);

  const isFav = useCallback((kind: Kind, id: string) => favs[kind].includes(id), [favs]);

  return { favs, ready, toggle, isFav, count: favs.p.length + favs.t.length };
}

"use client";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useFavorites } from "@/lib/use-favorites";

export function FavButton({ kind, id, label = false }: { kind: "p" | "t"; id: string; label?: boolean }) {
  const { isFav, toggle, ready } = useFavorites();
  const active = ready && isFav(kind, id);
  return (
    <button
      onClick={() => toggle(kind, id)}
      aria-label={active ? "Fjern favoritt" : "Legg til favoritt"}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition",
        active ? "border-rose-500/40 bg-rose-500/10 text-rose-500" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Heart className={cn("h-4 w-4", active && "fill-current")} />
      {label && (active ? "Favoritt" : "Favoritt")}
    </button>
  );
}

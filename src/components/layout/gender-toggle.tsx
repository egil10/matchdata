"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { GENDERS } from "@/lib/metrics";
import type { Gender } from "@/lib/types";

export function GenderToggle({ value }: { value: Gender }) {
  const router = useRouter();
  const [g, setG] = useState<Gender>(value);
  const [pending, start] = useTransition();

  function set(next: Gender) {
    if (next === g) return;
    setG(next);
    document.cookie = `kd-gender=${next};path=/;max-age=31536000;samesite=lax`;
    localStorage.setItem("kd-gender", next);
    window.dispatchEvent(new CustomEvent("kd-gender", { detail: next }));
    start(() => router.refresh());
  }

  return (
    <div className={cn("inline-flex rounded-full border border-border bg-card p-0.5 text-sm", pending && "opacity-70")}>
      {GENDERS.map((x) => (
        <button
          key={x.id}
          onClick={() => set(x.id)}
          aria-pressed={g === x.id}
          className={cn(
            "rounded-full px-3 py-1 font-medium transition",
            g === x.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {x.label}
        </button>
      ))}
    </div>
  );
}

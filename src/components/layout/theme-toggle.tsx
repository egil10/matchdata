"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const t = (localStorage.getItem("kd-theme") as "dark" | "light" | null) ||
      (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setTheme(t);
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("kd-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }
  return (
    <button
      onClick={toggle}
      aria-label="Bytt mellom mørkt og lyst tema"
      className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

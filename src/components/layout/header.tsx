"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/logo";
import { NAV, NAV_MORE } from "@/lib/nav";
import { GenderToggle } from "./gender-toggle";
import { ThemeToggle } from "./theme-toggle";
import type { Gender } from "@/lib/types";

export function Header({ gender }: { gender: Gender }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-border glass">
      <div className="container-page flex h-14 items-center gap-3">
        <Logo />
        <nav className="ml-2 hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                isActive(n.href) ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new Event("kd-open-search"))}
            className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition hover:text-foreground md:flex"
          >
            <Search className="h-4 w-4" />
            <span>Søk…</span>
            <kbd className="rounded border border-border px-1 text-[10px]">⌘K</kbd>
          </button>
          <button
            onClick={() => window.dispatchEvent(new Event("kd-open-search"))}
            aria-label="Søk"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground md:hidden"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          <div className="hidden sm:block">
            <GenderToggle value={gender} />
          </div>

          <Link
            href="/favoritter"
            aria-label="Favoritter"
            className={cn(
              "grid h-9 w-9 place-items-center rounded-lg border border-border transition hover:bg-muted",
              isActive("/favoritter") ? "text-rose-500" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Heart className="h-[18px] w-[18px]" />
          </Link>

          <ThemeToggle />

          <button
            onClick={() => setMenu((m) => !m)}
            aria-label="Meny"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground lg:hidden"
          >
            {menu ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {menu && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container-page grid gap-1 py-3 sm:grid-cols-2">
            <div className="mb-2 sm:hidden">
              <GenderToggle value={gender} />
            </div>
            {[...NAV, ...NAV_MORE].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  isActive(n.href) ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

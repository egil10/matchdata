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
import { useGender } from "@/lib/client";

export function Header() {
  const gender = useGender();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [pathname]);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6">
      <div className="container mx-auto">
        <div className="glass flex h-12 items-center gap-1.5 rounded-full px-2 sm:px-3">
          <Logo className="shrink-0 px-1" />
          <nav className="ml-1 hidden items-center gap-0.5 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  isActive(n.href) ? "bg-foreground/[0.06] text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => window.dispatchEvent(new Event("kd-open-search"))}
              className="hidden h-9 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-sm text-muted-foreground transition hover:text-foreground md:flex"
            >
              <Search className="h-4 w-4" /> Søk…
              <kbd className="rounded border border-border px-1 text-[10px]">⌘K</kbd>
            </button>
            <IconBtn onClick={() => window.dispatchEvent(new Event("kd-open-search"))} label="Søk" className="md:hidden">
              <Search className="h-[18px] w-[18px]" />
            </IconBtn>

            <div className="hidden sm:block"><GenderToggle value={gender} /></div>

            <Link href="/favoritter" aria-label="Favoritter" className={cn("grid h-9 w-9 place-items-center rounded-full border border-border transition hover:bg-muted", isActive("/favoritter") ? "text-rose-500" : "text-muted-foreground hover:text-foreground")}>
              <Heart className="h-[18px] w-[18px]" />
            </Link>

            <ThemeToggle />

            <IconBtn onClick={() => setMenu((m) => !m)} label="Meny" className="lg:hidden">
              {menu ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </IconBtn>
          </div>
        </div>

        {menu && (
          <div className="glass-strong mt-2 grid gap-1 rounded-2xl p-3 sm:grid-cols-2 lg:hidden">
            <div className="mb-2 sm:hidden"><GenderToggle value={gender} /></div>
            {[...NAV, ...NAV_MORE].map((n) => (
              <Link key={n.href} href={n.href} className={cn("rounded-xl px-3 py-2 text-sm font-medium", isActive(n.href) ? "bg-foreground/[0.06] text-foreground" : "text-muted-foreground")}>
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

function IconBtn({ children, onClick, label, className }: { children: React.ReactNode; onClick: () => void; label: string; className?: string }) {
  return (
    <button onClick={onClick} aria-label={label} className={cn("grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground", className)}>
      {children}
    </button>
  );
}

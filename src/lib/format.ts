const NB = "nb-NO";

export function fmt(n: number, d = 0): string {
  if (n == null || !isFinite(n)) return "–";
  return new Intl.NumberFormat(NB, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
}

export function signed(n: number | null | undefined, d = 2): string {
  if (n == null || !isFinite(n)) return "–";
  const s = fmt(Math.abs(n), d);
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${s}`;
}

export function pct(n: number, d = 0): string {
  return `${fmt(n, d)} %`;
}

const _d = (iso: string) => {
  const [y, m, da] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, da));
};

export function fmtDate(iso: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat(NB, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(_d(iso));
}
export function fmtDateShort(iso: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat(NB, { day: "numeric", month: "short", timeZone: "UTC" }).format(_d(iso));
}
export function fmtWeekday(iso: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat(NB, { weekday: "long", timeZone: "UTC" }).format(_d(iso));
}
export function fmtMonthYear(iso: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat(NB, { month: "long", year: "numeric", timeZone: "UTC" }).format(_d(iso));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function isoWeek(iso: string): number {
  const date = _d(iso);
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = date.getTime();
  date.setUTCMonth(0, 1);
  if (date.getUTCDay() !== 4) {
    date.setUTCMonth(0, 1 + ((4 - date.getUTCDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - date.getTime()) / (7 * 86400000));
}

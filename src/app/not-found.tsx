import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <p className="text-7xl font-extrabold text-gradient">404</p>
      <p className="mt-3 text-lg font-semibold">Fant ikke siden</p>
      <p className="mt-1 text-muted-foreground">Siden du leter etter finnes ikke eller er flyttet.</p>
      <Link href="/" className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Til forsiden</Link>
    </div>
  );
}

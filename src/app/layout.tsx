import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/cn";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CommandPalette } from "@/components/layout/command-palette";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Syne({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["700", "800"] });

export const metadata: Metadata = {
  title: {
    default: "Matchdata — norsk fotball i tall",
    template: "%s · Matchdata",
  },
  description:
    "Avansert statistikk og analyse for norsk fotball: ekte tabeller og resultater fra Eliteserien, OBOS-ligaen og 2./3. divisjon, pluss Team Impact, aldersanalyse og dashbord — helt ned til grasrota.",
  applicationName: "Matchdata",
  keywords: ["norsk fotball", "Eliteserien", "OBOS-ligaen", "2. divisjon", "3. divisjon", "statistikk", "Team Impact", "fotballdata"],
  openGraph: { title: "Matchdata — norsk fotball i tall", type: "website", locale: "nb_NO" },
};

const themeScript = `(function(){try{var t=localStorage.getItem('kd-theme');var d=document.documentElement;if(t==='dark'){d.classList.add('dark')}else{d.classList.remove('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" className={cn(inter.variable, display.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <Header />
        <CommandPalette />
        <main className="container-page py-6 sm:py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

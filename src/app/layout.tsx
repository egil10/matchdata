import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/cn";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CommandPalette } from "@/components/layout/command-palette";
import { getGender } from "@/lib/gender";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Toppdata — norsk fotball i tall",
    template: "%s · Toppdata",
  },
  description:
    "Avansert statistikk og analyse for norsk fotball: ekte tabeller og resultater fra Eliteserien & OBOS-ligaen, pluss Team Impact, aldersanalyse og dashbord — også for lavere divisjoner.",
  applicationName: "Toppdata",
  keywords: ["norsk fotball", "Eliteserien", "OBOS-ligaen", "statistikk", "Team Impact", "fotballdata"],
  openGraph: { title: "Toppdata — norsk fotball i tall", type: "website", locale: "nb_NO" },
};

const themeScript = `(function(){try{var t=localStorage.getItem('kd-theme');var d=document.documentElement;if(t==='light'){d.classList.remove('dark')}else{d.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gender = getGender();
  return (
    <html lang="nb" className={cn(inter.variable, mono.variable, "dark")} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Header gender={gender} />
        <CommandPalette gender={gender} />
        <main className="container-page py-6 sm:py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

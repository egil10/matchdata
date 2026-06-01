"use client";
// Lazy wrappers so recharts is only downloaded when a chart actually mounts.
import dynamic from "next/dynamic";

function Sk({ h }: { h: number }) {
  return <div className="w-full animate-pulse rounded-xl bg-muted/60" style={{ height: h }} />;
}

export const AgeHistogram = dynamic(() => import("./charts").then((m) => m.AgeHistogram), {
  ssr: false, loading: () => <Sk h={300} />,
});
export const GoalsPerRoundChart = dynamic(() => import("./charts").then((m) => m.GoalsPerRoundChart), {
  ssr: false, loading: () => <Sk h={220} />,
});
export const ProgressionChart = dynamic(() => import("./charts").then((m) => m.ProgressionChart), {
  ssr: false, loading: () => <Sk h={320} />,
});
export const DonutChart = dynamic(() => import("./charts").then((m) => m.DonutChart), {
  ssr: false, loading: () => <Sk h={200} />,
});
export const RadarStat = dynamic(() => import("./charts").then((m) => m.RadarStat), {
  ssr: false, loading: () => <Sk h={290} />,
});
export const ScatterLab = dynamic(() => import("./charts").then((m) => m.ScatterLab), {
  ssr: false, loading: () => <Sk h={460} />,
});
export const RankBarChart = dynamic(() => import("./charts").then((m) => m.RankBarChart), {
  ssr: false, loading: () => <Sk h={300} />,
});

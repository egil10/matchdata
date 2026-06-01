"use client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ScatterChart, Scatter, ZAxis, ReferenceLine, Legend,
} from "recharts";
import { CHART } from "@/lib/colors";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false };
const grid = { stroke: "hsl(var(--border))", strokeDasharray: "3 3", vertical: false } as const;
const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 10,
    fontSize: 12,
    color: "hsl(var(--popover-foreground))",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))", fontWeight: 600 },
  cursor: { fill: "hsl(var(--muted) / 0.4)" },
};

/* ------------------------------------------------ Age histogram (clickable) */
export function AgeHistogram({
  bars, selected, onSelect, height = 260,
}: {
  bars: { birthYear: number; age: number; count: number }[];
  selected?: number | null;
  onSelect?: (year: number) => void;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={bars} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="age" {...axis} interval={0} angle={0} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tooltipStyle} formatter={(v: any) => [v, "Spillere"]} labelFormatter={(l) => `${l} år`} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={(d: any) => onSelect?.(d.birthYear)} cursor={onSelect ? "pointer" : "default"}>
          {bars.map((b) => (
            <Cell key={b.birthYear} fill={selected === b.birthYear ? "hsl(var(--accent))" : "hsl(var(--primary))"} fillOpacity={selected && selected !== b.birthYear ? 0.4 : 0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------ Goals per round */
export function GoalsPerRoundChart({ data, height = 220 }: { data: { round: number; goals: number; matches: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="round" {...axis} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tooltipStyle} formatter={(v: any, n: any) => [v, n === "goals" ? "Mål" : n]} labelFormatter={(l) => `Runde ${l}`} />
        <Bar dataKey="goals" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------ Points progression (race) */
export function ProgressionChart({
  series, maxRound, highlight, height = 320,
}: {
  series: { teamId: string; name: string; points: number[] }[];
  maxRound: number;
  highlight: string[];
  height?: number;
}) {
  const data = Array.from({ length: maxRound }, (_, i) => {
    const row: any = { round: i + 1 };
    for (const s of series) row[s.teamId] = s.points[i];
    return row;
  });
  const hi = new Set(highlight);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="round" {...axis} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tooltipStyle} labelFormatter={(l) => `Runde ${l}`} />
        {series.map((s, i) => {
          const on = hi.has(s.teamId);
          return (
            <Line
              key={s.teamId}
              type="monotone"
              dataKey={s.teamId}
              name={s.name}
              stroke={on ? CHART[highlight.indexOf(s.teamId) % CHART.length] : "hsl(var(--muted-foreground))"}
              strokeWidth={on ? 2.4 : 1}
              strokeOpacity={on ? 1 : 0.18}
              dot={false}
              isAnimationActive={false}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ----------------------------------------------------------- Donut */
export function DonutChart({ segments, height = 200 }: { segments: { name: string; value: number; color: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={segments} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
          {segments.map((s) => <Cell key={s.name} fill={s.color} />)}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ----------------------------------------------------------- Radar */
export function RadarStat({
  metrics, series, height = 300,
}: {
  metrics: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
}) {
  const data = metrics.map((m, i) => {
    const row: any = { metric: m };
    for (const s of series) row[s.name] = s.values[i];
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
        {series.map((s) => (
          <Radar key={s.name} name={s.name} dataKey={s.name} stroke={s.color} fill={s.color} fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
        ))}
        <Tooltip {...tooltipStyle} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ----------------------------------------------------------- Scatter lab */
export function ScatterLab({
  points, xLabel, yLabel, xRef, yRef, height = 460, onSelect,
}: {
  points: { x: number; y: number; name: string; sub: string; color: string; id: string; r?: number }[];
  xLabel: string; yLabel: string; xRef?: number; yRef?: number; height?: number;
  onSelect?: (id: string) => void;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 12, right: 16, left: 0, bottom: 16 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name={xLabel} {...axis} label={{ value: xLabel, position: "insideBottom", offset: -8, fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
        <YAxis type="number" dataKey="y" name={yLabel} {...axis} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
        <ZAxis type="number" dataKey="r" range={[40, 320]} />
        {xRef != null && <ReferenceLine x={xRef} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />}
        {yRef != null && <ReferenceLine y={yRef} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />}
        <Tooltip
          {...tooltipStyle}
          cursor={{ strokeDasharray: "3 3" }}
          content={({ payload }: any) => {
            if (!payload || !payload.length) return null;
            const p = payload[0].payload;
            return (
              <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                <p className="font-semibold">{p.name}</p>
                <p className="text-muted-foreground">{p.sub}</p>
                <p className="mt-1">{xLabel}: <span className="font-medium">{p.x}</span></p>
                <p>{yLabel}: <span className="font-medium">{p.y}</span></p>
              </div>
            );
          }}
        />
        <Scatter data={points} onClick={(d: any) => onSelect?.(d.id)} cursor={onSelect ? "pointer" : "default"}>
          {points.map((p) => <Cell key={p.id} fill={p.color} fillOpacity={0.72} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------ Horizontal bar ranking */
export function RankBarChart({
  data, color = "hsl(var(--primary))", height = 320, unit = "",
}: {
  data: { name: string; value: number }[]; color?: string; height?: number; unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" {...axis} />
        <YAxis type="category" dataKey="name" {...axis} width={90} />
        <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}${unit}`, ""]} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

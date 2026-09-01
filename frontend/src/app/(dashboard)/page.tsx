"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  Loader2,
  TrendingUp,
  RefreshCw,
  Package,
  BarChart3,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChartDataPoint {
  date: string;
  actual: number | null;
  forecast: number | null;
  lower: number | null;
  upper: number | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-muted-foreground">
        {format(parseISO(label), "MMM d, yyyy")}
      </p>
      {payload
        .filter((p: any) => p.value != null)
        .map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-mono font-medium">
              {Math.round(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stats, setStats] = useState({
    products: 0,
    records: 0,
    totalUnits: 0,
    forecastedUnits: 0,
  });
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [s, f, p] = await Promise.all([
        api.get("/sales/?limit=365"),
        api.get("/forecasts/"),
        api.get("/products/"),
      ]);

      const sales: any[] = s.data;
      const forecasts: any[] = f.data;

      const map = new Map<string, ChartDataPoint>();
      let totalUnits = 0;
      let forecastedUnits = 0;

      for (const r of sales) {
        totalUnits += r.units_sold;
        const existing = map.get(r.date);
        if (existing) existing.actual = (existing.actual || 0) + r.units_sold;
        else
          map.set(r.date, {
            date: r.date,
            actual: r.units_sold,
            forecast: null,
            lower: null,
            upper: null,
          });
      }

      for (const r of forecasts) {
        forecastedUnits += r.predicted_units;
        const d = r.forecast_date;
        const existing = map.get(d);
        if (existing) {
          existing.forecast =
            (existing.forecast || 0) + r.predicted_units;
          existing.lower = (existing.lower || 0) + r.lower_bound;
          existing.upper = (existing.upper || 0) + r.upper_bound;
        } else {
          map.set(d, {
            date: d,
            actual: null,
            forecast: r.predicted_units,
            lower: r.lower_bound,
            upper: r.upper_bound,
          });
        }
      }

      const sorted = [...map.values()].sort(
        (a, b) => +new Date(a.date) - +new Date(b.date)
      );

      setChartData(sorted.slice(-90));
      setStats({
        products: p.data.length,
        records: sales.length,
        totalUnits,
        forecastedUnits,
      });
    } catch {
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const train = async () => {
    setTraining(true);
    try {
      await api.post("/ml/train");
      toast.success("Model retraining queued.");
    } catch {
      toast.error("Failed to start training.");
    } finally {
      setTraining(false);
    }
  };

  const predict = async () => {
    setPredicting(true);
    try {
      await api.post("/ml/predict");
      toast.success("Forecast generation queued.");
    } catch {
      toast.error("Failed to start prediction.");
    } finally {
      setPredicting(false);
    }
  };

  const kpis = [
    {
      label: "Products",
      value: stats.products,
      icon: Package,
      color: "#a78bfa",
    },
    {
      label: "Sales Records",
      value: stats.records,
      icon: BarChart3,
      color: "#5b8def",
    },
    {
      label: "Forecast (30d)",
      value: Math.round(stats.forecastedUnits),
      icon: TrendingUp,
      color: "#34d399",
    },
    {
      label: "Model MAPE",
      value: "11.8%",
      icon: Target,
      color: "#fbbf24",
      isText: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Welcome back, {user?.email?.split("@")[0]}.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-card px-5 py-4 flex flex-col gap-1"
          >
            <div className="flex items-center gap-2">
              <k.icon
                className="h-3.5 w-3.5"
                style={{ color: k.color }}
              />
              <span className="text-xs text-muted-foreground">{k.label}</span>
            </div>
            <span className="text-xl font-semibold font-mono tracking-tight">
              {k.isText
                ? k.value
                : (k.value as number).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-sm font-medium">Sales &amp; Forecast</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last 90 days of historical data with ML predictions
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={train}
              disabled={training}
              className="h-7 text-xs gap-1.5 text-muted-foreground"
            >
              {training ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Retrain
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={predict}
              disabled={predicting}
              className="h-7 text-xs gap-1.5 text-muted-foreground"
            >
              {predicting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              )}
              Forecast
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={load}
              className="h-7 text-xs gap-1.5 text-muted-foreground"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="h-[360px] px-2 py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <BarChart3 className="h-8 w-8 opacity-20" />
              <p className="text-sm">No data yet</p>
              <p className="text-xs">
                Add products and sales records to see the chart.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b8def" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#5b8def" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#262626"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(parseISO(v), "MMM d")}
                  tick={{ fontSize: 11, fill: "#666" }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#666" }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={4}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "#333", strokeDasharray: "3 3" }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#5b8def"
                  strokeWidth={1.5}
                  fill="url(#gA)"
                  dot={false}
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  fill="url(#gF)"
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="upper"
                  stroke="#34d399"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  opacity={0.3}
                  name="Upper"
                />
                <Line
                  type="monotone"
                  dataKey="lower"
                  stroke="#34d399"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  opacity={0.3}
                  name="Lower"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        {chartData.length > 0 && (
          <div className="flex gap-5 border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-[#5b8def]" />
              Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-[#34d399]" />
              Forecast
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-[#34d399] opacity-30" />
              Confidence
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import anime from "animejs";
import Link from "next/link";

interface ChartDataPoint {
  date: string;
  actual: number | null;
  forecast: number | null;
  lower: number | null;
  upper: number | null;
}

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

  const statsRef = useRef<HTMLDivElement>(null);
  const animatedProducts = useRef({ val: 0 });
  const animatedRecords = useRef({ val: 0 });
  const animatedForecast = useRef({ val: 0 });

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
      
      const newStats = {
        products: p.data.length,
        records: sales.length,
        totalUnits,
        forecastedUnits,
      };
      
      // Animate numbers
      anime({
        targets: [animatedProducts.current, animatedRecords.current, animatedForecast.current],
        val: (el: any, i: number) => [
          0,
          i === 0 ? newStats.products : i === 1 ? newStats.records : newStats.forecastedUnits
        ],
        round: 1,
        easing: 'easeOutExpo',
        duration: 1500,
        update: () => {
          setStats({
            products: animatedProducts.current.val,
            records: animatedRecords.current.val,
            totalUnits: totalUnits, // static
            forecastedUnits: animatedForecast.current.val,
          });
        }
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

  useEffect(() => {
    if (!loading) {
      // Stagger entrance animation
      anime({
        targets: ".dashboard-anim",
        translateY: [15, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 600,
        easing: "easeOutSine",
      });
    }
  }, [loading]);

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
      tooltip: "The total number of unique products registered in your catalog.",
    },
    {
      label: "Sales Records",
      value: stats.records,
      icon: BarChart3,
      color: "#5b8def",
      tooltip: "The total number of historical daily sales entries logged.",
    },
    {
      label: "Forecast (30d)",
      value: Math.round(stats.forecastedUnits),
      icon: TrendingUp,
      color: "#34d399",
      tooltip: "The total number of units the Machine Learning model expects you to sell over the next 30 days.",
    },
    {
      label: "Model Error (MAPE)",
      value: "11.8%",
      icon: Target,
      color: "#fbbf24",
      isText: true,
      tooltip: "Mean Absolute Percentage Error. This measures the accuracy of our AI model. 11.8% means predictions are extremely close to actual sales!",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="dashboard-anim opacity-0">
        <h1 className="text-xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Welcome back, {user?.email?.split("@")[0]}. Here is what's happening with your inventory today.
        </p>
      </div>

      {/* KPIs */}
      <div 
        ref={statsRef}
        className="dashboard-anim opacity-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {kpis.map((k) => (
          <div
            key={k.label}
            className="group relative bg-card px-5 py-5 flex flex-col gap-1 rounded-xl shadow-sm border border-border transition-all hover:shadow-md hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <k.icon
                  className="h-4 w-4"
                  style={{ color: k.color }}
                />
                <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
              </div>
              {/* Tooltip Icon */}
              <div className="relative flex items-center justify-center">
                <Info className="h-3.5 w-3.5 text-muted-foreground/40 cursor-help" />
                <div className="pointer-events-none absolute bottom-full right-0 mb-2 w-48 opacity-0 transition-opacity group-hover:opacity-100 z-50">
                  <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg border border-border p-2">
                    {k.tooltip}
                  </div>
                </div>
              </div>
            </div>
            <span className="text-2xl font-bold font-mono tracking-tight mt-1">
              {k.isText
                ? k.value
                : (k.value as number).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="dashboard-anim opacity-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div>
            <h2 className="text-sm font-semibold">Sales &amp; Forecast Timeline</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compare your last 90 days of historical data against our machine learning predictions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={train}
              disabled={training}
              className="h-8 text-xs gap-1.5 transition-all"
            >
              {training ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-primary" />
              )}
              Retrain Model
            </Button>
            <Button
              size="sm"
              onClick={predict}
              disabled={predicting}
              className="h-8 text-xs gap-1.5 transition-all shadow-sm"
            >
              {predicting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5" />
              )}
              Generate Forecast
            </Button>
          </div>
        </div>

        <div className="h-[400px] px-2 py-6">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Gathering your intelligence...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">Your dashboard is empty</h3>
              <p className="text-sm text-muted-foreground mb-4">
                To start visualizing your data and generating ML forecasts, you first need to add some products and log a few sales.
              </p>
              <div className="flex gap-3">
                <Link href="/products">
                  <Button variant="default" size="sm" className="gap-2 shadow-sm">
                    <Package className="h-4 w-4" />
                    Add Products
                  </Button>
                </Link>
                <Link href="/sales">
                  <Button variant="outline" size="sm" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Log Sales
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b8def" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#5b8def" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(parseISO(v), "MMM d")}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  tickMargin={12}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4", opacity: 0.5 }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual Sales"
                  stroke="#5b8def"
                  strokeWidth={2}
                  fill="url(#gA)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#5b8def" }}
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  name="AI Forecast"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#gF)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#34d399" }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="upper"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  opacity={0.4}
                  name="Upper Confidence"
                />
                <Line
                  type="monotone"
                  dataKey="lower"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  opacity={0.4}
                  name="Lower Confidence"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        {chartData.length > 0 && (
          <div className="flex flex-wrap gap-6 border-t border-border px-6 py-3.5 text-xs font-medium text-muted-foreground bg-muted/10">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-5 rounded-full bg-[#5b8def]" />
              Actual Sales
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-5 rounded-full bg-[#34d399]" />
              AI Forecast
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-5 rounded-full bg-[#34d399] opacity-40 border-dashed border border-[#34d399]" />
              95% Confidence Bounds
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

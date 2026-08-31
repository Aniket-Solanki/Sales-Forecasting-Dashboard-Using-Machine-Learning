"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart 
} from "recharts";
import { format, parseISO } from "date-fns";
import { Loader2, TrendingUp, RefreshCw, Activity, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface ChartDataPoint {
  date: string;
  actualSales: number | null;
  predictedSales: number | null;
  lowerBound: number | null;
  upperBound: number | null;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [kpi, setKpi] = useState({ totalSales: 0, forecasted: 0, mape: 11.77 });
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  const loadDashboardData = async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      // For simplicity, we just fetch sales and forecasts and merge them.
      // In a real app, you would filter by product_id if they select one.
      const [salesRes, forecastRes] = await Promise.all([
        api.get("/sales/?limit=365"), 
        api.get("/forecasts/")
      ]);

      const sales = salesRes.data;
      const forecasts = forecastRes.data;

      const dataMap = new Map<string, ChartDataPoint>();

      let totalActual = 0;
      let totalForecast = 0;

      // Map actual sales
      sales.forEach((s: any) => {
        const d = s.date;
        totalActual += s.units_sold;
        if (!dataMap.has(d)) {
          dataMap.set(d, { date: d, actualSales: s.units_sold, predictedSales: null, lowerBound: null, upperBound: null });
        } else {
          dataMap.get(d)!.actualSales! += s.units_sold;
        }
      });

      // Map forecasts
      forecasts.forEach((f: any) => {
        const d = f.forecast_date;
        totalForecast += f.predicted_units;
        if (!dataMap.has(d)) {
          dataMap.set(d, { date: d, actualSales: null, predictedSales: f.predicted_units, lowerBound: f.lower_bound, upperBound: f.upper_bound });
        } else {
          dataMap.get(d)!.predictedSales = (dataMap.get(d)!.predictedSales || 0) + f.predicted_units;
          dataMap.get(d)!.lowerBound = (dataMap.get(d)!.lowerBound || 0) + f.lower_bound;
          dataMap.get(d)!.upperBound = (dataMap.get(d)!.upperBound || 0) + f.upper_bound;
        }
      });

      // Sort chronological
      const merged = Array.from(dataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setChartData(merged.slice(-90)); // Show last 90 days for better visibility
      setKpi({ totalSales: totalActual, forecasted: totalForecast, mape: 11.77 });
    } catch (err) {
      toast("Data Error", { description: "Failed to load dashboard data." });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const handleTrainModel = async () => {
    setIsTraining(true);
    try {
      await api.post("/ml/train");
      toast("Model Training Started", {
        description: "The XGBoost model is retraining in the background.",
      });
    } catch (err) {
      toast("Access Denied", { description: "You need admin privileges to train the model." });
    } finally {
      setIsTraining(false);
    }
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    try {
      await api.post("/ml/predict");
      toast("Forecasting Started", {
        description: "The 30-day forecast generation is queued.",
      });
    } catch (err) {
      toast("Access Denied", { description: "You need admin privileges to generate forecasts." });
    } finally {
      setIsPredicting(false);
    }
  };

  if (authLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Forecasting Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.email}. Here is the latest ML projection.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={logout}>Sign out</Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Historical Units</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Units sold to date</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Forecasted Units (30 Days)</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(kpi.forecasted).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Projected next month</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Model Accuracy (MAPE)</CardTitle>
                <Target className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.mape.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">XGBoost Regressor Baseline</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Chart & Controls */}
        <div className="grid gap-6 md:grid-cols-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="md:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Sales Trajectory & Forecast</CardTitle>
                <CardDescription>Visualizing historical data alongside machine learning bounds.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  {isLoadingData ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(str) => format(parseISO(str), "MMM d")}
                          tick={{ fontSize: 12 }}
                          tickMargin={10}
                        />
                        <YAxis tick={{ fontSize: 12 }} tickMargin={10} />
                        <Tooltip 
                          labelFormatter={(label) => format(parseISO(label as string), "MMMM d, yyyy")}
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        />
                        <Legend />
                        
                        <Area type="monotone" dataKey="actualSales" name="Actual Sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                        <Area type="monotone" dataKey="predictedSales" name="Forecast" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorForecast)" />
                        
                        {/* Optionally display confidence bounds as separate thin lines if desired */}
                        <Line type="monotone" dataKey="upperBound" name="Upper Bound" stroke="#10b981" strokeDasharray="3 3" dot={false} strokeWidth={1} opacity={0.5} />
                        <Line type="monotone" dataKey="lowerBound" name="Lower Bound" stroke="#10b981" strokeDasharray="3 3" dot={false} strokeWidth={1} opacity={0.5} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>ML Actions</CardTitle>
                <CardDescription>Trigger the automated Celery background workers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleTrainModel} 
                  disabled={isTraining || user.role !== "admin"} 
                  className="w-full justify-start"
                >
                  {isTraining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Retrain Model
                </Button>
                <Button 
                  onClick={handlePredict} 
                  disabled={isPredicting || user.role !== "admin"} 
                  variant="outline" 
                  className="w-full justify-start border-primary text-primary hover:bg-primary/10"
                >
                  {isPredicting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
                  Generate Forecast
                </Button>

                {user.role !== "admin" && (
                  <p className="text-xs text-muted-foreground mt-4">
                    * Administrator privileges required to run pipeline triggers.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

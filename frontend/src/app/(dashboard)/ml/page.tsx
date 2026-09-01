"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BrainCircuit, RefreshCw, TrendingUp, Loader2, Zap, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface Forecast { id: number; forecast_date: string; predicted_units: number; lower_bound: number; upper_bound: number; model_version: string; }

export default function MLPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setForecasts((await api.get("/forecasts/")).data); }
    catch { toast.error("Failed to load forecasts."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const train = async () => {
    setTraining(true);
    try {
      await api.post("/ml/train");
      toast.success("Training task queued.");
    } catch { toast.error("Training failed."); }
    finally { setTraining(false); }
  };

  const predict = async () => {
    setPredicting(true);
    try {
      await api.post("/ml/predict");
      toast.success("Forecast task queued.");
      setTimeout(load, 2000);
    } catch { toast.error("Prediction failed."); }
    finally { setPredicting(false); }
  };

  const steps = [
    { icon: Database, label: "Data Extraction", desc: "PostgreSQL to Pandas" },
    { icon: Zap, label: "Feature Engineering", desc: "Lag features & rolling means" },
    { icon: BrainCircuit, label: "Model Training", desc: "XGBoost Regressor" },
    { icon: TrendingUp, label: "Forecasting", desc: "30-day projection bounds" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">ML Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage the XGBoost forecasting pipeline.
        </p>
      </div>

      {/* Visual Pipeline */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-medium mb-4">Pipeline Architecture</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0">
          {steps.map((s, i) => (
            <div key={s.label} className="flex-1 flex flex-col sm:items-center gap-2 relative">
              {i < steps.length - 1 && <div className="hidden sm:block absolute top-4 left-1/2 w-full h-px bg-border -z-10" />}
              <div className="h-8 w-8 rounded bg-accent flex items-center justify-center border border-border z-10">
                <s.icon className="h-4 w-4 text-foreground" />
              </div>
              <div className="sm:text-center">
                <p className="text-xs font-medium">{s.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[120px] mx-auto leading-tight">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-2">
            <RefreshCw className="h-4 w-4 text-chart-1" />
            <h3 className="text-sm font-medium">Retrain Model</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5 flex-1">
            Rebuild the XGBoost model on all available sales data. This is a heavy background task.
          </p>
          <Button onClick={train} disabled={training} size="sm" className="w-full text-xs gap-1.5 bg-chart-1/10 text-chart-1 hover:bg-chart-1/20 border border-chart-1/20">
            {training ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {training ? "Queueing..." : "Start Training"}
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-2">
            <TrendingUp className="h-4 w-4 text-chart-2" />
            <h3 className="text-sm font-medium">Generate Forecast</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5 flex-1">
            Predict the next 30 days of sales with confidence bounds using the latest model.
          </p>
          <Button onClick={predict} disabled={predicting} size="sm" className="w-full text-xs gap-1.5 bg-chart-2/10 text-chart-2 hover:bg-chart-2/20 border border-chart-2/20">
            {predicting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
            {predicting ? "Queueing..." : "Run Predictions"}
          </Button>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div>
            <h2 className="text-sm font-medium">Forecast Results</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{forecasts.length} predictions generated</p>
          </div>
          <Button variant="ghost" size="sm" onClick={load} className="h-7 text-xs gap-1.5 text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : forecasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-1 bg-card">
            <TrendingUp className="h-8 w-8 opacity-20" />
            <p className="text-sm">No forecast data</p>
            <p className="text-xs">Train a model and predict to see results.</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/30 backdrop-blur z-10">
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">Date</th>
                  <th className="text-right px-4 py-2.5 font-medium">Predicted</th>
                  <th className="text-right px-4 py-2.5 font-medium">Lower</th>
                  <th className="text-right px-4 py-2.5 font-medium">Upper</th>
                  <th className="text-left px-4 py-2.5 font-medium">Model</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {forecasts.map((f) => (
                  <tr key={f.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{format(parseISO(f.forecast_date), "MMM d, yyyy")}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-chart-2">{Math.round(f.predicted_units).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{Math.round(f.lower_bound).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{Math.round(f.upper_bound).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {f.model_version}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

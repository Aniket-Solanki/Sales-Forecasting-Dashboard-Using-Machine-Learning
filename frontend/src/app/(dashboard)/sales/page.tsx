"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BarChart3, Plus, Search, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface Product { id: string; sku: string; name: string; }
interface Sale { id: number; product_id: string; date: string; units_sold: number; revenue: string; }

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [productId, setProductId] = useState("");
  const [date, setDate] = useState("");
  const [units, setUnits] = useState("");
  const [revenue, setRevenue] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([api.get("/sales/?limit=500"), api.get("/products/")]);
      setSales(s.data);
      setProducts(p.data);
    } catch { toast.error("Failed to load data."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const productName = (id: string) => products.find((p) => p.id === id)?.name || id.slice(0, 8);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/sales/", { product_id: productId, date, units_sold: +units, revenue: +revenue });
      toast.success("Record added.");
      setProductId(""); setDate(""); setUnits(""); setRevenue("");
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed.");
    } finally { setSubmitting(false); }
  };

  const totalUnits = sales.reduce((a, s) => a + s.units_sold, 0);
  const totalRev = sales.reduce((a, s) => a + +s.revenue, 0);

  const filtered = sales.filter((s) => {
    const pn = productName(s.product_id).toLowerCase();
    return pn.includes(search.toLowerCase()) || s.date.includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Sales</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sales.length} records · <span className="font-mono">{totalUnits.toLocaleString()}</span> units · <span className="font-mono text-chart-2">${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </p>
        </div>
        <Button size="sm" variant={showForm ? "ghost" : "default"} onClick={() => setShowForm(!showForm)} className="h-8 text-xs gap-1.5">
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "Cancel" : "Add Record"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Product</Label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} required
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="" disabled>Select…</option>
                {products.map((p) => <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Units Sold</Label>
              <Input type="number" min="0" placeholder="150" value={units} onChange={(e) => setUnits(e.target.value)} required className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Revenue ($)</Label>
              <Input type="number" min="0" step="0.01" placeholder="2999.99" value={revenue} onChange={(e) => setRevenue(e.target.value)} required className="h-8 text-sm" />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs gap-1.5">
            {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
            Add Record
          </Button>
        </form>
      )}

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-sm" />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-1">
            <BarChart3 className="h-8 w-8 opacity-20" />
            <p className="text-sm">{search ? "No results" : "No records yet"}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">Product</th>
                <th className="text-left px-4 py-2.5 font-medium">Date</th>
                <th className="text-right px-4 py-2.5 font-medium">Units</th>
                <th className="text-right px-4 py-2.5 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{productName(s.product_id)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{format(parseISO(s.date), "MMM d, yyyy")}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{s.units_sold.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-chart-2">${(+s.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

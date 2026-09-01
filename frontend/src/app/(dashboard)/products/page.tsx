"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Package, Plus, Search, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setProducts((await api.get("/products/")).data);
    } catch {
      toast.error("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/products/", { sku, name, category });
      toast.success(`Product "${name}" created.`);
      setSku(""); setName(""); setCategory("");
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length} product{products.length !== 1 && "s"} in catalogue
          </p>
        </div>
        <Button
          size="sm"
          variant={showForm ? "ghost" : "default"}
          onClick={() => setShowForm(!showForm)}
          className="h-8 text-xs gap-1.5"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "Cancel" : "Add Product"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={submit}
          className="rounded-lg border border-border bg-card p-5 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="sku">SKU</Label>
              <Input id="sku" placeholder="ELEC-001" value={sku} onChange={(e) => setSku(e.target.value)} required className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="name">Name</Label>
              <Input id="name" placeholder="Wireless Headphones" value={name} onChange={(e) => setName(e.target.value)} required className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cat">Category</Label>
              <Input id="cat" placeholder="Electronics" value={category} onChange={(e) => setCategory(e.target.value)} required className="h-8 text-sm" />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs gap-1.5">
            {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
            Create
          </Button>
        </form>
      )}

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-sm" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-1">
            <Package className="h-8 w-8 opacity-20" />
            <p className="text-sm">{search ? "No results" : "No products yet"}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">SKU</th>
                <th className="text-left px-4 py-2.5 font-medium">Category</th>
                <th className="text-left px-4 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {format(parseISO(p.created_at), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

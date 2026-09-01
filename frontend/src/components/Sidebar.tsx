"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  BrainCircuit,
  LogOut,
  TrendingUp,
} from "lucide-react";

const nav = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Sales", href: "/sales", icon: BarChart3 },
  { label: "ML Pipeline", href: "/ml", icon: BrainCircuit },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-background">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-border">
        <TrendingUp className="h-4 w-4 text-chart-1" />
        <span className="text-[13px] font-semibold tracking-tight">
          SalesCast
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-colors ${
              isActive(n.href)
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <n.icon className="h-[15px] w-[15px]" />
            {n.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2.5 px-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-semibold uppercase">
            {user?.email?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[12px] text-foreground">
              {user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

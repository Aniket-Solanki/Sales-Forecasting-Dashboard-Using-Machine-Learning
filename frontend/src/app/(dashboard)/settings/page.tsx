"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import anime from "animejs";
import { Moon, Sun, Monitor, UserCircle, Key } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Stagger animation for the cards
    anime({
      targets: ".stagger-card",
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(100),
      duration: 800,
      easing: "easeOutExpo",
    });
  }, []);

  return (
    <div className="space-y-8 max-w-4xl" ref={containerRef}>
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <div className="stagger-card rounded-lg border border-border bg-card p-6 shadow-sm opacity-0">
          <div className="flex items-center gap-3 mb-4">
            <UserCircle className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-medium">Profile Details</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Email Address
              </label>
              <div className="mt-1 text-sm font-medium">{user?.email}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Account ID
              </label>
              <div className="mt-1 font-mono text-xs text-muted-foreground bg-accent px-2 py-1 rounded inline-block">
                {user?.id}
              </div>
            </div>
          </div>
        </div>

        {/* Theme Preferences Section */}
        <div className="stagger-card rounded-lg border border-border bg-card p-6 shadow-sm opacity-0">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-medium">Appearance</h2>
          </div>
          <div className="flex flex-col gap-1 mb-4 text-sm text-muted-foreground">
            Customize the aesthetic of your dashboard.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition-colors ${
                theme === "light"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-accent"
              }`}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition-colors ${
                theme === "dark"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-accent"
              }`}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition-colors ${
                theme === "system"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-accent"
              }`}
            >
              <Monitor className="h-4 w-4" />
              System
            </button>
          </div>
        </div>

        {/* API Info Section */}
        <div className="stagger-card rounded-lg border border-border bg-card p-6 shadow-sm opacity-0">
          <div className="flex items-center gap-3 mb-4">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-medium">Developer</h2>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              API Connection
            </label>
            <div className="mt-1 font-mono text-xs text-muted-foreground bg-accent px-2 py-1 rounded inline-block break-all">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

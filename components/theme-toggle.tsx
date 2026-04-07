"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 p-1 bg-background/60 backdrop-blur-md rounded-full border border-border shadow-sm">
      <button
        onClick={() => setTheme("light")}
        title="Light Mode"
        className={cn(
          "p-2 rounded-full",
          theme === "light"
            ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sun className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme("system")}
        title="Follow System"
        className={cn(
          "p-2 rounded-full",
          theme === "system"
            ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Monitor className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme("dark")}
        title="Dark Mode"
        className={cn(
          "p-2 rounded-full",
          theme === "dark"
            ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}

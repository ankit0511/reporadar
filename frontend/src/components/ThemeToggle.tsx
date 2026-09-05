import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

// Glossy pill toggle — matches the sidebar icon buttons: soft shadow and a
// light sheen across the top, sun/moon swapping with the active theme.
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-muted-foreground shadow-sm overflow-hidden transition-all hover:border-primary/30 hover:text-primary hover:-translate-y-0.5",
        className
      )}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent dark:from-white/15" />
      {isDark ? <Sun className="relative w-4 h-4" /> : <Moon className="relative w-4 h-4" />}
    </button>
  );
}

export default ThemeToggle;

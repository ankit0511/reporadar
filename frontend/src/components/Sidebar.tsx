import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Generic panel shell — this is the piece meant to be reused for chat
// history and whatever else lands in a side panel later. Keep content
// (what goes inside) separate from the shell (how it looks).
export function Sidebar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <aside
      className={cn(
        "relative w-full lg:w-80 shrink-0 lg:sticky lg:top-28 lg:self-start rounded-3xl border border-border bg-card shadow-lg shadow-primary/5 overflow-hidden",
        className
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light" />
      <div className="pointer-events-none absolute -top-14 -right-14 w-36 h-36 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative">{children}</div>
    </aside>
  );
}

export function SidebarSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="p-5 border-b border-border last:border-b-0">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-3">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

export function SidebarEmpty({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

export default Sidebar;

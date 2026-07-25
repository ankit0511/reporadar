import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Clock, MessageCircle, Star, Search, X } from "lucide-react";
import { describeSearch } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RecentSearch } from "@/types";

interface DashboardSidebarProps {
  recentSearches: RecentSearch[];
  onSelectSearch: (search: RecentSearch) => void;
  onOpenChat: () => void;
  onOpenSaved: () => void;
  savedActive?: boolean;
}

interface HistoryGroup {
  label: string;
  items: RecentSearch[];
}

function groupByDay(searches: RecentSearch[]): HistoryGroup[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const groups: HistoryGroup[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 Days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const search of searches) {
    const d = new Date(search.searchedAt);
    const startOfThatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round((startOfToday - startOfThatDay) / 86_400_000);

    if (diffDays <= 0) groups[0].items.push(search);
    else if (diffDays === 1) groups[1].items.push(search);
    else if (diffDays <= 7) groups[2].items.push(search);
    else groups[3].items.push(search);
  }

  return groups.filter((g) => g.items.length > 0);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// A small glossy pill — rounded square, soft shadow, a light diagonal sheen
// across the top, and a primary gradient fill when active.
function SidebarIconButton({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: LucideIcon;
  active?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "relative flex items-center justify-center w-11 h-11 rounded-2xl border overflow-hidden transition-all",
        active
          ? "border-transparent bg-gradient-to-br from-primary-light to-primary text-primary-foreground shadow-md shadow-primary/30"
          : "border-border bg-card text-muted-foreground shadow-sm hover:border-primary/30 hover:text-primary hover:-translate-y-0.5"
      )}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
      <Icon className="relative w-5 h-5" />
    </button>
  );
}

export function DashboardSidebar({ recentSearches, onSelectSearch, onOpenChat, onOpenSaved, savedActive }: DashboardSidebarProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!historyOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHistoryOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [historyOpen]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return recentSearches;
    const needle = filter.trim().toLowerCase();
    return recentSearches.filter((s) => describeSearch(s).toLowerCase().includes(needle));
  }, [recentSearches, filter]);

  const groups = groupByDay(filtered.slice(0, 20));

  const selectAndClose = (search: RecentSearch) => {
    onSelectSearch(search);
    setHistoryOpen(false);
  };

  return (
    <aside className="hidden lg:flex flex-col items-center w-20 shrink-0 h-screen border-r border-border bg-background py-6 gap-3">
      <div className="relative">
        <SidebarIconButton icon={Clock} active={historyOpen} onClick={() => setHistoryOpen((o) => !o)} label="History" />

        {historyOpen && (
          <div
            ref={panelRef}
            className="absolute left-full top-0 ml-3 w-72 max-h-[70vh] overflow-y-auto no-scrollbar rounded-2xl border border-border bg-card shadow-xl p-4 z-20"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">History</p>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close"
                className="rounded-full p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search history..."
                className="w-full h-9 rounded-full border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
              />
            </div>

            {groups.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {filter ? "No matching history." : "Your searches will show up here."}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{group.label}</p>
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((search, i) => (
                        <button
                          key={`${group.label}-${i}`}
                          type="button"
                          onClick={() => selectAndClose(search)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-foreground hover:bg-secondary transition-colors"
                        >
                          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate">{describeSearch(search)}</span>
                          <span className="text-muted-foreground shrink-0">{formatTime(search.searchedAt)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SidebarIconButton icon={MessageCircle} onClick={onOpenChat} label="Chat" />
      <SidebarIconButton icon={Star} active={savedActive} onClick={onOpenSaved} label="Saved" />
    </aside>
  );
}

export default DashboardSidebar;

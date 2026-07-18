import type { KeyboardEvent } from "react";
import { Star, GitFork, ExternalLink, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Repo } from "@/types";

interface RepoCardProps {
  repo: Repo;
  view?: "grid" | "list";
  selected?: boolean;
  bookmarked?: boolean;
  onSelect?: (repo: Repo) => void;
  onToggleBookmark?: (repo: Repo) => void;
  onOpen?: (repo: Repo) => void;
}

function RepoAvatar({ repo, size = "w-9 h-9" }: { repo: Repo; size?: string }) {
  if (repo.avatarUrl) {
    return (
      <img
        src={repo.avatarUrl}
        alt=""
        className={cn(size, "rounded-xl object-cover border border-border shrink-0")}
      />
    );
  }
  return (
    <span className={cn(size, "rounded-xl bg-secondary text-secondary-foreground font-semibold flex items-center justify-center shrink-0")}>
      {repo.name.charAt(0).toUpperCase()}
    </span>
  );
}

export function RepoCard({ repo, view = "grid", selected, bookmarked, onSelect, onToggleBookmark, onOpen }: RepoCardProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(repo);
    }
  };

  if (view === "list") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(repo)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center gap-3 rounded-xl border bg-card shadow-sm p-3 cursor-pointer transition-colors",
          selected ? "border-primary bg-secondary/40" : "border-border hover:border-primary/30"
        )}
      >
        <RepoAvatar repo={repo} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground text-sm truncate">{repo.owner}/{repo.name}</p>
          <p className="text-xs text-muted-foreground truncate">{repo.description}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{repo.stars.toLocaleString()}</span>
          <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5" />{repo.forks.toLocaleString()}</span>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleBookmark?.(repo); }}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary transition-colors shrink-0"
          aria-label="Bookmark"
        >
          <Bookmark className={cn("w-4 h-4", bookmarked && "fill-primary text-primary")} />
        </button>
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { e.stopPropagation(); onOpen?.(repo); }}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary transition-colors shrink-0"
          aria-label="Open on GitHub"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(repo)}
      onKeyDown={handleKeyDown}
      className={cn(
        "group rounded-2xl border bg-card shadow-sm p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10",
        selected ? "border-primary shadow-lg shadow-primary/10" : "border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <RepoAvatar repo={repo} />
          <p className="font-semibold text-foreground truncate">{repo.name}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleBookmark?.(repo); }}
            className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
            aria-label="Bookmark"
          >
            <Bookmark className={cn("w-4 h-4", bookmarked && "fill-primary text-primary")} />
          </button>
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation(); onOpen?.(repo); }}
            className="p-1 rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
            aria-label="Open on GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {repo.description}
      </p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5" />
          {repo.stars.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="w-3.5 h-3.5" />
          {repo.forks.toLocaleString()}
        </span>
        {repo.language !== "Unknown" && (
          <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {repo.language}
          </span>
        )}
      </div>
    </div>
  );
}

export default RepoCard;

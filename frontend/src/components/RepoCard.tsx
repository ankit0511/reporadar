import { Star, GitFork, ExternalLink } from "lucide-react";
import type { Repo } from "@/types";

export function RepoCard({ repo, onClick }: { repo: Repo; onClick?: (repo: Repo) => void }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onClick?.(repo)}
      className="group rounded-2xl border border-border bg-card shadow-sm p-5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-foreground truncate">
          {repo.owner}/{repo.name}
        </p>
        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
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
    </a>
  );
}

export default RepoCard;

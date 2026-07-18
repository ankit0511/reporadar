import { useState } from "react";
import type { FormEvent } from "react";
import {
  Bookmark, ExternalLink, Star, GitFork, Scale, Clock, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Repo } from "@/types";

type Tab = "overview" | "readme" | "contributors";

interface RepoDetailPanelProps {
  repo: Repo | null;
  bookmarked?: boolean;
  onToggleBookmark?: (repo: Repo) => void;
  onOpen?: (repo: Repo) => void;
  onAskAi?: (question: string) => void;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "readme", label: "Readme" },
  { key: "contributors", label: "Contributors" },
];

export function RepoDetailPanel({ repo, bookmarked, onToggleBookmark, onOpen, onAskAi }: RepoDetailPanelProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [question, setQuestion] = useState("");

  if (!repo) {
    return (
      <aside className="hidden xl:flex flex-col w-80 shrink-0 h-screen border-l border-border bg-card items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Select a repository from the results to see its details here.
        </p>
      </aside>
    );
  }

  const handleAsk = (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    onAskAi?.(`About ${repo.owner}/${repo.name}: ${question.trim()}`);
    setQuestion("");
  };

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 h-screen border-l border-border bg-card">
      <div className="flex-1 overflow-y-auto no-scrollbar p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {repo.avatarUrl ? (
              <img src={repo.avatarUrl} alt="" className="w-9 h-9 rounded-xl object-cover border border-border shrink-0" />
            ) : (
              <span className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center font-semibold shrink-0">
                {repo.name.charAt(0).toUpperCase()}
              </span>
            )}
            <p className="font-semibold text-foreground truncate">{repo.name}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onToggleBookmark?.(repo)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
              aria-label="Bookmark"
            >
              <Bookmark className={cn("w-4 h-4", bookmarked && "fill-primary text-primary")} />
            </button>
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpen?.(repo)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
              aria-label="Open on GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{repo.description}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
          {repo.language !== "Unknown" && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{repo.stars.toLocaleString()}</span>
          <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5" />{repo.forks.toLocaleString()}</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="flex flex-col gap-3">
            {repo.license && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Scale className="w-4 h-4 text-muted-foreground" />
                {repo.license}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Star className="w-4 h-4 text-muted-foreground" />
              {repo.stars.toLocaleString()} stars
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <GitFork className="w-4 h-4 text-muted-foreground" />
              {repo.forks.toLocaleString()} forks
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Updated {new Date(repo.updated_at).toLocaleDateString()}
            </div>
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onOpen?.(repo)}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Open in GitHub
            </a>

            {repo.topics.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {repo.topics.map((topic) => (
                    <span key={topic} className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "readme" && (
          <p className="text-sm text-muted-foreground">
            Readme preview is coming soon — for now, open the repo on GitHub to read it.
          </p>
        )}

        {tab === "contributors" && (
          <p className="text-sm text-muted-foreground">
            Contributor list is coming soon.
          </p>
        )}
      </div>

      {/* Ask AI about this repo */}
      <form onSubmit={handleAsk} className="border-t border-border p-4 shrink-0">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Ask AI about this repo
        </p>
        <div className="flex items-center gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about this repository..."
            className="flex-1 h-10 rounded-full border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
          />
          <button
            type="submit"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary text-primary-foreground shrink-0"
            aria-label="Ask"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}

export default RepoDetailPanel;

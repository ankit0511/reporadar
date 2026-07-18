import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, RotateCcw, Sparkles, LayoutGrid, List as ListIcon,
  ChevronDown, ChevronLeft, ChevronRight, LogOut, SlidersHorizontal,
  Bookmark, MessageCircle, Info, Radar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { RepoDetailPanel } from "@/components/RepoDetailPanel";
import { RepoCard } from "@/components/RepoCard";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LANGUAGE_OPTIONS, TOPIC_OPTIONS, EXPERIENCE_LEVELS } from "@/lib/constants";
import type { Repo, Visit, VisitStatus, RecentSearch } from "@/types";

interface SearchQuery {
  q: string;
  language: string;
  topic: string;
  experience: string;
  sort: string;
  minStars: string;
}

const DEFAULT_SORT = "best-match";
const PAGE_SIZE = 9;

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "best-match", label: "Best Match" },
  { value: "stars", label: "Most Stars" },
  { value: "updated", label: "Recently Updated" },
  { value: "forks", label: "Most Forks" },
];

// Visits don't carry every field a search result does (no description,
// topics, license, avatar) — fill in sensible defaults for the Saved tab.
function visitToRepo(visit: Visit): Repo {
  return {
    id: visit.repoId,
    name: visit.name,
    owner: visit.owner,
    avatarUrl: null,
    description: "",
    url: visit.url,
    stars: visit.stars,
    forks: 0,
    language: visit.language,
    license: null,
    topics: [],
    updated_at: visit.lastVisitedAt,
    created_at: visit.firstVisitedAt,
  };
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

function navTabClass(active: boolean) {
  return cn(
    "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors",
    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
  );
}

export function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const aiInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState<SearchQuery>({
    q: "", language: "", topic: "", experience: "", sort: DEFAULT_SORT, minStars: "",
  });
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mainView, setMainView] = useState<"search" | "saved">("search");
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiClarify, setAiClarify] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiRepos, setAiRepos] = useState<Repo[]>([]);

  // Onboarding happens on the home page — bounce anyone who lands here
  // directly without an account or without having answered it yet.
  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.onboardingCompleted) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Load search/visit history once — independent of the search feed itself.
  useEffect(() => {
    if (!user?.onboardingCompleted) return;
    api.get("/api/activity/recent-searches").then((data) => setRecentSearches(data.searches ?? [])).catch(() => {});
    api.get("/api/activity/recent-visits").then((data) => setVisits(data.visits ?? [])).catch(() => {});
  }, [user?.onboardingCompleted]);

  // Fire-and-forget: logging a click must never block or break the
  // GitHub redirect (the anchor's default navigation is left untouched).
  const logVisit = (repo: Repo) => {
    api
      .post("/api/activity/visit", {
        repoId: repo.id,
        name: repo.name,
        owner: repo.owner,
        url: repo.url,
        language: repo.language,
        stars: repo.stars,
      })
      .then((data) => {
        if (!data.visit) return;
        setVisits((prev) => [data.visit, ...prev.filter((v) => v.repoId !== data.visit.repoId)]);
      })
      .catch(() => {});
  };

  const updateVisitStatus = (repoId: number, status: VisitStatus) => {
    setVisits((prev) => prev.map((v) => (v.repoId === repoId ? { ...v, status } : v)));
    api.patch(`/api/activity/visit/${repoId}`, { status }).catch(() => {});
  };

  // Bookmarking reuses the visit-status field ("starred") — if there's no
  // visit yet for this repo, create one first, then flip its status.
  const toggleBookmark = async (repo: Repo) => {
    const existing = visits.find((v) => v.repoId === repo.id);
    const nextStatus: VisitStatus = existing?.status === "starred" ? "visited" : "starred";

    if (!existing) {
      try {
        const data = await api.post("/api/activity/visit", {
          repoId: repo.id,
          name: repo.name,
          owner: repo.owner,
          url: repo.url,
          language: repo.language,
          stars: repo.stars,
        });
        if (data.visit) {
          setVisits((prev) => [{ ...data.visit, status: nextStatus }, ...prev.filter((v) => v.repoId !== repo.id)]);
        }
      } catch {
        return;
      }
    }

    updateVisitStatus(repo.id, nextStatus);
  };

  const isBookmarked = (repoId: number) => visits.some((v) => v.repoId === repoId && v.status === "starred");

  const runSearch = async (params: SearchQuery, pageArg = 1) => {
    if (!params.q && !params.language && !params.topic && !params.experience) {
      setError("Enter a keyword, or pick a language, topic, or experience level to search.");
      setRepos([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/api/repos/search", {
        q: params.q || undefined,
        language: params.language || undefined,
        topic: params.topic || undefined,
        experience: params.experience || undefined,
        stars: params.minStars || undefined,
        sort: params.sort || undefined,
        page: pageArg,
        limit: PAGE_SIZE,
      });
      const results: Repo[] = data.repositories ?? [];
      setRepos(results);
      setTotal(data.total ?? 0);
      setPage(data.page ?? pageArg);
      setSelectedRepo(results[0] ?? null);
    } catch {
      setError("Could not load repositories. Please try again.");
      setRepos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const runAiQuery = async (text: string) => {
    if (!text.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setAiClarify(null);
    setAiExplanation(null);
    setAiRepos([]);
    try {
      const data = await api.post("/api/ai/query", { query: text });
      if (data.type === "clarify") {
        setAiClarify(data.message ?? null);
      } else {
        const results: Repo[] = data.repositories ?? [];
        setAiExplanation(data.explanation ?? null);
        setAiRepos(results);
        if (results.length > 0) setSelectedRepo(results[0]);
      }
    } catch {
      setAiError("Could not process that query. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const submitAiQuery = (e: FormEvent) => {
    e.preventDefault();
    runAiQuery(aiQuery);
  };

  const handleAskAboutRepo = (question: string) => {
    setMainView("search");
    setAiQuery(question);
    runAiQuery(question);
  };

  const applyRecentSearch = (search: RecentSearch) => {
    const next: SearchQuery = {
      q: search.q || "",
      language: search.language || "",
      topic: search.topic || "",
      experience: search.experience || "",
      sort: DEFAULT_SORT,
      minStars: "",
    };
    setMainView("search");
    setQuery(next);
    runSearch(next);
  };

  const startNewChat = () => {
    setAiQuery("");
    setAiClarify(null);
    setAiExplanation(null);
    setAiRepos([]);
    setAiError(null);
    setMainView("search");
    aiInputRef.current?.focus();
  };

  // Seed the feed with the user's saved preferences once — after that,
  // searching is free-form and doesn't touch onboarding at all.
  useEffect(() => {
    if (!user?.onboardingCompleted) return;
    const initial: SearchQuery = {
      q: "",
      language: user.preference.language[0] ?? "",
      topic: user.preference.topic[0] ?? "",
      experience: user.preference.experience ?? "",
      sort: DEFAULT_SORT,
      minStars: "",
    };
    setQuery(initial);
    runSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.onboardingCompleted]);

  const savedRepos = useMemo(
    () => visits.filter((v) => v.status === "starred").map(visitToRepo),
    [visits]
  );

  if (!user || !user.onboardingCompleted) return null;

  const resetToPreferences = () => {
    const initial: SearchQuery = {
      q: "",
      language: user.preference.language[0] ?? "",
      topic: user.preference.topic[0] ?? "",
      experience: user.preference.experience ?? "",
      sort: DEFAULT_SORT,
      minStars: "",
    };
    setQuery(initial);
    runSearch(initial);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const gridClass = viewMode === "grid" ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-2";

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <DashboardSidebar
        recentSearches={recentSearches}
        onSelectSearch={applyRecentSearch}
        onOpenChat={startNewChat}
        onOpenSaved={() => setMainView("saved")}
        savedActive={mainView === "saved"}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-6 h-16 px-6 border-b border-border shrink-0">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-light to-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Radar className="w-4 h-4" />
            </span>
            <span className="font-bold text-base tracking-tight text-foreground">
              Repo<span className="text-primary">Radar</span>
            </span>
          </a>

          <nav className="flex items-center gap-1">
            <button type="button" onClick={() => { setMainView("search"); aiInputRef.current?.focus(); }} className={navTabClass(false)}>
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
            <button type="button" onClick={() => setMainView("search")} className={navTabClass(mainView === "search")}>
              <Search className="w-4 h-4" />
              Search
            </button>
            <button type="button" onClick={() => setMainView("saved")} className={navTabClass(mainView === "saved")}>
              <Bookmark className="w-4 h-4" />
              Saved
            </button>
            <button type="button" onClick={() => navigate("/?edit=preferences")} className={navTabClass(false)}>
              <SlidersHorizontal className="w-4 h-4" />
              Preferences
            </button>
            <button type="button" onClick={() => navigate("/")} className={navTabClass(false)}>
              <Info className="w-4 h-4" />
              About
            </button>
          </nav>

          <div className="flex-1" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-secondary transition-colors"
            >
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-border" />
              ) : (
                <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                  {user.userName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-sm font-medium text-foreground hidden sm:inline">{user.userName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-border bg-card shadow-lg p-1 z-10">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <main className="max-w-4xl mx-auto px-6 py-6">
            {mainView === "saved" ? (
              <>
                <h1 className="font-heading text-2xl font-black tracking-tight text-foreground mb-4">
                  Saved Repositories
                </h1>
                {savedRepos.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                    Bookmark a repository to see it here.
                  </div>
                ) : (
                  <div className={gridClass}>
                    {savedRepos.map((repo) => (
                      <RepoCard
                        key={repo.id}
                        repo={repo}
                        view={viewMode}
                        selected={selectedRepo?.id === repo.id}
                        bookmarked
                        onSelect={setSelectedRepo}
                        onToggleBookmark={toggleBookmark}
                        onOpen={logVisit}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Ask AI */}
                <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden mb-4">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light" />
                  <form onSubmit={submitAiQuery} className="p-4 flex flex-nowrap items-center gap-3 overflow-x-auto">
                    <div className="relative flex-1 min-w-40 shrink">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                      <Input
                        ref={aiInputRef}
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        placeholder="Ask AI — e.g. a beginner-friendly React project with good first issues"
                        className="pl-10"
                      />
                    </div>
                    <Button type="submit" variant="default" className="shrink-0" disabled={aiLoading}>
                      <Sparkles className="w-4 h-4" />
                      {aiLoading ? "Thinking..." : "Ask AI"}
                    </Button>
                  </form>
                </div>

                {(aiLoading || aiError || aiClarify || aiExplanation) && (
                  <div className="mb-8">
                    {aiLoading && (
                      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        Thinking about "{aiQuery}"...
                      </div>
                    )}

                    {!aiLoading && aiError && (
                      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-destructive">
                        {aiError}
                      </div>
                    )}

                    {!aiLoading && !aiError && aiClarify && (
                      <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-light/10 to-primary/5 p-4">
                        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-foreground">{aiClarify}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Add a bit more detail above and ask again.
                          </p>
                        </div>
                      </div>
                    )}

                    {!aiLoading && !aiError && !aiClarify && aiExplanation && (
                      <>
                        <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-light/10 to-primary/5 p-4 mb-4">
                          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm text-foreground">{aiExplanation}</p>
                        </div>

                        {aiRepos.length === 0 ? (
                          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                            No matches yet — try rephrasing your question.
                          </div>
                        ) : (
                          <div className={gridClass}>
                            {aiRepos.map((repo) => (
                              <RepoCard
                                key={repo.id}
                                repo={repo}
                                view={viewMode}
                                selected={selectedRepo?.id === repo.id}
                                bookmarked={isBookmarked(repo.id)}
                                onSelect={setSelectedRepo}
                                onToggleBookmark={toggleBookmark}
                                onOpen={logVisit}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">or search manually</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Search panel */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    runSearch(query, 1);
                  }}
                  className="rounded-2xl border border-border bg-card shadow-sm p-4 mb-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        value={query.q}
                        onChange={(e) => setQuery((prev) => ({ ...prev, q: e.target.value }))}
                        placeholder="Search repositories..."
                        className="pl-10"
                      />
                    </div>
                    <Button type="submit" variant="default" className="shrink-0">
                      <Search className="w-4 h-4" />
                      Search
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      value={query.language || "any"}
                      onValueChange={(value) => setQuery((prev) => ({ ...prev, language: value === "any" ? "" : value }))}
                    >
                      <SelectTrigger className="w-40 shrink-0">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any language</SelectItem>
                        {LANGUAGE_OPTIONS.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={query.topic || "any"}
                      onValueChange={(value) => setQuery((prev) => ({ ...prev, topic: value === "any" ? "" : value }))}
                    >
                      <SelectTrigger className="w-40 shrink-0">
                        <SelectValue placeholder="Topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any topic</SelectItem>
                        {TOPIC_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={query.sort}
                      onValueChange={(value) => setQuery((prev) => ({ ...prev, sort: value }))}
                    >
                      <SelectTrigger className="w-44 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button type="button" variant="outline" className="shrink-0" onClick={() => setShowMoreFilters((v) => !v)}>
                      <SlidersHorizontal className="w-4 h-4" />
                      More Filters
                    </Button>
                  </div>

                  {showMoreFilters && (
                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border">
                      <Select
                        value={query.experience || "any"}
                        onValueChange={(value) => setQuery((prev) => ({ ...prev, experience: value === "any" ? "" : value }))}
                      >
                        <SelectTrigger className="w-44 shrink-0">
                          <SelectValue placeholder="Experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any experience</SelectItem>
                          {EXPERIENCE_LEVELS.map((exp) => (
                            <SelectItem key={exp.value} value={exp.value}>{exp.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        min={0}
                        value={query.minStars}
                        onChange={(e) => setQuery((prev) => ({ ...prev, minStars: e.target.value }))}
                        placeholder="Min stars, e.g. 100"
                        className="w-44 shrink-0"
                      />
                    </div>
                  )}
                </form>

                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={resetToPreferences}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to my preferences
                  </button>

                  {!loading && !error && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        About {total.toLocaleString()} results found
                      </span>
                      <div className="flex items-center gap-1 rounded-full border border-border p-1">
                        <button
                          type="button"
                          onClick={() => setViewMode("grid")}
                          className={cn("p-1.5 rounded-full", viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground")}
                          aria-label="Grid view"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode("list")}
                          className={cn("p-1.5 rounded-full", viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground")}
                          aria-label="List view"
                        >
                          <ListIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Repo feed */}
                {loading && (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-2xl border border-border bg-card p-5 h-40 animate-pulse" />
                    ))}
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-2xl border border-border bg-card p-8 text-center">
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button variant="outline" onClick={() => runSearch(query, page)}>
                      Retry
                    </Button>
                  </div>
                )}

                {!loading && !error && repos.length === 0 && (
                  <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                    No repositories found. Try a different keyword, language, topic, or experience level.
                  </div>
                )}

                {!loading && !error && repos.length > 0 && (
                  <>
                    <div className={gridClass}>
                      {repos.map((repo) => (
                        <RepoCard
                          key={repo.id}
                          repo={repo}
                          view={viewMode}
                          selected={selectedRepo?.id === repo.id}
                          bookmarked={isBookmarked(repo.id)}
                          onSelect={setSelectedRepo}
                          onToggleBookmark={toggleBookmark}
                          onOpen={logVisit}
                        />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1 mt-6">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => runSearch(query, page - 1)}
                          className="p-2 rounded-lg border border-border text-muted-foreground disabled:opacity-40 hover:bg-secondary transition-colors"
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        {getPageNumbers(page, totalPages).map((p, i) =>
                          p === "..." ? (
                            <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">...</span>
                          ) : (
                            <button
                              key={p}
                              type="button"
                              onClick={() => runSearch(query, p)}
                              className={cn(
                                "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                                p === page
                                  ? "bg-gradient-to-br from-primary-light to-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-secondary"
                              )}
                            >
                              {p}
                            </button>
                          )
                        )}
                        <button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() => runSearch(query, page + 1)}
                          className="p-2 rounded-lg border border-border text-muted-foreground disabled:opacity-40 hover:bg-secondary transition-colors"
                          aria-label="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <RepoDetailPanel
        repo={selectedRepo}
        bookmarked={selectedRepo ? isBookmarked(selectedRepo.id) : false}
        onToggleBookmark={toggleBookmark}
        onOpen={logVisit}
        onAskAi={handleAskAboutRepo}
      />
    </div>
  );
}

export default Dashboard;

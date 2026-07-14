import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Settings2, Search, RotateCcw, Clock, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar, SidebarSection, SidebarEmpty } from "@/components/Sidebar";
import { RepoCard } from "@/components/RepoCard";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { LANGUAGE_OPTIONS, TOPIC_OPTIONS, EXPERIENCE_LEVELS } from "@/lib/constants";
import type { Repo, Visit, VisitStatus, RecentSearch } from "@/types";

interface SearchQuery {
  q: string;
  language: string;
  topic: string;
  experience: string;
}

const STATUS_LABELS: Record<VisitStatus, string> = {
  visited: "Just browsing",
  starred: "Starred",
  contributed: "Contributed",
  not_interested: "Not interested",
};

const STATUS_DOT_CLASSES: Record<VisitStatus, string> = {
  visited: "bg-muted-foreground/50",
  starred: "bg-primary",
  contributed: "bg-success",
  not_interested: "bg-muted-foreground/20",
};

function describeSearch(search: RecentSearch): string {
  if (search.q) return `"${search.q}"`;
  const parts = [search.language, search.topic, search.experience].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "All repositories";
}

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState<SearchQuery>({ q: "", language: "", topic: "", experience: "" });
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const submitAiQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setAiClarify(null);
    setAiExplanation(null);
    setAiRepos([]);
    try {
      const data = await api.post("/api/ai/query", { query: aiQuery });
      if (data.type === "clarify") {
        setAiClarify(data.message ?? null);
      } else {
        setAiExplanation(data.explanation ?? null);
        setAiRepos(data.repositories ?? []);
      }
    } catch {
      setAiError("Could not process that query. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const applyRecentSearch = (search: RecentSearch) => {
    const next: SearchQuery = {
      q: search.q || "",
      language: search.language || "",
      topic: search.topic || "",
      experience: search.experience || "",
    };
    setQuery(next);
    runSearch(next);
  };

  const runSearch = async (params: SearchQuery) => {
    if (!params.q && !params.language && !params.topic && !params.experience) {
      setError("Enter a keyword, or pick a language, topic, or experience level to search.");
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
        limit: 12,
      });
      setRepos(data.repositories ?? []);
    } catch {
      setError("Could not load repositories. Please try again.");
    } finally {
      setLoading(false);
    }
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
    };
    setQuery(initial);
    runSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.onboardingCompleted]);

  if (!user || !user.onboardingCompleted) return null;

  const resetToPreferences = () => {
    const initial: SearchQuery = {
      q: "",
      language: user.preference.language[0] ?? "",
      topic: user.preference.topic[0] ?? "",
      experience: user.preference.experience ?? "",
    };
    setQuery(initial);
    runSearch(initial);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Welcome */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Welcome back, {user.userName}
            </h1>
            <p className="text-muted-foreground mt-1">
              Search any language or topic — or start from your saved preferences
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/?edit=preferences")}>
            <Settings2 className="w-4 h-4" />
            Edit Preferences
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main column */}
          <div className="flex-1 w-full min-w-0">
            {/* Ask AI */}
            <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden mb-4">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light" />
              <form onSubmit={submitAiQuery} className="p-4 flex flex-nowrap items-center gap-3 overflow-x-auto">
                <div className="relative flex-1 min-w-40 shrink">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                  <Input
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
                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {aiRepos.map((repo) => (
                          <RepoCard key={repo.id} repo={repo} onClick={logVisit} />
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
            <div className="rounded-2xl border border-border bg-card shadow-sm p-4 mb-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch(query);
                }}
                className="flex flex-nowrap items-center gap-3 overflow-x-auto"
              >
                <div className="relative flex-1 min-w-40 shrink">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={query.q}
                    onChange={(e) => setQuery((prev) => ({ ...prev, q: e.target.value }))}
                    placeholder="Search repositories..."
                    className="pl-10"
                  />
                </div>

                <Select
                  value={query.language || "any"}
                  onValueChange={(value) => setQuery((prev) => ({ ...prev, language: value === "any" ? "" : value }))}
                >
                  <SelectTrigger className="w-36 shrink-0">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger> 
                  <SelectContent>
                    <SelectItem value="any">Language</SelectItem>
                    {LANGUAGE_OPTIONS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={query.topic || "any"}
                  onValueChange={(value) => setQuery((prev) => ({ ...prev, topic: value === "any" ? "" : value }))}
                >
                  <SelectTrigger className="w-36 shrink-0">
                    <SelectValue placeholder="Any topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Topic</SelectItem>
                    {TOPIC_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={query.experience || "any"}
                  onValueChange={(value) => setQuery((prev) => ({ ...prev, experience: value === "any" ? "" : value }))}
                >
                  <SelectTrigger className="w-40 shrink-0">
                    <SelectValue placeholder=" Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Experience</SelectItem>
                    {EXPERIENCE_LEVELS.map((exp) => (
                      <SelectItem key={exp.value} value={exp.value}>{exp.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button type="submit" variant="default" className="shrink-0">
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </form>
            </div>

            <button
              type="button"
              onClick={resetToPreferences}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to my preferences
            </button>

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
                <Button variant="outline" onClick={() => runSearch(query)}>
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
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {repos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} onClick={logVisit} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — reused for chat history and whatever else lands
              in a side panel later. */}
          <Sidebar>
            <SidebarSection title="Recently Viewed" icon={<Clock className="w-3.5 h-3.5 text-muted-foreground" />}>
              {visits.length === 0 ? (
                <SidebarEmpty>Repos you click through to on GitHub will show up here.</SidebarEmpty>
              ) : (
                <div className="flex flex-col gap-2">
                  {visits.map((visit) => (
                    <div key={visit.repoId} className="rounded-xl bg-secondary/40 p-3">
                      <a
                        href={visit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 mb-2 hover:text-primary transition-colors"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT_CLASSES[visit.status]}`} />
                        <span className="text-sm font-medium text-foreground truncate flex-1">
                          {visit.owner}/{visit.name}
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                      </a>
                      <Select
                        value={visit.status}
                        onValueChange={(value) => updateVisitStatus(visit.repoId, value as VisitStatus)}
                      >
                        <SelectTrigger className="w-full h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABELS) as VisitStatus[]).map((status) => (
                            <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </SidebarSection>

            <SidebarSection title="Recent Searches" icon={<Search className="w-3.5 h-3.5 text-muted-foreground" />}>
              {recentSearches.length === 0 ? (
                <SidebarEmpty>Your past searches will show up here.</SidebarEmpty>
              ) : (
                <div className="flex flex-col gap-1">
                  {recentSearches.slice(0, 8).map((search, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyRecentSearch(search)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-secondary transition-colors truncate"
                    >
                      {describeSearch(search)}
                    </button>
                  ))}
                </div>
              )}
            </SidebarSection>
          </Sidebar>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

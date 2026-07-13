import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, GitFork, ExternalLink, Settings2, Search, RotateCcw } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { LANGUAGE_OPTIONS, TOPIC_OPTIONS } from "@/lib/constants";
import type { Repo } from "@/types";

interface SearchQuery {
  q: string;
  language: string;
  topic: string;
}

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState<SearchQuery>({ q: "", language: "", topic: "" });
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Onboarding happens on the home page — bounce anyone who lands here
  // directly without an account or without having answered it yet.
  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.onboardingCompleted) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const runSearch = async (params: SearchQuery) => {
    if (!params.q && !params.language && !params.topic) {
      setError("Enter a keyword, or pick a language/topic to search.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/api/repos/search", {
        q: params.q || undefined,
        language: params.language || undefined,
        topic: params.topic || undefined,
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
    };
    setQuery(initial);
    runSearch(initial);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
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

        {/* Search bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="flex flex-wrap items-center gap-3 mb-4"
        >
          <div className="relative flex-1 min-w-55">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query.q}
              onChange={(e) => setQuery((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Search repositories, e.g. chatbot, cli tool..."
              className="pl-10"
            />
          </div>

          <Select
            value={query.language || "any"}
            onValueChange={(value) => setQuery((prev) => ({ ...prev, language: value === "any" ? "" : value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Any language" />
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
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Any topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any topic</SelectItem>
              {TOPIC_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="submit" variant="dark">
            <Search className="w-4 h-4" />
            Search
          </Button>
        </form>

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            No repositories found. Try a different keyword, language, or topic.
          </div>
        )}

        {!loading && !error && repos.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <a
                key={repo.id}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30"
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;

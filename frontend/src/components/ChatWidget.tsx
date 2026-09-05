import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Radar as RadarIcon, MousePointer2, Search, Check, Star, Package, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:5000";

interface WidgetRepo {
  id: number;
  name: string;
  owner: string;
  description: string;
  stars: number;
  url: string;
}

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  content: string;
  time: string;
  // Present when this assistant turn returned search results.
  repos?: WidgetRepo[];
  total?: number;
  resultQuery?: string;
  // Renders a "Sign in with GitHub" button under the bubble.
  signInPrompt?: boolean;
}

const formatTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatStars = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

const INITIAL_MESSAGE: ChatMessage = {
  id: 0,
  role: "assistant",
  content:
    "Hi! Tell me what kind of open source project you're looking for — a language, a topic, or how experienced you are.",
  time: formatTime(),
};

const TOPIC_CHIPS = ["⚛️ React", "🟢 Node.js", "🟣 Machine Learning", "⭐ Good First Issues", "🎃 Hacktoberfest"];

const DEMO_QUERY = "I'm looking for React projects with good first issues.";

// The auto-playing intro is a scripted showcase — canned repos, no API call.
// Real queries (logged-in users only) go through /api/ai/query instead.
const DEMO_RESPONSE = "Nice — React with good first issues is a great place to start. Here are a few picks:";

const DEMO_REPOS: WidgetRepo[] = [
  { id: -1, name: "query", owner: "TanStack", description: "Powerful data synchronization for React", stars: 27600, url: "https://github.com/TanStack/query" },
  { id: -2, name: "ui", owner: "shadcn-ui", description: "Beautifully designed components", stars: 24100, url: "https://github.com/shadcn-ui/ui" },
  { id: -3, name: "react", owner: "facebook", description: "The library for web and native user interfaces", stars: 216000, url: "https://github.com/facebook/react" },
];

const SIGN_IN_MESSAGE =
  "To search real repositories, please sign in with GitHub first — it takes a few seconds, and I'll tailor results to you.";

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function centerOf(el: HTMLElement, container: HTMLElement) {
  const r = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 };
}

// Reveals `text` a few characters at a time, like a message being typed live.
function TypedText({ text, speed = 50 }: { text: string; speed?: number }) {
  const [count, setCount] = useState(0);
  const [prevText, setPrevText] = useState(text);

  // Reset the animation during render when the text prop changes, instead of
  // in the effect — avoids an extra cascading render (react.dev/learn/you-might-not-need-an-effect).
  if (prevText !== text) {
    setPrevText(text);
    setCount(0);
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCount((prev) => {
        if (prev >= text.length) {
          window.clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, speed);
    return () => window.clearInterval(interval);
  }, [text, speed]);

  const done = count >= text.length;

  return (
    <>
      {text.slice(0, count)}
      {!done && <span className="inline-block w-1.5 h-3.5 -mb-0.5 ml-0.5 bg-current animate-pulse" />}
    </>
  );
}

export function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, pressed: false });
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);
  const interruptedRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSignIn = () => {
    window.location.href = `${API_BASE}/api/auth/github`;
  };

  // Real queries use the same live pipeline as the dashboard chat:
  // /api/ai/query decides whether to chat, ask a follow-up, or run a real
  // GitHub search. Guests are stopped before the API and asked to sign in.
  const sendQuery = async (query: string) => {
    if (!query.trim() || loadingRef.current) return;
    interruptedRef.current = true;
    setCursor((c) => ({ ...c, visible: false }));

    const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.content }));

    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: query.trim(), time: formatTime() }]);
    setInput("");

    if (!isLoggedIn) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: "assistant",
        content: SIGN_IN_MESSAGE,
        time: formatTime(),
        signInPrompt: true,
      }]);
      return;
    }
    loadingRef.current = true;
    setLoading(true);

    try {
      const data = await api.post("/api/ai/query", { query: query.trim(), history });

      if (data.type === "chat" || data.type === "clarify") {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          role: "assistant",
          content: data.message ?? "Could you tell me a bit more?",
          time: formatTime(),
        }]);
      } else {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          role: "assistant",
          content: data.explanation ?? "Here's what I found.",
          time: formatTime(),
          repos: (data.repositories ?? []).slice(0, 3),
          total: data.total,
          resultQuery: query.trim(),
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: "assistant",
        content: "Something went wrong processing that — please try again.",
        time: formatTime(),
      }]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  // Scripted response for the intro demo — canned repos, staged "searching"
  // pause, zero API calls. Purely a showcase of what the assistant does.
  const playDemoResponse = async () => {
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: DEMO_QUERY, time: formatTime() }]);
    setInput("");
    setLoading(true);
    await wait(1100);
    setLoading(false);
    setMessages((prev) => [...prev, {
      id: Date.now() + 1,
      role: "assistant",
      content: DEMO_RESPONSE,
      time: formatTime(),
      repos: DEMO_REPOS,
      total: 247,
      resultQuery: DEMO_QUERY,
    }]);
  };

  // Idle demo: an animated cursor walks up to the input, "types" a sample
  // query, clicks send, and a canned response plays — showing how the widget
  // works before the visitor has touched it. Any real keystroke cancels it.
  useEffect(() => {
    // StrictMode runs this effect twice in dev (mount → cleanup → mount);
    // reset the flag each time so the second, real mount isn't immediately
    // cancelled by the first mount's cleanup.
    interruptedRef.current = false;

    const runDemo = async () => {
      await wait(1500);
      const container = containerRef.current;
      const inputEl = inputRef.current;
      const btnEl = sendBtnRef.current;
      if (interruptedRef.current || !container || !inputEl || !btnEl) return;

      setCursor({ ...centerOf(inputEl, container), visible: true, pressed: false });
      await wait(600);
      if (interruptedRef.current) return;

      setCursor((c) => ({ ...c, pressed: true }));
      inputEl.focus();
      await wait(180);
      if (interruptedRef.current) return;
      setCursor((c) => ({ ...c, pressed: false }));

      for (let i = 1; i <= DEMO_QUERY.length; i++) {
        if (interruptedRef.current) return;
        setInput(DEMO_QUERY.slice(0, i));
        await wait(35);
      }

      await wait(450);
      if (interruptedRef.current) return;

      setCursor((c) => ({ ...c, ...centerOf(btnEl, container) }));
      await wait(500);
      if (interruptedRef.current) return;

      setCursor((c) => ({ ...c, pressed: true }));
      await wait(180);
      if (interruptedRef.current) return;
      setCursor((c) => ({ ...c, visible: false }));

      playDemoResponse();
    };

    runDemo();
    return () => {
      interruptedRef.current = true;
    };
  }, []);

  const cancelDemo = () => {
    interruptedRef.current = true;
    setCursor((c) => ({ ...c, visible: false }));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl shadow-black/[0.04] overflow-hidden flex flex-col h-[30rem] sm:h-[32rem]"
    >
      {/* Animated demo cursor */}
      {cursor.visible && (
        <MousePointer2
          className={cn(
            "pointer-events-none absolute z-20 w-5 h-5 text-foreground drop-shadow-md transition-transform duration-500 ease-out",
            cursor.pressed && "scale-75"
          )}
          style={{ left: cursor.x, top: cursor.y, transform: "translate(-15%, -10%)" }}
          fill="hsl(var(--card))"
        />
      )}

      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-border bg-secondary/50 px-4 py-3 shrink-0">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-primary/50" />
          <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
        </div>
        <div className="flex items-center gap-1.5 ml-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">RepoRadar Assistant</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} data-inner-scroll className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
        {messages.map((message, i) => (
          <div key={message.id} className={cn("flex flex-col", message.role === "user" && "items-end")}>
            <div className={cn("flex items-end gap-2", message.role === "user" && "flex-row-reverse")}>
              {message.role === "assistant" ? (
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-primary-light to-primary text-primary-foreground shrink-0">
                  <RadarIcon className="w-3.5 h-3.5" />
                </span>
              ) : user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-border"
                />
              ) : (
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-muted-foreground shrink-0 border border-border">
                  <UserIcon className="w-3.5 h-3.5" />
                </span>
              )}
              <p
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  message.role === "assistant"
                    ? "bg-secondary text-foreground rounded-bl-sm"
                    : "bg-primary/10 text-foreground rounded-br-sm"
                )}
              >
                {message.role === "assistant" && i === messages.length - 1 && !loading && !message.repos ? (
                  <TypedText text={message.content} />
                ) : (
                  message.content
                )}
              </p>
            </div>
            <span
              className={cn(
                "flex items-center gap-1 text-[11px] text-muted-foreground mt-1",
                message.role === "user" ? "mr-9" : "ml-9"
              )}
            >
              {message.time}
              {message.role === "user" && <Check className="w-3 h-3 text-primary" />}
            </span>

            {/* Guest tried to search — offer the login instead */}
            {message.signInPrompt && (
              <div className="w-full pl-9 mt-1">
                <Button type="button" variant="dark" size="sm" onClick={handleSignIn}>
                  Sign in with GitHub
                </Button>
              </div>
            )}

            {/* Search results attached to this assistant turn */}
            {message.repos && (
              <div className="w-full pl-9 space-y-2.5 mt-1">
                {typeof message.total === "number" && (
                  <div className="flex items-center gap-2 rounded-xl bg-secondary px-3.5 py-2.5">
                    <Search className="w-3.5 h-3.5 text-primary" />
                    <p className="text-xs text-muted-foreground">
                      Found <span className="font-semibold text-foreground">{message.total.toLocaleString()}</span> repositories 🚀
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {message.repos.map((repo) => (
                    <a
                      key={repo.id}
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm transition-colors hover:border-primary/40"
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary shrink-0">
                        <Package className="w-4 h-4 text-primary" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {repo.owner} / {repo.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{repo.description}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Star className="w-3 h-3 text-primary" fill="hsl(var(--primary))" />
                        {formatStars(repo.stars)}
                      </span>
                    </a>
                  ))}
                </div>

                {!isLoggedIn ? (
                  <Button type="button" variant="dark" size="sm" onClick={handleSignIn}>
                    Sign in with GitHub to save these matches
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => navigate(`/dashboard?q=${encodeURIComponent(message.resultQuery ?? "")}`)}
                  >
                    View all results
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Waiting on the live API */}
        {loading && (
          <div className="pl-9">
            <div className="flex items-center gap-2 rounded-xl bg-secondary px-3.5 py-2.5">
              <Search className="w-3.5 h-3.5 text-primary animate-pulse" />
              <p className="text-xs text-muted-foreground">Searching for the best matches...</p>
            </div>
          </div>
        )}

        {/* Quick topic chips under the conversation */}
        <div className="flex flex-wrap gap-1.5 pt-0.5 pl-9">
          {TOPIC_CHIPS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => sendQuery(topic.replace(/^\S+\s/, ""))}
              className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3 shrink-0">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            interruptedRef.current = true;
            setCursor((c) => ({ ...c, visible: false }));
            setInput(e.target.value);
          }}
          onFocus={cancelDemo}
          placeholder="Ask about repos, languages, topics..."
          className="flex-1"
        />
        <Button ref={sendBtnRef} type="submit" size="icon" aria-label="Send" disabled={!input.trim() || loading}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

export default ChatWidget;

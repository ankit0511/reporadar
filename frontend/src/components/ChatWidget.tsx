import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Radar as RadarIcon, MousePointer2, Search, Check, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:5000";
const GUEST_AVATAR = "https://randomuser.me/api/portraits/men/32.jpg";

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  content: string;
  time: string;
}

interface SearchResults {
  query: string;
  phase: "searching" | "done";
}

const formatTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const INITIAL_MESSAGE: ChatMessage = {
  id: 0,
  role: "assistant",
  content:
    "Hi! Tell me what kind of open source project you're looking for — a language, a topic, or how experienced you are.",
  time: formatTime(),
};

const CANNED_REPOS = [
  { name: "TanStack / query", description: "Powerful data synchronization for React", stars: "27.6k" },
  { name: "shadcn-ui / ui", description: "Beautifully designed components", stars: "24.1k" },
  { name: "facebook / react", description: "The library for web and native user interfaces", stars: "216k" },
];

const TOPIC_CHIPS = ["⚛️ React", "🟢 Node.js", "🟣 Machine Learning", "⭐ Good First Issues", "🎃 Hacktoberfest"];

const DEMO_QUERY = "I'm looking for React projects with good first issues.";

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function centerOf(el: HTMLElement, container: HTMLElement) {
  const r = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 };
}

// Reveals `text` a few characters at a time, like a message being typed live.
function TypedText({ text, speed = 50 }: { text: string; speed?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
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
  const [results, setResults] = useState<SearchResults | null>(null);
  const [input, setInput] = useState("");
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, pressed: false });
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);
  const interruptedRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, results]);

  const handleSignIn = () => {
    window.location.href = `${API_BASE}/api/auth/github`;
  };

  const sendQuery = (query: string) => {
    if (!query.trim()) return;
    interruptedRef.current = true;
    setCursor((c) => ({ ...c, visible: false }));

    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: query, time: formatTime() }]);
    setInput("");
    setResults({ query, phase: "searching" });

    window.setTimeout(() => {
      setResults({ query, phase: "done" });
    }, 1100);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  // Idle demo: an animated cursor walks up to the input, "types" a sample
  // query, then clicks send — showing how the widget works before the
  // visitor has touched it themselves. Any real keystroke cancels it.
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

      sendQuery(DEMO_QUERY);
    };

    runDemo();
    return () => {
      interruptedRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              ) : (
                <img
                  src={user?.avatar || GUEST_AVATAR}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-border"
                />
              )}
              <p
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  message.role === "assistant"
                    ? "bg-secondary text-foreground rounded-bl-sm"
                    : "bg-primary/10 text-foreground rounded-br-sm"
                )}
              >
                {message.role === "assistant" && i === messages.length - 1 && !results ? (
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
          </div>
        ))}

        {results && (
          <div className="pl-9 space-y-2.5">
            <div className="flex items-center gap-2 rounded-xl bg-secondary px-3.5 py-2.5">
              <Search className={cn("w-3.5 h-3.5 text-primary", results.phase === "searching" && "animate-pulse")} />
              <p className="text-xs text-muted-foreground">
                {results.phase === "searching" ? (
                  "Searching for the best matches..."
                ) : (
                  <>
                    Found <span className="font-semibold text-foreground">247</span> repositories 🚀
                  </>
                )}
              </p>
            </div>

            {results.phase === "done" && (
              <>
                <div className="space-y-2">
                  {CANNED_REPOS.map((repo) => (
                    <div
                      key={repo.name}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm"
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary shrink-0">
                        <Package className="w-4 h-4 text-primary" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{repo.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{repo.description}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Star className="w-3 h-3 text-primary" fill="hsl(var(--primary))" />
                        {repo.stars}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
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

                {!isLoggedIn ? (
                  <Button type="button" variant="dark" size="sm" onClick={handleSignIn}>
                    Sign in with GitHub to save these matches
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => navigate(`/dashboard?q=${encodeURIComponent(results.query)}`)}
                  >
                    View all results
                  </Button>
                )}
              </>
            )}
          </div>
        )}
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
        <Button ref={sendBtnRef} type="submit" size="icon" aria-label="Send" disabled={!input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

export default ChatWidget;

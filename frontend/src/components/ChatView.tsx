import type { FormEvent, RefObject } from "react";
import { useEffect, useRef } from "react";
import { Sparkles, Send, RotateCcw, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RepoCard } from "@/components/RepoCard";
import { cn } from "@/lib/utils";
import type { Repo } from "@/types";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  repositories?: Repo[];
  time: string;
}

interface ChatViewProps {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  userAvatar: string | null;
  userName: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onNewChat: () => void;
  onBack: () => void;
  isBookmarked: (repoId: number) => boolean;
  onToggleBookmark: (repo: Repo) => void;
  onOpen: (repo: Repo) => void;
}

const SUGGESTIONS = [
  "A beginner-friendly React project with good first issues",
  "Python CLI tools that need contributors",
  "Well-documented machine learning libraries",
];

export function ChatView({
  messages, input, loading, inputRef, userAvatar, userName,
  onInputChange, onSubmit, onNewChat, onBack, isBookmarked, onToggleBookmark, onOpen,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full px-6">
      {/* Header */}
      <div className="flex items-center justify-between py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to dashboard"
            title="Back to dashboard"
            className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            Chat with RepoRadar AI
          </h1>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          New chat
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar py-6 flex flex-col gap-5">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-light to-primary text-primary-foreground shadow-md shadow-primary/30">
              <Sparkles className="w-6 h-6" />
            </span>
            <div>
              <p className="font-semibold text-foreground mb-1">Tell me what you're looking for</p>
              <p className="text-sm text-muted-foreground">
                A language, a topic, how experienced you are — I'll find repositories that fit.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onInputChange(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={cn("flex items-start gap-2.5", message.role === "user" && "flex-row-reverse")}>
            {message.role === "assistant" ? (
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-light to-primary text-primary-foreground shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
            ) : userAvatar ? (
              <img src={userAvatar} alt="" className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold shrink-0">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}

            <div className={cn("max-w-[80%] flex flex-col gap-2", message.role === "user" && "items-end")}>
              <p
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  message.role === "assistant"
                    ? "bg-secondary text-foreground rounded-tl-sm"
                    : "bg-primary/10 text-foreground rounded-tr-sm"
                )}
              >
                {message.text}
              </p>

              {message.repositories && message.repositories.length > 0 && (
                <div className="flex flex-col gap-2 w-full">
                  {message.repositories.map((repo) => (
                    <RepoCard
                      key={repo.id}
                      repo={repo}
                      view="list"
                      bookmarked={isBookmarked(repo.id)}
                      onToggleBookmark={onToggleBookmark}
                      onOpen={onOpen}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-light to-primary text-primary-foreground shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
            <p className="rounded-2xl rounded-tl-sm bg-secondary text-muted-foreground text-sm px-4 py-2.5">
              Thinking...
            </p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="border-t border-border py-4 shrink-0 flex items-center gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Ask about repos, languages, topics..."
          className="flex-1"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary text-primary-foreground shrink-0 disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default ChatView;

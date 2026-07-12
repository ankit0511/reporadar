import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Bug, MessageCircle, Lightbulb, Paperclip, Send, Radar as RadarIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 4000;

type Category = "bug" | "feedback" | "idea";

const CATEGORIES: { key: Category; label: string; icon: typeof Bug }[] = [
  { key: "bug", label: "Bug", icon: Bug },
  { key: "feedback", label: "Feedback", icon: MessageCircle },
  { key: "idea", label: "Idea", icon: Lightbulb },
];

export function ContactSection() {
  const [category, setCategory] = useState<Category>("feedback");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || status !== "idle") return;

    setStatus("sending");
    // No backend yet — this is a dummy submit, swap for a real endpoint later.
    window.setTimeout(() => setStatus("sent"), 900);
  };

  return (
    <section className="relative w-screen h-screen shrink-0 snap-start overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-full flex items-center pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Heading + decorative mockup */}
          <div className="relative max-w-lg">
            <div className="relative mb-10 hidden sm:block h-40">
              <div
                className={cn(
                  "absolute left-0 top-4 w-56 rotate-[-6deg] rounded-2xl border border-border bg-card shadow-xl overflow-hidden transition-all duration-500",
                  status === "sent" ? "blur-none opacity-100 ring-2 ring-primary/40 scale-105" : "blur-[2px] opacity-80"
                )}
              >
                <div className="flex items-center gap-1.5 border-b border-border bg-secondary/50 px-3 py-2">
                  <span className="w-2 h-2 rounded-full bg-destructive/60" />
                  <span className="w-2 h-2 rounded-full bg-primary/50" />
                  <span className="w-2 h-2 rounded-full bg-success/60" />
                </div>
                <div className="p-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-primary text-primary-foreground shrink-0">
                    <RadarIcon className="w-4 h-4" />
                  </span>
                  <p className="text-xs text-muted-foreground">Thanks for the thock!</p>
                </div>
              </div>
              <div className="absolute left-24 top-0 w-44 rotate-[5deg] rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-light to-primary shadow-xl p-4">
                <MessageCircle className="w-5 h-5 text-primary-foreground mb-2" />
                <p className="text-xs text-primary-foreground/90">
                  Every message goes straight to the people building this.
                </p>
              </div>
            </div>

            <h2 className="font-heading text-4xl sm:text-5xl font-black leading-tight tracking-tight text-foreground mb-4">
              Found a bug?
              <br />
              Got an{" "}
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                idea
              </span>
              ?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Pick a type. Tell us what's up. We'll take it from there.
            </p>
          </div>

          {/* Form */}
          <div className="max-w-lg w-full">
            <div className="flex items-center gap-6 mb-6">
              {CATEGORIES.map(({ key, label, icon: Icon }) => {
                const active = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center w-14 h-14 rounded-2xl border shadow-sm transition-all",
                        active
                          ? "bg-gradient-to-br from-primary-light to-primary border-primary/40 text-primary-foreground scale-105"
                          : "bg-card border-border text-muted-foreground group-hover:border-primary/30"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className={cn("text-xs", active ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative rounded-2xl border border-border bg-card shadow-sm focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
                  placeholder="What's working, what isn't, what feels off?"
                  rows={5}
                  className="w-full resize-none rounded-2xl bg-transparent p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <span className="absolute bottom-3 right-4 text-xs text-muted-foreground">
                  {message.length}/{MAX_LENGTH}
                </span>
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional, recommended if you'd like a reply)"
                className="w-full rounded-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none shadow-sm focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all"
              />

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm hover:bg-secondary transition-colors"
                >
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  {file ? file.name : "Attach screenshot"}
                </button>
                <span className="text-xs text-muted-foreground">Optional · 3 MB max</span>
              </div>

              <div className="pt-2 text-center">
                {status === "sent" ? (
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                    <Check className="w-4 h-4" />
                    Thanks — we've got it. We'll get back to you soon.
                  </p>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    variant="dark"
                    disabled={!message.trim() || status === "sending"}
                    className="w-full sm:w-auto"
                  >
                    <Send className="w-4 h-4" />
                    {status === "sending" ? "Sending..." : "Send Feedback"}
                  </Button>
                )}

                <p className="text-xs text-muted-foreground mt-3">
                  No account needed. We don't share your email.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;

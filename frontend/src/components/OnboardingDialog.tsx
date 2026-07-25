import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANGUAGE_OPTIONS, TOPIC_OPTIONS } from "@/lib/constants";
import type { UserPreference } from "@/types";

const EXPERIENCE_OPTIONS: { value: UserPreference["experience"]; title: string; desc: string }[] = [
  { value: "beginner", title: "Beginner", desc: "New to open source — I want guided, well-documented issues." },
  { value: "intermediate", title: "Intermediate", desc: "Comfortable contributing — I can dig into unfamiliar codebases." },
  { value: "expert", title: "Expert", desc: "Experienced — give me complex, high-impact work." },
];

const CONTRIBUTED_OPTIONS: { value: boolean; title: string; desc: string }[] = [
  { value: true, title: "Yes", desc: "I've opened PRs or issues on open source before." },
  { value: false, title: "No", desc: "This will be my first time contributing." },
];

const STEPS = [
  { title: "Which languages do you work with?", subtitle: "Select all that apply — we'll prioritize repos that match." },
  { title: "What topics interest you?", subtitle: "Pick a few areas you'd like to contribute to." },
  { title: "What's your experience level?", subtitle: "This helps us match issue difficulty to your comfort zone." },
  { title: "Contributed to open source before?", subtitle: "No wrong answer — we'll tailor recommendations either way." },
];

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium border transition-all",
        selected
          ? "bg-gradient-to-br from-primary-light to-primary text-primary-foreground border-transparent shadow-sm shadow-primary/30"
          : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-secondary"
      )}
    >
      {label}
    </button>
  );
}

function OptionCard({
  title,
  desc,
  selected,
  onClick,
}: {
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border p-5 transition-all flex items-start justify-between gap-3",
        selected
          ? "border-primary bg-secondary/60 shadow-sm"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary/30"
      )}
    >
      <div>
        <p className="font-semibold text-foreground mb-1">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <span
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full border shrink-0 mt-0.5",
          selected ? "bg-primary border-primary text-primary-foreground" : "border-border"
        )}
      >
        {selected && <Check className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
}

export function OnboardingDialog({
  onSubmit,
  onClose,
}: {
  onSubmit: (preference: UserPreference) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<string[]>([]);
  const [topic, setTopic] = useState<string[]>([]);
  const [experience, setExperience] = useState<UserPreference["experience"]>("");
  const [hasContributed, setHasContributed] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], value: string, setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const canProceed =
    step === 0 ? language.length > 0 :
    step === 1 ? topic.length > 0 :
    step === 2 ? experience !== "" :
    hasContributed !== null;

  const isLastStep = step === STEPS.length - 1;

  const handleNext = async () => {
    if (!canProceed) return;

    if (!isLastStep) {
      setStep((s) => s + 1);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        language,
        topic,
        experience,
        hasContributed: hasContributed ?? false,
      });
    } catch {
      setError("Something went wrong saving your preferences. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="min-h-[420px] flex flex-col"
      >
        {/* Progress */}
        <div className="flex items-center gap-2 mb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-gradient-to-r from-primary to-primary-light" : "bg-border"
              )}
            />
          ))}
        </div>
        <p className="text-xs font-medium text-muted-foreground mb-6">
          Step {step + 1} of {STEPS.length}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1"
          >
            <h2 className="font-heading text-2xl font-black tracking-tight text-foreground mb-2">
              {STEPS[step].title}
            </h2>
            <p className="text-muted-foreground mb-6">{STEPS[step].subtitle}</p>

            {step === 0 && (
              <div className="flex flex-wrap gap-2.5">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <Chip
                    key={lang}
                    label={lang}
                    selected={language.includes(lang)}
                    onClick={() => toggle(language, lang, setLanguage)}
                  />
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-wrap gap-2.5">
                {TOPIC_OPTIONS.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    selected={topic.includes(t)}
                    onClick={() => toggle(topic, t, setTopic)}
                  />
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-3">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    title={opt.title}
                    desc={opt.desc}
                    selected={experience === opt.value}
                    onClick={() => setExperience(opt.value)}
                  />
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-3">
                {CONTRIBUTED_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.title}
                    title={opt.title}
                    desc={opt.desc}
                    selected={hasContributed === opt.value}
                    onClick={() => setHasContributed(opt.value)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="text-sm text-destructive mt-4">{error}</p>}

        {/* Nav */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button variant="outline" onClick={handleBack} disabled={step === 0 || submitting}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button variant="dark" onClick={handleNext} disabled={!canProceed || submitting}>
            {submitting ? "Saving..." : isLastStep ? "Find My Repos" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingDialog;

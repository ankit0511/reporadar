import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { GlobalUsersSection } from "@/components/GlobalUsersSection";
import { FeatureGrid } from "@/components/FeatureGrid";
import { ContactSection } from "@/components/ContactSection";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { UserPreference } from "@/types";

const PANEL_COUNT = 4;

export function Landing() {
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const { user, loading: authLoading, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Once a user signs in successfully, ask onboarding questions right here
  // on the home page before ever sending them to the dashboard. Also opens
  // when linked to from the dashboard's "Edit Preferences" button.
  const showOnboarding =
    !authLoading && !!user && (!user.onboardingCompleted || searchParams.get("edit") === "preferences");

  const handleOnboardingSubmit = async (preference: UserPreference) => {
    if (!user) return;
    await api.post(`/api/preference/${user.githubId}`, preference);
    setUser({ ...user, onboardingCompleted: true, preference });
    navigate("/dashboard");
  };

  // The page scrolls horizontally instead of vertically: each wheel/trackpad
  // gesture advances exactly one full panel, rather than nudging scrollLeft
  // (which fights CSS scroll-snap and barely moves).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Let nested scrollable regions (like the chat widget's message list)
      // handle their own scrolling first — only hijack for page-panel
      // navigation once that inner area has hit its scroll boundary.
      const innerScroll = (e.target as HTMLElement).closest<HTMLElement>("[data-inner-scroll]");
      if (innerScroll) {
        const canScrollDown = e.deltaY > 0 && innerScroll.scrollTop + innerScroll.clientHeight < innerScroll.scrollHeight - 1;
        const canScrollUp = e.deltaY < 0 && innerScroll.scrollTop > 0;
        if (canScrollDown || canScrollUp) return;
      }

      e.preventDefault();
      if (isAnimatingRef.current) return;

      // Resync from actual scroll position first, in case a native trackpad
      // swipe (deltaX-dominant, let through above) moved it independently.
      indexRef.current = Math.round(track.scrollLeft / track.clientWidth);

      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIndex = Math.min(PANEL_COUNT - 1, Math.max(0, indexRef.current + direction));
      if (nextIndex === indexRef.current) return;

      indexRef.current = nextIndex;
      isAnimatingRef.current = true;
      track.scrollTo({ left: nextIndex * track.clientWidth, behavior: "smooth" });
      window.setTimeout(() => {
        isAnimatingRef.current = false;
      }, 650);
    };

    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <Header />

      {showOnboarding && <OnboardingDialog onSubmit={handleOnboardingSubmit} />}

      <div
        ref={trackRef}
        id="landing-track"
        className="h-screen w-screen flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth no-scrollbar"
      >
        <Hero />
        <GlobalUsersSection />
        <FeatureGrid />
        <ContactSection />
      </div>
    </div>
  );
}

export default Landing;

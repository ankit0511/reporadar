import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { Footer } from "@/components/Footer";
import { HexagonPattern } from "@/components/HexagonPattern";

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <StatsBar />
      <Footer />

      {/* Mounted once, fixed to the viewport — no need to re-add per section. */}
      <HexagonPattern corner="top-left" />
      <HexagonPattern corner="bottom-right" />
    </div>
  );
}

export default Landing;

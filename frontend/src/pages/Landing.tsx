import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { Footer } from "@/components/Footer";

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <StatsBar />
      <Footer />
    </div>
  );
}

export default Landing;

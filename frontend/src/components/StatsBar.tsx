import { Code2, Zap, Smile } from "lucide-react";

export function StatsBar() {
  return (
    <section className="bg-card border-y border-border py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-6">
          {/* Stat 1 */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <Code2 className="w-8 h-8 text-primary" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold mb-2">330M+</p>
            <p className="text-sm sm:text-base text-muted-foreground">Repositories Indexed</p>
          </div>

          {/* Stat 2 */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold mb-2">AI-Powered</p>
            <p className="text-sm sm:text-base text-muted-foreground">Smart Recommendations</p>
          </div>

          {/* Stat 3 */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <Smile className="w-8 h-8 text-primary" />
            </div>
            <p className="text-3xl sm:text-4xl font-bold mb-2">Beginner</p>
            <p className="text-sm sm:text-base text-muted-foreground">Friendly Interface</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StatsBar;

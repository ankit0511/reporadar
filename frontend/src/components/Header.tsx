import { useAuth } from "@/context/AuthContext";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Radar, LogOut } from "lucide-react";

const API_BASE = "http://localhost:5000";

const NAV_LINKS = [
  { label: "Features", panel: 2 },
  { label: "How it Works", panel: 1 },
  { label: "About", panel: 3 },
];

export function Header() {
  const { user, isLoggedIn, logout } = useAuth();

  const handleSignIn = () => {
    window.location.href = `${API_BASE}/api/auth/github`;
  };

  const scrollToPanel = (panel: number) => {
    const track = document.getElementById("landing-track");
    track?.scrollTo({ left: panel * track.clientWidth, behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50   ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-light to-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Radar className="w-5 h-5" />
            </span>
            <span className="font-bold text-lg tracking-tight text-foreground">
              Repo<span className="text-primary">Radar</span>
            </span>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToPanel(link.panel)}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                {user?.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.userName}
                    className="w-8 h-8 rounded-full border border-border"
                  />
                )}
                <span className="text-sm font-medium hidden sm:inline text-foreground">
                  {user?.userName}
                </span>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="group flex items-center gap-2 rounded-full bg-foreground text-background pl-4 pr-5 py-2.5 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <GithubIcon className="w-4 h-4" />
                Continue with GitHub
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun, LogOut } from "lucide-react";

export function Header() {
  const { user, isLoggedIn, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-16 gap-4">
          {/* User profile section */}
          {isLoggedIn && (
            <div className="flex items-center gap-3">
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user.userName}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium hidden sm:inline">
                {user?.userName}
              </span>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;

import { Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useThemeStore } from "@/store/theme-store";

/** Brand header shared by every Client Portal shell (ClientLayout and WizardLayout). */
export function ClientPortalHeader() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">AI Consultant</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <Link
            to="/admin-login"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </header>
  );
}

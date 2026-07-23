import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sparkles, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useThemeStore } from "@/store/theme-store";
import { cn } from "@/utils/cn";

/** Brand header shared by every Client Portal shell (ClientLayout and WizardLayout). */
export function ClientPortalHeader() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="asc-glass sticky top-0 z-40 border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className={cn(
            "group flex items-center gap-2.5 rounded-lg",
            "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
          )}
        >
          <div className="asc-gradient-accent asc-shadow-accent flex h-8 w-8 items-center justify-center rounded-lg text-white transition-transform duration-300 group-hover:scale-105">
            <Sparkles className="h-4 w-4" strokeWidth={2.1} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            AI Consultant
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
            }
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-muted",
              "transition-colors hover:bg-surface-muted hover:text-foreground",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ opacity: 0, rotate: -60, scale: 0.7 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 60, scale: 0.7 }}
                transition={{ duration: 0.18 }}
                className="flex"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" strokeWidth={1.85} />
                ) : (
                  <Moon className="h-4 w-4" strokeWidth={1.85} />
                )}
              </motion.span>
            </AnimatePresence>
          </button>

          <Link
            to="/admin-login"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium text-muted",
              "transition-colors hover:bg-surface-muted hover:text-foreground",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            )}
          >
            Staff Login
          </Link>
        </div>
      </div>
    </header>
  );
}

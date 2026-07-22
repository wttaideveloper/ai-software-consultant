import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils/cn";

export function Navbar() {
  const { theme, toggleTheme } = useThemeStore();
  const openMobileSidebar = useUiStore((state) => state.openMobileSidebar);
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setProfileOpen(false);
    clearSession();
    navigate("/admin-login", { replace: true });
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={openMobileSidebar}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-foreground-soft" />
      </Button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-foreground-soft" />
        <input
          type="search"
          placeholder="Search consultations, features, proposals..."
          className={cn(
            "h-10 w-full rounded-xl border border-border bg-surface-muted pr-3 pl-10 text-sm text-foreground",
            "placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
          )}
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px] text-foreground-soft" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px] text-foreground-soft" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-foreground-soft" />
          )}
        </Button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-surface-muted"
          >
            <Avatar name={user?.fullName ?? "Account"} src={user?.avatarUrl} size="sm" />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-none text-foreground">
                {user?.fullName ?? "—"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">{organization?.name ?? "—"}</p>
            </div>
          </button>

          <AnimatePresence>
            {profileOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface p-1"
              >
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-soft hover:bg-surface-muted"
                >
                  <UserRound className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-soft hover:bg-surface-muted"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-subtle"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

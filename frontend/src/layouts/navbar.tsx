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
import { popover } from "@/utils/motion";

export function Navbar() {
  const { theme, toggleTheme } = useThemeStore();
  const openMobileSidebar = useUiStore((state) => state.openMobileSidebar);
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  // Escape closes the menu and returns focus to its trigger, so keyboard users
  // aren't stranded at the end of the document.
  useEffect(() => {
    if (!profileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [profileOpen]);

  const menuItemClass = cn(
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground-soft",
    "transition-colors hover:bg-surface-muted hover:text-foreground",
    "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
  );

  return (
    <header className="asc-glass sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={openMobileSidebar}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          placeholder="Search consultations, features, proposals…"
          aria-label="Search"
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-surface-muted/70 pr-14 pl-10 text-sm text-foreground",
            "placeholder:text-muted transition-[border-color,box-shadow,background-color] duration-200",
            "hover:border-border-strong",
            "focus:border-accent focus:bg-surface focus:outline-none focus:ring-[3px] focus:ring-accent/20",
          )}
        />
        <kbd
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline"
        >
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4.5 w-4.5" strokeWidth={1.85} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
        >
          {/* Crossfade + rotate reads as one control changing state rather
              than two icons swapping. */}
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
                <Sun className="h-4.5 w-4.5" strokeWidth={1.85} />
              ) : (
                <Moon className="h-4.5 w-4.5" strokeWidth={1.85} />
              )}
            </motion.span>
          </AnimatePresence>
        </Button>

        <div className="relative ml-1" ref={menuRef}>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            className={cn(
              "flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 transition-colors hover:bg-surface-muted",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            )}
          >
            <Avatar
              name={user?.fullName ?? "Account"}
              src={user?.avatarUrl}
              size="sm"
            />
            <div className="hidden max-w-[10rem] text-left sm:block">
              <p className="truncate text-sm leading-tight font-medium text-foreground">
                {user?.fullName ?? "—"}
              </p>
              <p className="mt-0.5 truncate text-[11px] leading-tight text-muted">
                {organization?.name ?? "—"}
              </p>
            </div>
          </button>

          <AnimatePresence>
            {profileOpen ? (
              <motion.div
                role="menu"
                variants={popover}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg"
              >
                <div className="border-b border-border px-3 py-2.5 sm:hidden">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user?.fullName ?? "—"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {organization?.name ?? "—"}
                  </p>
                </div>

                <div className="p-0.5">
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className={menuItemClass}
                  >
                    <UserRound className="h-4 w-4" strokeWidth={1.85} />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className={menuItemClass}
                  >
                    <Settings className="h-4 w-4" strokeWidth={1.85} />
                    Settings
                  </Link>
                </div>

                <div className="mt-1 border-t border-border p-0.5 pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className={cn(
                      menuItemClass,
                      "text-danger hover:bg-danger-subtle hover:text-danger",
                    )}
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.85} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

import { motion } from "framer-motion";
import { ChevronLeft, Hexagon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { APP_NAV_ITEMS } from "@/layouts/nav-config";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils/cn";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
  embedded?: boolean;
};

export function Sidebar({
  className,
  onNavigate,
  embedded = false,
}: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const collapsed = embedded ? false : sidebarCollapsed;

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-border bg-surface/90 backdrop-blur-xl",
        className,
      )}
    >
      {!embedded ? (
        <div
          className={cn(
            "flex h-16 items-center gap-3 border-b border-border px-4",
            collapsed && "justify-center px-2",
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-soft">
            <Hexagon className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </div>
          <motion.div
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
            }}
            className="overflow-hidden whitespace-nowrap"
          >
            <p className="text-sm font-semibold tracking-tight">Consultant</p>
            <p className="text-[11px] text-muted">AI Platform</p>
          </motion.div>
        </div>
      ) : null}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {APP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-canvas hover:text-foreground",
                  collapsed && "justify-center px-2",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <motion.span
                      layoutId={embedded ? "sidebar-active-mobile" : "sidebar-active"}
                      className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-accent"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  ) : null}
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.85} />
                  <motion.span
                    initial={false}
                    animate={{
                      opacity: collapsed ? 0 : 1,
                      width: collapsed ? 0 : "auto",
                    }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {!embedded ? (
        <div className="hidden border-t border-border p-3 lg:block">
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-canvas hover:text-foreground",
              collapsed && "justify-center",
            )}
          >
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.span>
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        </div>
      ) : null}
    </aside>
  );
}

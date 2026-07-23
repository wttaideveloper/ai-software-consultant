import { motion } from "framer-motion";
import { PanelLeftClose, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { APP_NAV_GROUPS } from "@/layouts/nav-config";
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
  // The mobile drawer is never collapsed — it has the room to show labels.
  const collapsed = embedded ? false : sidebarCollapsed;
  // Both copies of Sidebar (desktop rail + mobile drawer) can be mounted at
  // once, so the marker's layoutId must be scoped or they animate into each other.
  const markerLayoutId = embedded
    ? "sidebar-active-marker-drawer"
    : "sidebar-active-marker-rail";

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-border bg-surface",
        className,
      )}
    >
      {!embedded ? (
        <div
          className={cn(
            "flex h-16 shrink-0 items-center gap-3 border-b border-border px-4",
            collapsed && "justify-center px-2",
          )}
        >
          <div className="asc-gradient-accent asc-shadow-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white">
            <Sparkles className="h-4.5 w-4.5" strokeWidth={2.1} />
          </div>
          <motion.div
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Consultant
            </p>
            <p className="text-[11px] text-muted">AI Platform</p>
          </motion.div>
        </div>
      ) : null}

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {APP_NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.title} className={cn(groupIndex > 0 && "mt-6")}>
            {/* Caption collapses to a divider so groups stay distinguishable
                in the rail, where there's no room for a label. */}
            {collapsed ? (
              groupIndex > 0 ? (
                <div className="mx-auto mb-3 h-px w-8 bg-border" />
              ) : null
            ) : (
              <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-muted uppercase">
                {group.title}
              </p>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === "/dashboard"}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                        "transition-colors duration-150",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        isActive
                          ? "bg-accent-subtle text-accent-text"
                          : "text-foreground-soft hover:bg-surface-muted hover:text-foreground",
                        collapsed && "justify-center px-2",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active rail marker — survives the collapsed state,
                            where the label can't communicate selection. */}
                        {isActive ? (
                          <motion.span
                            layoutId={markerLayoutId}
                            className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent"
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 34,
                            }}
                          />
                        ) : null}
                        <Icon
                          className={cn(
                            "h-4.5 w-4.5 shrink-0 transition-colors",
                            isActive
                              ? "text-accent"
                              : "text-muted group-hover:text-foreground-soft",
                          )}
                          strokeWidth={1.85}
                        />
                        <motion.span
                          initial={false}
                          animate={{
                            opacity: collapsed ? 0 : 1,
                            width: collapsed ? 0 : "auto",
                          }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!embedded ? (
        <div className="hidden shrink-0 border-t border-border p-3 lg:block">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted",
              "transition-colors duration-150 hover:bg-surface-muted hover:text-foreground",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              collapsed && "justify-center px-2",
            )}
          >
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="flex shrink-0"
            >
              <PanelLeftClose className="h-4.5 w-4.5" strokeWidth={1.85} />
            </motion.span>
            {!collapsed ? <span>Collapse</span> : null}
          </button>
        </div>
      ) : null}
    </aside>
  );
}

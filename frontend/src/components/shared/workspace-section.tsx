import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { staggerItem } from "@/utils/motion";

type WorkspaceSectionProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Header-right slot — edit/save controls belong here. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Anchor target for in-page navigation. */
  id?: string;
};

/**
 * Shared shell for every section of the Lead Details Workspace.
 *
 * Six sections share one header treatment (glyph, title, optional description,
 * action slot); centralising it here is what keeps the single-page workspace
 * reading as one document rather than six differently-styled panels.
 */
export function WorkspaceSection({
  icon: Icon,
  title,
  description,
  actions,
  children,
  className,
  id,
}: WorkspaceSectionProps) {
  return (
    <motion.section
      id={id}
      variants={staggerItem}
      className={cn(
        "scroll-mt-36 rounded-2xl border border-border bg-surface shadow-sm",
        className,
      )}
    >
      <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="asc-gradient-subtle flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-accent-text">
            <Icon className="h-4.5 w-4.5" strokeWidth={1.85} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 truncate text-xs text-muted">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </header>

      <div className="p-5">{children}</div>
    </motion.section>
  );
}

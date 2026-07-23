import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Small caption above the title — section or breadcrumb context. */
  eyebrow?: string;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-semibold tracking-wider text-accent-text uppercase">
            {eyebrow}
          </p>
        ) : null}
        {/* clamp() scales the title continuously instead of jumping at the
            md breakpoint, which kept long titles awkward on tablets. */}
        <h1 className="text-[clamp(1.75rem,1.35rem+1.6vw,2.25rem)] leading-tight font-semibold tracking-tight text-foreground text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

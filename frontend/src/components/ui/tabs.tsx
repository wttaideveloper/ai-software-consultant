import { motion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { SPRING_SNAPPY } from "@/utils/motion";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
};

export function Tabs({ items, defaultValue, className }: TabsProps) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.id ?? "");
  const current = items.find((item) => item.id === active) ?? items[0];
  // Scoped per instance: a shared literal layoutId makes two Tabs on the same
  // page animate their indicators into each other.
  const instanceId = useId();

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="relative flex gap-1 rounded-xl border border-border bg-surface-muted p-1"
      >
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${instanceId}-tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`${instanceId}-panel-${item.id}`}
              onClick={() => setActive(item.id)}
              className={cn(
                "relative z-10 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                isActive
                  ? "text-accent-text"
                  : "text-muted hover:text-foreground-soft",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId={`${instanceId}-tab-indicator`}
                  className="absolute inset-0 -z-10 rounded-lg border border-border bg-surface shadow-sm"
                  transition={SPRING_SNAPPY}
                />
              ) : null}
              {item.label}
            </button>
          );
        })}
      </div>

      {current ? (
        <div
          role="tabpanel"
          id={`${instanceId}-panel-${current.id}`}
          aria-labelledby={`${instanceId}-tab-${current.id}`}
          className="mt-4"
        >
          {current.content}
        </div>
      ) : null}
    </div>
  );
}

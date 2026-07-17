import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

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

  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex gap-1 rounded-xl border border-border bg-canvas p-1">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={cn(
                "relative z-10 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "text-foreground" : "text-muted hover:text-foreground-soft",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-0 -z-10 rounded-lg bg-surface shadow-soft"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              ) : null}
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4">{current?.content}</div>
    </div>
  );
}

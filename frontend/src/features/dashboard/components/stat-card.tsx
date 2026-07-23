import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerItem } from "@/utils/motion";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: number;
  description: string;
  isLoading?: boolean;
};

export function StatCard({
  icon: Icon,
  label,
  value,
  description,
  isLoading,
}: StatCardProps) {
  return (
    <motion.div variants={staggerItem} className="h-full">
      <Card className="group h-full">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium tracking-wider text-muted uppercase">
            {label}
          </p>
          <div className="asc-gradient-subtle flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-accent-text transition-transform duration-300 group-hover:scale-105">
            <Icon className="h-4.5 w-4.5" strokeWidth={1.85} />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="mt-3 h-10 w-16" />
        ) : (
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            // tabular-nums stops the figure jittering when a count changes.
            className="mt-3 text-[2.25rem] leading-none font-semibold tracking-tight text-foreground asc-tabular"
          >
            {value}
          </motion.p>
        )}

        <p className="mt-2.5 text-xs leading-relaxed text-muted">{description}</p>
      </Card>
    </motion.div>
  );
}

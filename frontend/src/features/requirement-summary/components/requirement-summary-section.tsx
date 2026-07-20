import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { staggerItem } from "@/utils/motion";

type RequirementSummarySectionProps = {
  icon: LucideIcon;
  title: string;
  items: string[];
  emptyText?: string;
};

export function RequirementSummarySection({
  icon: Icon,
  title,
  items,
  emptyText = "None specified.",
}: RequirementSummarySectionProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card hover={false} className="h-full">
        <CardHeader>
          <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
            <Icon className="h-4 w-4" strokeWidth={1.85} />
          </div>
        </CardHeader>
        <CardTitle>{title}</CardTitle>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{emptyText}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex gap-2 text-sm text-foreground-soft">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </motion.div>
  );
}

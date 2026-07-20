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

export function StatCard({ icon: Icon, label, value, description, isLoading }: StatCardProps) {
  return (
    <motion.div variants={staggerItem}>
      <Card className="h-full">
        <div className="asc-gradient-accent flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm shadow-accent/20">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
        </div>

        <p className="mt-4 text-xs font-medium tracking-wide text-muted uppercase">{label}</p>

        {isLoading ? (
          <Skeleton className="mt-2 h-9 w-16" />
        ) : (
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums"
          >
            {value}
          </motion.p>
        )}

        <p className="mt-1.5 text-xs text-muted">{description}</p>
      </Card>
    </motion.div>
  );
}

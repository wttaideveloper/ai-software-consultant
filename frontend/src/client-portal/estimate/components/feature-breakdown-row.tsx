import { motion } from "framer-motion";
import { Badge, Checkbox } from "@/components/ui";
import { COMPLEXITY_META } from "@/features/detected-features/feature-badges";
import type { ClientFeatureBreakdownItem } from "@/store/client-consultation.store";
import { EASE_OUT_EXPO } from "@/utils/motion";
import { cn } from "@/utils/cn";

type FeatureBreakdownRowProps = {
  item: ClientFeatureBreakdownItem;
  onToggleIncluded: () => void;
};

export function FeatureBreakdownRow({ item, onToggleIncluded }: FeatureBreakdownRowProps) {
  return (
    <motion.div
      // Toggling animates opacity + a gentle scale (transform only) so an
      // excluded feature recedes smoothly instead of snapping to 50%.
      animate={{ opacity: item.included ? 1 : 0.55, scale: item.included ? 1 : 0.99 }}
      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
      whileHover={{ y: -1 }}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-4 py-3",
        "transition-[border-color,box-shadow] duration-200 hover:shadow-sm",
        item.included ? "border-accent/30" : "border-border/60",
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge variant={COMPLEXITY_META[item.complexity].variant}>
            {COMPLEXITY_META[item.complexity].label}
          </Badge>
          <span className="asc-tabular text-xs text-muted">{item.hours} hrs</span>
        </div>
      </div>
      <Checkbox
        checked={item.included}
        onChange={onToggleIncluded}
        label={<span className="text-xs">Included</span>}
      />
    </motion.div>
  );
}

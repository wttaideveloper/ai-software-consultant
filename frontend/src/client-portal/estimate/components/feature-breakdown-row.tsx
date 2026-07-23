import { Badge, Checkbox } from "@/components/ui";
import { COMPLEXITY_META } from "@/features/detected-features/feature-badges";
import type { ClientFeatureBreakdownItem } from "@/store/client-consultation.store";
import { cn } from "@/utils/cn";

type FeatureBreakdownRowProps = {
  item: ClientFeatureBreakdownItem;
  onToggleIncluded: () => void;
};

export function FeatureBreakdownRow({ item, onToggleIncluded }: FeatureBreakdownRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3 transition-opacity",
        !item.included && "opacity-50",
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
    </div>
  );
}

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { useCallback } from "react";
import {
  PRICE_RANGE_HELPER_TEXT,
  toPriceRange,
} from "@/client-portal/estimate/estimate-pricing";
import { formatMoney } from "@/features/cost-settings/cost-settings.labels";
import type { CostPreview } from "@/types";
import { EASE_OUT_EXPO } from "@/utils/motion";
import { CountUp } from "./count-up";

type ProjectCostCardProps = {
  /** Current (toggled) pricing from the Cost Engine, or null when unavailable. */
  pricing: CostPreview | null;
  /** True while a reprice is in flight — shows a quiet "updating" hint. */
  isUpdating?: boolean;
  /** Every feature switched off: there is no scope left to price. */
  noFeaturesSelected?: boolean;
  /**
   * What the figure is called. A support engagement is quoted per month, not as
   * a project total, so "Project Cost" would misdescribe it.
   */
  label?: string;
};

/**
 * The hero figure of the estimate. Shows a price *range* (never a single exact
 * number) that count-ups whenever the client toggles a feature, so the change is
 * noticed. The number is priced by the server's Cost Engine — this card only
 * presents it.
 */
export function ProjectCostCard({
  pricing,
  label = "Project Cost",
  isUpdating,
  noFeaturesSelected,
}: ProjectCostCardProps) {
  const currency = pricing?.currency ?? "USD";
  const formatValue = useCallback(
    (value: number) => formatMoney(value, currency),
    [currency],
  );

  const range = pricing ? toPriceRange(pricing.breakdown.finalPrice) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      className="asc-gradient-subtle asc-shadow-accent relative overflow-hidden rounded-2xl border border-accent/25 p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-subtle text-accent-text">
            <Wallet className="h-4.5 w-4.5" strokeWidth={1.85} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-text">
            {label}
          </p>
        </div>
        {isUpdating ? (
          <span className="text-xs text-muted" aria-live="polite">
            Updating…
          </span>
        ) : null}
      </div>

      {noFeaturesSelected ? (
        <>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-muted sm:text-3xl">—</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Include at least one feature to see an estimated cost.
          </p>
        </>
      ) : range ? (
        <>
          <p className="asc-tabular mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            <CountUp value={range.min} format={formatValue} />
            <span className="mx-1.5 text-muted">–</span>
            <CountUp value={range.max} format={formatValue} />
          </p>
          <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted">
            {PRICE_RANGE_HELPER_TEXT}
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-muted sm:text-3xl">
            Not available
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Pricing isn't available for this estimate right now.
          </p>
        </>
      )}
    </motion.div>
  );
}

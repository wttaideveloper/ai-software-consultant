import { AnimatePresence, motion } from "framer-motion";
import { TrendingDown } from "lucide-react";
import type { ReactNode } from "react";
import {
  formatPriceRange,
  toPriceRange,
} from "@/client-portal/estimate/estimate-pricing";
import { formatMoney } from "@/features/cost-settings/cost-settings.labels";
import type { CostPreview } from "@/types";
import { EASE_OUT_EXPO } from "@/utils/motion";
import { CountUp } from "./count-up";

type EstimateSavingsSummaryProps = {
  /** Total hours of the AI estimate with every feature included. */
  originalHours: number;
  /** Hours of only the currently-included features. */
  currentHours: number;
  /** Pricing at the original hours (from generation). */
  originalPricing: CostPreview | null;
  /** Pricing at the current hours (live). */
  currentPricing: CostPreview | null;
};

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-foreground-soft">{label}</span>
      <span className="asc-tabular text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

const formatHours = (value: number) => `${Math.round(value)} hrs`;

/**
 * Sits under the Project Cost card and shows what turning features off changed:
 * original vs. current hours and price range, and the resulting saving. Every
 * price is a range and every figure is derived from the Cost Engine's output —
 * nothing is recomputed here. Hours and the saving count up as features toggle,
 * so a change reads as a smooth update rather than a silent jump.
 *
 * **Renders nothing until something actually changes.** A comparison against an
 * untouched estimate is four cells stating two facts twice — and both are
 * already on screen, the price in the Project Cost card above and the hours in
 * the feature breakdown below. Appearing only on a real delta is also what makes
 * the panel legible when it does appear: the client sees it arrive in response
 * to the switch they just flicked, instead of hunting for which of two identical
 * numbers moved.
 */
export function EstimateSavingsSummary({
  originalHours,
  currentHours,
  originalPricing,
  currentPricing,
}: EstimateSavingsSummaryProps) {
  const currency =
    currentPricing?.currency ?? originalPricing?.currency ?? "USD";
  const originalPrice = originalPricing?.breakdown.finalPrice ?? null;
  const currentPrice = currentPricing?.breakdown.finalPrice ?? null;
  const savings =
    originalPrice !== null && currentPrice !== null
      ? Math.max(0, originalPrice - currentPrice)
      : 0;

  /**
   * Compared at the precision the rows are *displayed* at, so the panel can
   * never appear over a difference too small to see. Hours drive it rather than
   * price: price is derived from hours, and a rate card that rounds two
   * different hour totals to the same figure is still a real scope change.
   */
  const hasChanged = Math.round(currentHours) !== Math.round(originalHours);

  return (
    <AnimatePresence initial={false}>
      {hasChanged ? (
        <motion.div
          key="summary"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="rounded-2xl border border-border bg-surface p-5"
        >
          <h2 className="text-sm font-semibold tracking-tight text-foreground-soft">
            Estimate Summary
          </h2>

          <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <SummaryRow
              label="Original Hours"
              value={<CountUp value={originalHours} format={formatHours} />}
            />
            <SummaryRow
              label="Current Hours"
              value={<CountUp value={currentHours} format={formatHours} />}
            />
            {originalPrice !== null ? (
              <SummaryRow
                label="Original Price Range"
                value={formatPriceRange(toPriceRange(originalPrice), currency)}
              />
            ) : null}
            {currentPrice !== null ? (
              <SummaryRow
                label="Current Price Range"
                value={formatPriceRange(toPriceRange(currentPrice), currency)}
              />
            ) : null}
          </div>

          {/* The saving appears/updates as features toggle — fade + slide it (transform
              and opacity only, no layout animation) and count the amount up. */}
          <AnimatePresence initial={false}>
            {savings > 0 ? (
              <motion.div
                key="savings"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-success-subtle px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-success">
                  <TrendingDown className="h-4 w-4" strokeWidth={1.85} />
                  Estimated Cost Reduction
                </span>

                <span className="asc-tabular text-sm font-semibold text-success">
                  <CountUp
                    value={savings}
                    format={(value) => formatMoney(value, currency)}
                  />
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

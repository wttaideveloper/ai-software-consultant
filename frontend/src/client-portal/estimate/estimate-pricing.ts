import { formatMoney } from "@/features/cost-settings/cost-settings.labels";
import type { FeatureComplexity } from "@/types";

/**
 * Local, AI-free maths for the interactive estimate.
 *
 * Nothing here prices anything — the Cost Engine on the server owns pricing, and
 * these helpers only shape the effort that feeds it and the ranges we present.
 * Keeping them in one module means the spread, timeline padding and hour weights
 * are configured in exactly one place.
 */

/** Half-width of the shown price range, as a fraction of the engine's final price. */
export const PRICE_RANGE_SPREAD = 0.1;

/** Weeks added either side of the estimate for the shown timeline range. */
export const TIMELINE_RANGE_WEEKS = 1;

/**
 * How the AI's calendar estimate is scaled before a human ever sees it.
 *
 * THE single knob for delivery timelines — change this one number and every
 * surface that shows weeks moves with it. The AI models a generic team; this firm
 * ships materially faster, so its estimate is corrected here rather than by
 * arguing with the model (which would make the number unstable) or by editing
 * each screen (which would guarantee they drift apart).
 *
 * Strictly a presentation adjustment. Effort, cost, team size, technology stack
 * and the feature breakdown are all untouched: the Cost Engine prices
 * `estimatedHours`, never weeks, so halving a timeline provably cannot move a
 * price. The stored/AI value stays original — only its display is scaled.
 */
export const TIMELINE_ADJUSTMENT_FACTOR = 0.5;

/**
 * Applies the adjustment to one week figure.
 *
 * Rounds half up, so 11→6, 13→7, 8→4 and 5→3. Floored at one week because no
 * amount of scaling makes a project take zero weeks — that floor is what keeps a
 * smaller factor safe to configure later.
 */
export function adjustTimelineWeeks(weeks: number): number {
  return Math.max(1, Math.round(weeks * TIMELINE_ADJUSTMENT_FACTOR));
}

/**
 * An adjusted week figure as prose — "6 weeks", "1 week".
 *
 * Exists so the pluralisation ternary isn't re-typed at every prose site, which
 * is how one of them ends up adjusted and another not.
 */
export function formatAdjustedWeeks(weeks: number): string {
  const adjusted = adjustTimelineWeeks(weeks);
  return `${adjusted} week${adjusted === 1 ? "" : "s"}`;
}

/**
 * The caveats shown beside a range. Defined here, next to the maths they explain,
 * so the Estimate and Proposal steps set the client's expectations in identical
 * words rather than drifting apart.
 */
export const PRICE_RANGE_HELPER_TEXT =
  "Approximate development cost. Final quotation will be confirmed after requirement validation.";

export const TIMELINE_RANGE_HELPER_TEXT =
  "Timeline may vary depending on scope changes and final requirements.";

/**
 * Relative effort per feature by complexity. The AI returns one total for the
 * project, not hours per feature, so total hours are split across features by
 * these weights — enough for toggling a feature to move the total sensibly
 * (a HIGH feature removes more than a LOW one) without pretending to a precision
 * the AI never gave.
 */
export const COMPLEXITY_HOURS_WEIGHT: Record<FeatureComplexity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export type NumericRange = { min: number; max: number };

/**
 * Splits a project's total hours across its features, weighted by complexity.
 *
 * Uses the largest-remainder method so the per-feature hours are whole numbers
 * that sum back to exactly `totalHours` — otherwise "all features included" would
 * not equal the AI's original total and the summary would show phantom savings.
 */
export function distributeFeatureHours(
  features: ReadonlyArray<{ id: string; complexity: FeatureComplexity }>,
  totalHours: number,
): Map<string, number> {
  const result = new Map<string, number>();
  const count = features.length;
  if (count === 0) return result;

  const total = Math.max(0, Math.round(totalHours));
  const weights = features.map((feature) => COMPLEXITY_HOURS_WEIGHT[feature.complexity] ?? 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  const raw = weights.map((weight) => (total * weight) / totalWeight);
  const hours = raw.map(Math.floor);
  let remainder = total - hours.reduce((sum, value) => sum + value, 0);

  // Hand the leftover units to the largest fractional parts first, so rounding is
  // distributed fairly rather than always landing on the same feature.
  const byFraction = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remainder; i += 1) {
    hours[byFraction[i % count].index] += 1;
  }

  features.forEach((feature, index) => result.set(feature.id, hours[index]));
  return result;
}

/**
 * Turns the wizard's platform selection into the free-text labels the Cost Engine
 * resolves. The "Other" sentinel is replaced by its typed value, and blanks drop.
 * Shared by generation and every live reprice so both price the same platforms.
 */
export function resolveWizardPlatformLabels(
  platforms: string[],
  otherPlatform: string,
): string[] {
  return [
    ...platforms.filter((platform) => platform !== "Other"),
    otherPlatform.trim(),
  ].filter((platform) => platform.length > 0);
}

/** The engine gives one figure; software estimates are a range. */
export function toPriceRange(
  finalPrice: number,
  spread: number = PRICE_RANGE_SPREAD,
): NumericRange {
  return {
    min: finalPrice * (1 - spread),
    max: finalPrice * (1 + spread),
  };
}

export function formatPriceRange(range: NumericRange, currency: string): string {
  return `${formatMoney(range.min, currency)} – ${formatMoney(range.max, currency)}`;
}

/**
 * The shown delivery window, already adjusted.
 *
 * The factor is applied to each endpoint of the padded range rather than to the
 * centre, so the window narrows in proportion with the timeline: a 12-week AI
 * estimate padded to 11–13 becomes 6–7, not 5–7. Scaling only the centre would
 * keep a full ±1 week of uncertainty on a project half as long, which reads as
 * less confidence rather than more speed.
 */
export function toWeekRange(
  weeks: number,
  padding: number = TIMELINE_RANGE_WEEKS,
): NumericRange {
  return {
    min: adjustTimelineWeeks(Math.max(1, weeks - padding)),
    max: adjustTimelineWeeks(weeks + padding),
  };
}

export function formatWeekRange(range: NumericRange): string {
  const unit = range.max === 1 ? "week" : "weeks";
  return range.min === range.max
    ? `${range.min} ${unit}`
    : `${range.min}–${range.max} ${unit}`;
}

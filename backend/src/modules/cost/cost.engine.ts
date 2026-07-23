import {
  PLATFORM_LABEL_ALIASES,
  type CostComplexityLevel,
  type CostPlatform,
} from "./cost.constants.js";

/**
 * The pricing engine.
 *
 * Pure and dependency-free: no database, no AI, no clock. Given a rate card and
 * an effort estimate it returns the same breakdown every time, which is what
 * makes the live preview in the UI and the price stored on an estimate provably
 * the same calculation.
 *
 * ─── The formula ────────────────────────────────────────────────────────────
 *   development = hours × hourlyRate × complexityMultiplier × platformMultiplier
 *   risk        = development × riskBuffer%
 *   subtotal    = development + risk
 *   discount    = capped by maxDiscount%
 *   taxable     = subtotal − discount
 *   tax         = taxEnabled ? taxable × tax% : 0
 *   finalPrice  = taxable + tax
 *
 * Order matters and is fixed here rather than at each call site: risk is charged
 * on the work, discount is granted on what the client would otherwise pay, and
 * tax is charged on what they actually pay.
 */

export type CostRateCard = {
  hourlyRate: number;
  complexityMultiplier: number;
  platformMultiplier: number;
  riskBufferPercentage: number;
  taxEnabled: boolean;
  taxPercentage: number;
  /** Ceiling the granted discount is clamped to, as a % of subtotal. */
  maxDiscountPercentage: number;
};

export type CostDiscountInput =
  | { type: "PERCENTAGE"; value: number }
  | { type: "FIXED"; value: number };

export type CostCalculationInput = {
  estimatedHours: number;
  rateCard: CostRateCard;
  discount?: CostDiscountInput;
};

export type CostBreakdown = {
  estimatedHours: number;
  hourlyRate: number;
  complexityMultiplier: number;
  platformMultiplier: number;
  /** hours × rate, before any multiplier — shown so the maths is auditable. */
  baseCost: number;
  /** After complexity and platform multipliers. */
  developmentCost: number;
  riskBufferPercentage: number;
  riskBufferAmount: number;
  subtotal: number;
  discountAmount: number;
  /** True when the requested discount exceeded maxDiscountPercentage. */
  discountCapped: boolean;
  taxPercentage: number;
  taxAmount: number;
  finalPrice: number;
};

/**
 * Money is rounded to 2 decimals at every published step, not just at the end,
 * so the numbers a client reads add up exactly. Rounding only at the end
 * produces breakdowns whose parts don't sum to the total.
 */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Resolves the platform premium for a project that may target several platforms.
 *
 * Additive premiums — `1 + Σ(multiplier − 1)` — rather than a product:
 *  - a platform priced at 1.0 (Web, API, Admin Panel) adds nothing, as its
 *    multiplier says it should;
 *  - more platforms always cost more, which taking the maximum would not do;
 *  - three 1.4× platforms come to 2.2×, not 2.74× — compounding multipliers
 *    produce quotes nobody would send.
 *
 * Never returns less than 1: the rate card cannot discount by adding platforms.
 */
export function resolvePlatformMultiplier(multipliers: number[]): number {
  if (multipliers.length === 0) return 1;

  const premium = multipliers.reduce((sum, value) => sum + (value - 1), 0);
  return round2(Math.max(1, 1 + premium));
}

/**
 * Maps free-text platform labels onto the priced enum.
 *
 * Returns what matched and what didn't, so a caller can surface "we didn't
 * price these" instead of a quote that silently ignored half the project.
 */
export function resolvePlatformKeys(labels: string[]): {
  matched: CostPlatform[];
  unmatched: string[];
} {
  const matched: CostPlatform[] = [];
  const unmatched: string[] = [];

  for (const label of labels) {
    const key = PLATFORM_LABEL_ALIASES[label.trim().toLowerCase()];

    if (!key) {
      unmatched.push(label);
      continue;
    }
    if (!matched.includes(key)) {
      matched.push(key);
    }
  }

  return { matched, unmatched };
}

export function calculateCost({
  estimatedHours,
  rateCard,
  discount,
}: CostCalculationInput): CostBreakdown {
  const hours = Math.max(0, estimatedHours);
  const baseCost = round2(hours * rateCard.hourlyRate);

  const developmentCost = round2(
    baseCost * rateCard.complexityMultiplier * rateCard.platformMultiplier,
  );

  const riskBufferAmount = round2(
    developmentCost * (rateCard.riskBufferPercentage / 100),
  );
  const subtotal = round2(developmentCost + riskBufferAmount);

  // The cap is a percentage of subtotal whichever way the discount is expressed,
  // so a fixed amount can never quietly exceed the policy a percentage obeys.
  const maxDiscountAmount = round2(
    subtotal * (rateCard.maxDiscountPercentage / 100),
  );

  const requestedDiscount = !discount
    ? 0
    : discount.type === "PERCENTAGE"
      ? round2(subtotal * (Math.max(0, discount.value) / 100))
      : Math.max(0, discount.value);

  const discountAmount = round2(Math.min(requestedDiscount, maxDiscountAmount));
  const discountCapped = requestedDiscount > maxDiscountAmount;

  const taxable = round2(subtotal - discountAmount);
  const taxAmount = rateCard.taxEnabled
    ? round2(taxable * (rateCard.taxPercentage / 100))
    : 0;

  return {
    estimatedHours: hours,
    hourlyRate: rateCard.hourlyRate,
    complexityMultiplier: rateCard.complexityMultiplier,
    platformMultiplier: rateCard.platformMultiplier,
    baseCost,
    developmentCost,
    riskBufferPercentage: rateCard.riskBufferPercentage,
    riskBufferAmount,
    subtotal,
    discountAmount,
    discountCapped,
    taxPercentage: rateCard.taxEnabled ? rateCard.taxPercentage : 0,
    taxAmount,
    finalPrice: round2(taxable + taxAmount),
  };
}

/** Complexity tiers a caller may price against, for exhaustive UI rendering. */
export type { CostComplexityLevel };

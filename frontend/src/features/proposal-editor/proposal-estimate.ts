import {
  formatPriceRange,
  formatWeekRange,
  toPriceRange,
  toWeekRange,
} from "@/client-portal/estimate/estimate-pricing";
import { toTechStackGroups } from "@/types/tech-stack";
import type {
  ClientLeadDetail,
  ClientLeadFeatureComplexity,
  ProposalProjectEstimate,
  TechStackGroup,
} from "@/types";

const COMPLEXITY_LABEL: Record<ClientLeadFeatureComplexity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

/** Currency to fall back to when the lead was submitted without a pricing snapshot. */
const DEFAULT_CURRENCY = "INR";

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * The Project Estimate as shown on the proposal — already formatted for display.
 */
export type ProposalEstimateView = {
  /** Approximate cost range, or null when no cost figures are set. */
  costRange: string | null;
  timelineRange: string;
  estimatedHours: number;
  complexityLabel: string;
  teamSize: number;
  /** Always grouped for display, whichever shape the version was stored in. */
  techStack: TechStackGroup[];
};

/**
 * Builds the editable estimate from the lead's frozen snapshot — the prefill for a
 * new proposal version. No AI, no Cost Engine: the cost and timeline endpoints are
 * derived with the same pure helpers the Client Portal used, so a fresh proposal
 * starts from exactly what the client saw. Cost is null when the lead was never
 * priced; the admin can then fill it in.
 */
export function deriveProposalEstimate(lead: ClientLeadDetail): ProposalProjectEstimate {
  const { estimate, pricing, techStack } = lead;

  const costRange = pricing ? toPriceRange(pricing.breakdown.finalPrice) : null;
  // Null weeks (a support engagement) collapses to a 0-0 range, which the
  // editor renders as "not applicable" rather than a fabricated window.
  const weekRange =
    estimate.estimatedWeeks === null
      ? { min: 0, max: 0 }
      : toWeekRange(estimate.estimatedWeeks);

  return {
    currency: pricing?.currency ?? DEFAULT_CURRENCY,
    costMin: costRange ? round2(costRange.min) : null,
    costMax: costRange ? round2(costRange.max) : null,
    timelineMinWeeks: weekRange.min,
    timelineMaxWeeks: weekRange.max,
    estimatedHours: estimate.estimatedHours,
    complexity: estimate.complexity,
    teamSize: estimate.teamSize,
    techStack,
  };
}

/**
 * The effective estimate for a version: its own edited copy when present, else the
 * lead-derived prefill. Versions created before the field existed have no override
 * and transparently fall back to the client's original estimate.
 */
export function resolveProposalEstimate(
  override: ProposalProjectEstimate | null | undefined,
  lead: ClientLeadDetail,
): ProposalProjectEstimate {
  return override ?? deriveProposalEstimate(lead);
}

/** Turns the stored/edited estimate into the display strings shown on the proposal. */
export function formatProposalEstimate(
  estimate: ProposalProjectEstimate,
): ProposalEstimateView {
  const costRange =
    estimate.costMin !== null && estimate.costMax !== null
      ? formatPriceRange(
          { min: estimate.costMin, max: estimate.costMax },
          estimate.currency,
        )
      : null;

  return {
    costRange,
    timelineRange: formatWeekRange({
      min: estimate.timelineMinWeeks,
      max: estimate.timelineMaxWeeks,
    }),
    estimatedHours: estimate.estimatedHours,
    complexityLabel: COMPLEXITY_LABEL[estimate.complexity] ?? estimate.complexity,
    teamSize: estimate.teamSize,
    // Versions authored before the technology engine hold a flat list; grouping
    // happens here so the editor preview and the exported document agree.
    techStack: toTechStackGroups(estimate.techStack),
  };
}

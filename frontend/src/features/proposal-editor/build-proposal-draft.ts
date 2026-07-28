import type { LeadProposalDraft } from "@/features/proposal-editor/lead-proposal.types";
import {
  deriveProposalEstimate,
  formatProposalEstimate,
} from "@/features/proposal-editor/proposal-estimate";
import type { ClientLeadDetail, ConsultationMode } from "@/types";

/**
 * Mirrors `proposalTitle` in the backend's consultation-mode.profiles.ts. Kept in
 * sync deliberately: the AI-written proposal and this client-side prefill must
 * name the same document, or the admin sees two different titles for one deal.
 */
const PROPOSAL_TITLE_BY_MODE: Record<ConsultationMode, string> = {
  NEW_PROJECT: "Project Proposal",
  FEATURE_ENHANCEMENT: "Feature Enhancement Proposal",
  MAINTENANCE: "Maintenance & Support Agreement",
  MODERNIZATION: "Migration Proposal",
};

/**
 * Builds the initial proposal draft from a lead's three AI artefacts:
 * the requirement summary, the detected features, and the estimate.
 *
 * Pure and side-effect free — no AI call is made here. Every value is derived
 * from data already saved on the lead, so this runs instantly and produces the
 * same draft every time.
 *
 * The commercial section and the Project Estimate are prefilled from the lead's
 * frozen pricing snapshot (the client already saw these figures), not left as a
 * to-do. Both remain editable per version, and no pricing is recomputed —
 * deriveProposalEstimate only reads the stored snapshot.
 */

const DEFAULT_TERMS = `1. This proposal is valid for 30 days from the date of issue.
2. The scope described above is fixed; changes will be handled through a written change request and may affect timeline and cost.
3. Payment terms, invoicing schedule and late-payment conditions are to be agreed before work begins.
4. Intellectual property in the delivered work transfers to the client on final payment.
5. Either party may terminate with written notice; work completed to that point remains payable.`;

/** Sentence-cases a comma-free label for use in prose. */
function toSentence(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function buildExecutiveSummary(lead: ClientLeadDetail): string {
  const { estimate } = lead;
  const client = lead.company ?? lead.name;
  const includedCount = lead.features.filter((feature) => feature.included).length;
  const confidence = Math.round(estimate.confidence * 100);
  const platforms = [
    ...lead.platforms,
    ...(lead.otherPlatform ? [lead.otherPlatform] : []),
  ];

  const platformSentence =
    platforms.length > 0
      ? ` The solution targets ${platforms.join(", ")}.`
      : "";

  const effortWindow =
    estimate.estimatedWeeks !== null
      ? ` across approximately ${estimate.estimatedWeeks} week${estimate.estimatedWeeks === 1 ? "" : "s"}`
      : estimate.maintenancePlan
        ? `, delivered as ${estimate.maintenancePlan.supportHoursPerMonth} hours of support per month`
        : "";

  return [
    `${client} is seeking a partner to deliver the project outlined below.${platformSentence}`,
    "",
    // Effort is phrased as a delivery window for a project and as recurring
    // capacity for a support engagement — the latter has no weeks to quote.
    `Based on our discovery process we have identified ${includedCount} in-scope item${includedCount === 1 ? "" : "s"}, with an estimated effort of ${estimate.estimatedHours} hours${effortWindow}. We recommend a team of ${estimate.teamSize}. Overall complexity is assessed as ${estimate.complexity.toLowerCase()}, at ${confidence}% confidence.`,
    "",
    "This proposal sets out the scope, timeline, team structure, assumptions and commercial basis for the engagement.",
  ].join("\n");
}

/** One scope line per in-scope feature, grouped implicitly by the order given. */
function buildScopeOfWork(lead: ClientLeadDetail): string[] {
  const included = lead.features.filter((feature) => feature.included);

  if (included.length === 0) {
    return ["Scope to be confirmed with the client."];
  }

  return included.map(
    (feature) => `${feature.name} — ${toSentence(feature.description)}`,
  );
}

/** Deliverables are derived from the distinct feature categories in scope. */
function buildDeliverables(lead: ClientLeadDetail): string[] {
  const categories = Array.from(
    new Set(
      lead.features
        .filter((feature) => feature.included)
        .map((feature) => feature.category.trim())
        .filter(Boolean),
    ),
  );

  if (categories.length === 0) {
    return ["Deliverables to be confirmed with the client."];
  }

  return [
    ...categories.map((category) => `${category} implementation`),
    "Source code and technical documentation",
    "Deployment support and handover",
  ];
}

function buildTimeline(lead: ClientLeadDetail): string {
  const { estimatedWeeks, breakdown, maintenancePlan } = lead.estimate;

  /**
   * A support engagement is not delivered on a date, so it gets an engagement
   * model and a review cadence instead of a duration and phase schedule. Writing
   * "Estimated duration: null weeks" — or inventing one — is exactly what
   * Consultation Mode exists to prevent.
   */
  if (estimatedWeeks === null) {
    if (!maintenancePlan) {
      return "Ongoing engagement — no fixed delivery date.";
    }

    return [
      `Engagement model: ${maintenancePlan.engagementType.replace(/_/g, " ").toLowerCase()}.`,
      `Monthly capacity: ${maintenancePlan.supportHoursPerMonth} hours.`,
      `Service level: ${maintenancePlan.suggestedSla}`,
    ].join("\n");
  }

  const header = `Estimated duration: ${estimatedWeeks} week${estimatedWeeks === 1 ? "" : "s"} from kick-off.`;

  if (breakdown.length === 0) {
    return header;
  }

  const totalHours =
    breakdown.reduce((sum, item) => sum + item.hours, 0) || 1;

  // Distribute the calendar estimate across phases in proportion to effort —
  // a starting point for the admin to adjust, not a committed schedule.
  const phases = breakdown.map((item) => {
    const share = item.hours / totalHours;
    const weeks = Math.max(1, Math.round(share * estimatedWeeks));
    return `- ${item.category}: ~${weeks} week${weeks === 1 ? "" : "s"} (${item.hours}h)`;
  });

  return [header, "", "Indicative phasing:", ...phases].join("\n");
}

function buildTeamStructure(lead: ClientLeadDetail): string {
  const { teamSize, estimatedWeeks } = lead.estimate;

  const duration =
    estimatedWeeks !== null
      ? ` over ${estimatedWeeks} week${estimatedWeeks === 1 ? "" : "s"}`
      : " on an ongoing basis";

  return [
    `Recommended team size: ${teamSize} concurrent contributor${teamSize === 1 ? "" : "s"}${duration}.`,
    "",
    "Proposed roles:",
    "- Engagement lead — scope, planning and client communication",
    "- Engineering — implementation, code review and testing",
    "- Quality assurance — functional and regression testing",
    "",
    "Exact role split to be confirmed during kick-off.",
  ].join("\n");
}

function buildCommercialSummary(lead: ClientLeadDetail): string {
  const { costRange, timelineRange, teamSize, estimatedHours } =
    formatProposalEstimate(deriveProposalEstimate(lead));

  // Figures come straight from the lead's stored snapshot — the same ones the
  // client already saw. Nothing is recomputed and no rate card is consulted here.
  const investmentLine = costRange
    ? `Estimated Investment: ${costRange}`
    : "Estimated Investment: to be confirmed after requirement analysis";

  return [
    "Commercial Estimate",
    "",
    investmentLine,
    `Estimated Duration: ${timelineRange}`,
    `Recommended Team: ${teamSize} member${teamSize === 1 ? "" : "s"}`,
    `Estimated Effort: ${estimatedHours} hours`,
    "",
    "This is an approximate project estimate generated from the submitted requirements. The final commercial quotation may change after detailed requirement analysis, project scoping, and contract discussions.",
  ].join("\n");
}

export function buildProposalDraft(lead: ClientLeadDetail): LeadProposalDraft {
  const client = lead.company ?? lead.name;

  return {
    // The document is named for the engagement it covers. A support contract
    // titled "Project Proposal" misdescribes what the client is being offered.
    title: `${client} — ${PROPOSAL_TITLE_BY_MODE[lead.consultationMode] ?? "Project Proposal"}`,
    executiveSummary: buildExecutiveSummary(lead),
    scopeOfWork: buildScopeOfWork(lead),
    deliverables: buildDeliverables(lead),
    timeline: buildTimeline(lead),
    // Column is a single newline-joined string; the estimate stores an array.
    assumptions: lead.estimate.assumptions.join("\n"),
    pricingNotes: buildCommercialSummary(lead),
    // Editable estimate, prefilled from the lead's frozen snapshot.
    projectEstimate: deriveProposalEstimate(lead),
    // No status here — a new version's status is set by the server (DRAFT), and
    // moving it is a lifecycle action, not part of the generated body.
    features: lead.features,
    teamStructure: buildTeamStructure(lead),
    risks: lead.estimate.risks,
    termsAndConditions: DEFAULT_TERMS,
  };
}

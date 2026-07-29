/**
 * Where a consultation begins: the engagement type chooser. Not one of
 * CLIENT_PORTAL_STEPS below — it is the entry point into the flow, the same way
 * the landing page is, and the step indicator should not count it.
 */
export const CONSULTATION_MODE_PATH = "/start";

export type ClientStep = {
  path: string;
  label: string;
};

export const MOCKUPS_STEP_PATH = "/mockups";

/**
 * Feature flag: the AI concept-mockup step is hidden from the Client Portal flow.
 *
 * Hidden, not removed — the page, gallery, polling hook, backend module and route
 * are all intact. Flipping this to `true` restores Concept as step 5 and re-routes
 * Estimate → Concept → Proposal, with no other edit anywhere.
 *
 * With it off the flow is five steps, and `/mockups` redirects into the flow
 * rather than rendering an orphaned step (see router.tsx) — a bookmarked or
 * back-buttoned URL must not land somewhere the indicator cannot represent.
 */
export const CLIENT_MOCKUPS_ENABLED = false;

/**
 * Every step the flow can contain, in order. Kept whole regardless of the flag so
 * the canonical sequence lives in one place and hiding a step never edits it.
 */
const ALL_CLIENT_PORTAL_STEPS: ClientStep[] = [
  { path: "/requirements", label: "Requirements" },
  { path: "/summary", label: "Summary" },
  { path: "/features", label: "Features" },
  { path: "/estimate", label: "Estimate" },
  { path: MOCKUPS_STEP_PATH, label: "Concept" },
  { path: "/request-proposal", label: "Proposal" },
];

/**
 * The steps actually shown by ClientStepIndicator — currently five. Home (/portal)
 * and the two exit pages (/proposal-sent, /gift) are entry/exit points, not steps,
 * so they were never listed here.
 */
export const CLIENT_PORTAL_STEPS: ClientStep[] = ALL_CLIENT_PORTAL_STEPS.filter(
  (step) => step.path !== MOCKUPS_STEP_PATH || CLIENT_MOCKUPS_ENABLED,
);

/**
 * Where a step's Continue / Back buttons go.
 *
 * Derived from the *visible* step list rather than hardcoded per page, so hiding
 * a step reroutes the flow around it automatically and no page is left pointing
 * at a step the indicator no longer shows. Returns null at the ends of the flow;
 * callers decide what lies beyond it.
 */
export function getNextStepPath(currentPath: string): string | null {
  const index = CLIENT_PORTAL_STEPS.findIndex((step) => step.path === currentPath);
  if (index < 0) return null;

  return CLIENT_PORTAL_STEPS[index + 1]?.path ?? null;
}

export function getPreviousStepPath(currentPath: string): string | null {
  const index = CLIENT_PORTAL_STEPS.findIndex((step) => step.path === currentPath);
  if (index <= 0) return null;

  return CLIENT_PORTAL_STEPS[index - 1]?.path ?? null;
}

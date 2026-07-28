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

/** The 6-step consultation flow shown by ClientStepIndicator. Home (/portal) and the two exit pages (/proposal-sent, /gift) are entry/exit points, not steps, so they're excluded. */
export const CLIENT_PORTAL_STEPS: ClientStep[] = [
  { path: "/requirements", label: "Requirements" },
  { path: "/summary", label: "Summary" },
  { path: "/features", label: "Features" },
  { path: "/estimate", label: "Estimate" },
  { path: "/mockups", label: "Concept" },
  { path: "/request-proposal", label: "Proposal" },
];

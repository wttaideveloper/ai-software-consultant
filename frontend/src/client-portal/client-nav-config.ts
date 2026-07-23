export type ClientStep = {
  path: string;
  label: string;
};

/** The 5-step consultation flow shown by ClientStepIndicator. Home (/portal) and the two exit pages (/proposal-sent, /gift) are entry/exit points, not steps, so they're excluded. */
export const CLIENT_PORTAL_STEPS: ClientStep[] = [
  { path: "/requirements", label: "Requirements" },
  { path: "/summary", label: "Summary" },
  { path: "/features", label: "Features" },
  { path: "/estimate", label: "Estimate" },
  { path: "/request-proposal", label: "Proposal" },
];

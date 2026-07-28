export type ClientMockupImageDto = {
  id: string;
  screenName: string;
  description: string;
  /** Relative API path the portal loads the picture from — never a provider URL. */
  imageUrl: string;
};

/**
 * `NONE` (nothing generated yet) is distinct from `PENDING` (a batch is running)
 * on purpose: only NONE authorises the client to start a billable generation, so
 * conflating the two would let a poll during generation kick off a second batch.
 * `DISABLED` means the operator has not switched the feature on.
 *
 * `NOT_APPLICABLE` is different again: the feature is on and working, but this
 * engagement type does not warrant concept screens (see mockup-policy.ts). It is
 * a deliberate, explainable outcome rather than an absence, which is why it is a
 * status and not just an empty NONE — NONE would invite the client to start a
 * batch that should never be billed.
 */
export type ClientMockupSetStatus =
  | "NONE"
  | "PENDING"
  | "READY"
  | "FAILED"
  | "DISABLED"
  | "NOT_APPLICABLE";

export type ClientMockupSetDto = {
  status: ClientMockupSetStatus;
  /** Why concepts are not being generated, when status is NOT_APPLICABLE. */
  notApplicableReason: string | null;
  images: ClientMockupImageDto[];
  /**
   * True when the current requirements no longer match what this batch was built
   * from, so the UI can offer a regenerate instead of silently re-billing.
   */
  stale: boolean;
  /** Regenerations already used, and the ceiling, so the UI can disable the button honestly. */
  regenerationsUsed: number;
  regenerationsAllowed: number;
  generatedAt: string | null;
};

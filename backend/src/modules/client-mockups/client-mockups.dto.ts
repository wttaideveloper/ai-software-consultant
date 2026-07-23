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
 */
export type ClientMockupSetStatus =
  | "NONE"
  | "PENDING"
  | "READY"
  | "FAILED"
  | "DISABLED";

export type ClientMockupSetDto = {
  status: ClientMockupSetStatus;
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

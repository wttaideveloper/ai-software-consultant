import { Badge } from "@/components/ui/badge";
import { LEAD_PROPOSAL_STATUS_META } from "@/features/lead-proposals/lead-proposal-status";
import type { LeadProposalStatus } from "@/types";

export function LeadProposalStatusBadge({
  status,
  size = "sm",
}: {
  status: LeadProposalStatus;
  size?: "sm" | "md";
}) {
  const meta = LEAD_PROPOSAL_STATUS_META[status];

  // Unknown status can only mean the pgEnum gained a member the UI hasn't been
  // taught yet — render it raw rather than crashing on an undefined lookup.
  if (!meta) {
    return <Badge variant="default">{status}</Badge>;
  }

  return (
    <Badge variant={meta.variant} size={size} dot>
      {meta.label}
    </Badge>
  );
}

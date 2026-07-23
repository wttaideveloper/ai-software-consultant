import { Badge } from "@/components/ui/badge";
import { CLIENT_LEAD_STATUS_META } from "@/features/client-requests/client-lead-status";
import type { ClientLeadStatus } from "@/types";

export function ClientLeadStatusBadge({ status }: { status: ClientLeadStatus }) {
  const meta = CLIENT_LEAD_STATUS_META[status];

  // Unknown status can only mean the pgEnum gained a member the UI hasn't been
  // taught yet — render it raw rather than crashing on an undefined lookup.
  if (!meta) {
    return <Badge variant="default">{status}</Badge>;
  }

  return (
    <Badge variant={meta.variant} dot>
      {meta.label}
    </Badge>
  );
}

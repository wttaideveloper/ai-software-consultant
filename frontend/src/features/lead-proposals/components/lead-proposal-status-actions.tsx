import { CheckCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  LEAD_PROPOSAL_STATUS_META,
  LEAD_PROPOSAL_TRANSITIONS,
  LEAD_PROPOSAL_TRANSITION_LABEL,
} from "@/features/lead-proposals/lead-proposal-status";
import { useUpdateLeadProposalStatus } from "@/features/lead-proposals/hooks/use-lead-proposal-mutations";
import type { LeadProposal, LeadProposalStatus } from "@/types";

/**
 * The lifecycle controls: Mark Ready / Sent / Accepted / Rejected / Archive.
 *
 * Only the moves the server will actually accept are offered, read from the
 * shared transition map. Marking a version SENT is confirmed first — it is the
 * point at which a document becomes the client's record of the offer.
 */
export function LeadProposalStatusActions({ proposal }: { proposal: LeadProposal }) {
  const updateStatus = useUpdateLeadProposalStatus();
  const [pendingStatus, setPendingStatus] = useState<LeadProposalStatus | null>(null);

  const available = LEAD_PROPOSAL_TRANSITIONS[proposal.status] ?? [];

  if (available.length === 0) {
    return null;
  }

  const apply = (status: LeadProposalStatus) =>
    updateStatus.mutate({ proposalId: proposal.id, status });

  const onSelect = (status: LeadProposalStatus) => {
    if (status === "SENT") {
      setPendingStatus(status);
      return;
    }
    apply(status);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {available.map((status, index) => (
          <Button
            key={status}
            // The first available move is the natural next step in the
            // lifecycle, so it gets the emphasis.
            variant={index === 0 ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onSelect(status)}
            isLoading={updateStatus.isPending}
            title={LEAD_PROPOSAL_STATUS_META[status]?.description}
          >
            {index === 0 ? <CheckCheck className="h-3.5 w-3.5" /> : null}
            {LEAD_PROPOSAL_TRANSITION_LABEL[status]}
          </Button>
        ))}
      </div>

      <ConfirmDialog
        open={pendingStatus === "SENT"}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => {
          apply("SENT");
          setPendingStatus(null);
        }}
        title={`Mark V${proposal.versionNumber} as sent?`}
        description="Record that this version was shared with the client. Sending itself is manual — this only updates the proposal's status, not the lead's."
        confirmLabel="Mark sent"
        tone="primary"
      />
    </>
  );
}

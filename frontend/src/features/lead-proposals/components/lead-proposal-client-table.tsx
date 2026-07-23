import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { LeadProposalStatusBadge } from "@/features/lead-proposals/components/lead-proposal-status-badge";
import type { LeadProposal, LeadProposalLeadRollup } from "@/types";
import { fadeIn } from "@/utils/motion";

/** A version reference, or an em dash when the client has none of that kind. */
function VersionCell({
  version,
  showStatus,
}: {
  version: LeadProposal | null;
  showStatus?: boolean;
}) {
  if (!version) {
    return <span className="text-muted">—</span>;
  }

  return (
    <span className="flex items-center gap-2">
      <Badge variant="default" size="sm">
        V{version.versionNumber}
      </Badge>
      {showStatus ? <LeadProposalStatusBadge status={version.status} /> : null}
    </span>
  );
}

/**
 * Library grouped by client: where each client's proposal stands at a glance.
 *
 * Complements the per-version table rather than replacing it — the version view
 * answers "what happened", this one answers "where are we".
 */
export function LeadProposalClientTable({
  rollups,
  onOpen,
}: {
  rollups: LeadProposalLeadRollup[];
  onOpen: (rollup: LeadProposalLeadRollup) => void;
}) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Table>
        <THead>
          <TR>
            <TH>Client</TH>
            <TH>Latest</TH>
            <TH className="hidden sm:table-cell">Working Draft</TH>
            <TH className="hidden md:table-cell">Client Version</TH>
            <TH className="hidden lg:table-cell">Versions</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {rollups.map((rollup) => (
            <TR
              key={rollup.leadId}
              onClick={() => onOpen(rollup)}
              className="cursor-pointer"
            >
              <TD>
                <div className="flex items-center gap-2.5">
                  <Avatar name={rollup.leadName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {rollup.leadCompany ?? rollup.leadName}
                    </p>
                    {rollup.leadCompany ? (
                      <p className="truncate text-xs text-muted">
                        {rollup.leadName}
                      </p>
                    ) : null}
                  </div>
                </div>
              </TD>

              <TD>
                <VersionCell version={rollup.summary.latest} showStatus />
              </TD>

              <TD className="hidden sm:table-cell">
                <VersionCell version={rollup.summary.workingDraft} />
              </TD>

              <TD className="hidden md:table-cell">
                <VersionCell version={rollup.summary.clientVersion} showStatus />
              </TD>

              <TD className="hidden lg:table-cell">
                <span className="asc-tabular text-sm text-foreground-soft">
                  {rollup.summary.total}
                </span>
              </TD>

              <TD className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(rollup);
                  }}
                  aria-label={`Open proposals for ${rollup.leadName}`}
                >
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </motion.div>
  );
}

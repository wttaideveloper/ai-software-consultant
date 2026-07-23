import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { LeadProposalStatusBadge } from "@/features/lead-proposals/components/lead-proposal-status-badge";
import type { LeadProposal } from "@/types";
import { formatDate, formatRelativeTime } from "@/utils/format";
import { fadeIn } from "@/utils/motion";

type LeadProposalTableProps = {
  proposals: LeadProposal[];
  onOpen: (proposal: LeadProposal) => void;
};

export function LeadProposalTable({ proposals, onOpen }: LeadProposalTableProps) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Table>
        <THead>
          <TR>
            <TH>Proposal</TH>
            {/* Progressively revealed: the same values stack into the Proposal
                cell on narrower viewports so nothing is lost. */}
            <TH className="hidden md:table-cell">Client</TH>
            <TH className="hidden sm:table-cell">Version</TH>
            <TH>Status</TH>
            <TH className="hidden lg:table-cell">Last Updated</TH>
            <TH className="hidden xl:table-cell">Created By</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {proposals.map((proposal) => (
            <TR
              key={proposal.id}
              onClick={() => onOpen(proposal)}
              className="cursor-pointer"
            >
              <TD>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {proposal.title}
                  </p>
                  <p className="truncate text-xs text-muted md:hidden">
                    V{proposal.versionNumber} · {proposal.leadCompany ?? proposal.leadName}
                  </p>
                </div>
              </TD>

              <TD className="hidden md:table-cell">
                <div className="flex items-center gap-2.5">
                  <Avatar name={proposal.leadName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {proposal.leadName}
                    </p>
                    {proposal.leadCompany ? (
                      <p className="truncate text-xs text-muted">
                        {proposal.leadCompany}
                      </p>
                    ) : null}
                  </div>
                </div>
              </TD>

              <TD className="hidden sm:table-cell">
                <Badge variant="default" size="sm">
                  V{proposal.versionNumber}
                </Badge>
              </TD>

              <TD>
                <LeadProposalStatusBadge status={proposal.status} />
              </TD>

              <TD className="hidden whitespace-nowrap lg:table-cell">
                <span title={formatDate(proposal.updatedAt)}>
                  {formatRelativeTime(proposal.updatedAt)}
                </span>
              </TD>

              <TD className="hidden xl:table-cell">
                {proposal.createdByName ? (
                  <span className="truncate">{proposal.createdByName}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </TD>

              <TD className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(proposal);
                  }}
                  aria-label={`Open ${proposal.title} version ${proposal.versionNumber}`}
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

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ClientLeadStatusBadge } from "@/features/client-requests/components/client-lead-status-badge";
import type { ClientLead } from "@/types";
import { formatDate } from "@/utils/format";
import { fadeIn } from "@/utils/motion";

/** Beyond this, platforms collapse into a "+N" badge to keep the row height stable. */
const MAX_VISIBLE_PLATFORMS = 2;

type ClientRequestTableProps = {
  leads: ClientLead[];
  onOpen: (lead: ClientLead) => void;
};

function PlatformBadges({ lead }: { lead: ClientLead }) {
  // `otherPlatform` is free text the client typed alongside the preset choices.
  const all = [...lead.platforms, ...(lead.otherPlatform ? [lead.otherPlatform] : [])];

  if (all.length === 0) {
    return <span className="text-muted">—</span>;
  }

  const visible = all.slice(0, MAX_VISIBLE_PLATFORMS);
  const overflow = all.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((platform) => (
        <Badge key={platform} variant="default" size="sm">
          {platform}
        </Badge>
      ))}
      {overflow > 0 ? (
        <Badge variant="outline" size="sm" title={all.slice(MAX_VISIBLE_PLATFORMS).join(", ")}>
          +{overflow}
        </Badge>
      ) : null}
    </div>
  );
}

export function ClientRequestTable({ leads, onOpen }: ClientRequestTableProps) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            {/* Progressively revealed: the same values are stacked into the Name
                cell on narrower viewports so nothing is lost. */}
            <TH className="hidden md:table-cell">Company</TH>
            <TH className="hidden lg:table-cell">Email</TH>
            <TH className="hidden xl:table-cell">Phone</TH>
            <TH className="hidden lg:table-cell">Consultation</TH>
            <TH className="hidden xl:table-cell">Platforms</TH>
            <TH>Status</TH>
            <TH className="hidden sm:table-cell">Created</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {leads.map((lead) => (
            <TR
              key={lead.id}
              onClick={() => onOpen(lead)}
              className="cursor-pointer"
            >
              <TD>
                <div className="flex items-center gap-3">
                  <Avatar name={lead.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{lead.name}</p>
                    <p className="truncate text-xs text-muted md:hidden">
                      {lead.company ?? lead.email}
                    </p>
                  </div>
                </div>
              </TD>

              <TD className="hidden md:table-cell">
                {lead.company ? (
                  <span className="truncate">{lead.company}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </TD>

              <TD className="hidden lg:table-cell">
                {/* stopPropagation so using the mailto link doesn't also open the row. */}
                <a
                  href={`mailto:${lead.email}`}
                  onClick={(event) => event.stopPropagation()}
                  className="rounded-sm text-accent-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {lead.email}
                </a>
              </TD>

              <TD className="hidden xl:table-cell">
                {lead.phone ? (
                  <a
                    href={`tel:${lead.phone}`}
                    onClick={(event) => event.stopPropagation()}
                    className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </TD>

              <TD className="hidden lg:table-cell">
                <span className="whitespace-nowrap">{lead.consultationTime}</span>
              </TD>

              <TD className="hidden xl:table-cell">
                <PlatformBadges lead={lead} />
              </TD>

              <TD>
                <ClientLeadStatusBadge status={lead.status} />
              </TD>

              <TD className="hidden whitespace-nowrap sm:table-cell">
                {formatDate(lead.createdAt)}
              </TD>

              <TD className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(lead);
                  }}
                  aria-label={`Open request from ${lead.name}`}
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

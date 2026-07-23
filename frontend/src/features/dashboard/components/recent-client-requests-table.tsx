import { motion } from "framer-motion";
import { ArrowRight, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SectionError } from "@/components/shared/section-error";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ClientLeadStatusBadge } from "@/features/client-requests/components/client-lead-status-badge";
import { useRecentClientRequests } from "@/features/dashboard/hooks/use-recent-client-requests";
import { formatDate } from "@/utils/format";
import { fadeIn } from "@/utils/motion";

function RecentClientRequestsSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="divide-y divide-border">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-6 px-4 py-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentClientRequestsTable() {
  const { data, isLoading, isError, refetch } = useRecentClientRequests();
  const navigate = useNavigate();

  if (isError) {
    return <SectionError message="Couldn't load recent client requests." onRetry={refetch} />;
  }

  if (isLoading) {
    return <RecentClientRequestsSkeleton />;
  }

  const leads = data?.items ?? [];

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No client requests yet"
        description="Requests submitted through the client portal will appear here."
        action={<Button onClick={() => navigate("/client-requests")}>Open client requests</Button>}
      />
    );
  }

  const openLead = (leadId: string) => navigate(`/client-requests/${leadId}`);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Table>
        <THead>
          <TR>
            <TH>Client</TH>
            {/* Company and Project fold into the Client cell on narrow viewports
                rather than being dropped — same pattern as the inbox table. */}
            <TH className="hidden md:table-cell">Company</TH>
            <TH className="hidden lg:table-cell">Project</TH>
            <TH>Status</TH>
            <TH className="hidden sm:table-cell">Created</TH>
            <TH className="text-right">Action</TH>
          </TR>
        </THead>
        <TBody>
          {leads.map((lead) => (
            <TR key={lead.id} onClick={() => openLead(lead.id)} className="cursor-pointer">
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

              {/* projectIdea is unbounded free text — clamp the cell so one long
                  submission can't stretch the row. title= keeps it readable. */}
              <TD className="hidden max-w-[22rem] lg:table-cell">
                <span className="block truncate" title={lead.projectIdea}>
                  {lead.projectIdea}
                </span>
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
                    openLead(lead.id);
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

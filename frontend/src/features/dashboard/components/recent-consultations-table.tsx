import { motion } from "framer-motion";
import { ArrowRight, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ConsultationProgress } from "@/features/dashboard/components/consultation-progress";
import { ConsultationStatusBadge } from "@/features/dashboard/components/consultation-status-badge";
import { useRecentConsultations } from "@/features/dashboard/hooks/use-recent-consultations";
import { formatDate } from "@/utils/format";
import { fadeIn } from "@/utils/motion";
import { SectionError } from "./section-error";

function RecentConsultationsSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-surface">
      <div className="divide-y divide-border">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-6 px-4 py-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentConsultationsTable() {
  const { data, isLoading, isError, refetch } = useRecentConsultations();
  const navigate = useNavigate();

  if (isError) {
    return <SectionError message="Couldn't load recent consultations." onRetry={refetch} />;
  }

  if (isLoading) {
    return <RecentConsultationsSkeleton />;
  }

  const consultations = data?.items ?? [];

  if (consultations.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No consultations yet"
        description="Create your first consultation to start the AI-guided discovery pipeline."
        action={<Button onClick={() => navigate("/consultations")}>New consultation</Button>}
      />
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Table>
        <THead>
          <TR>
            <TH>Project</TH>
            <TH>Status</TH>
            <TH>Last Updated</TH>
            <TH>AI Progress</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {consultations.map((consultation) => (
            <TR
              key={consultation.id}
              onClick={() => navigate("/consultations")}
              className="cursor-pointer"
            >
              <TD className="font-medium text-foreground">{consultation.title}</TD>
              <TD>
                <ConsultationStatusBadge status={consultation.status} />
              </TD>
              <TD>{formatDate(consultation.updatedAt)}</TD>
              <TD>
                <ConsultationProgress status={consultation.status} />
              </TD>
              <TD className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate("/consultations");
                  }}
                >
                  View
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

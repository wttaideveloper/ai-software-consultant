import { motion } from "framer-motion";
import { FolderKanban, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionError } from "@/components/shared/section-error";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConsultationListItem } from "@/features/consultations/components/consultation-list-item";
import { ConsultationListSkeleton } from "@/features/consultations/components/consultation-list-skeleton";
import { CONSULTATION_STATUS_OPTIONS } from "@/features/consultations/consultation-status";
import { useConsultations } from "@/features/consultations/hooks/use-consultations";
import type { Consultation, ConsultationStatus } from "@/types";
import { staggerContainer } from "@/utils/motion";

const PAGE_SIZE = 20;
const STATUS_FILTER_OPTIONS = [{ label: "All statuses", value: "" }, ...CONSULTATION_STATUS_OPTIONS];

type ConsultationListPanelProps = {
  selectedId: string | null;
  onSelect: (consultation: Consultation) => void;
  onCreate: () => void;
};

export function ConsultationListPanel({ selectedId, onSelect, onCreate }: ConsultationListPanelProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ConsultationStatus | "">("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useConsultations({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: status || undefined,
  });

  const consultations = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-border p-4">
        <Button onClick={onCreate} className="w-full justify-center">
          <Plus className="h-4 w-4" />
          New Consultation
        </Button>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-foreground-soft" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search consultations…"
            className="pl-9"
          />
        </div>

        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ConsultationStatus | "");
            setPage(1);
          }}
          options={STATUS_FILTER_OPTIONS}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isError ? (
          <SectionError message="Couldn't load consultations." onRetry={refetch} />
        ) : isLoading ? (
          <ConsultationListSkeleton />
        ) : consultations.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No consultations found"
            description={
              search || status
                ? "Try a different search or filter."
                : "Create your first consultation to get started."
            }
            className="border-0 bg-transparent py-10"
          />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2"
          >
            {consultations.map((consultation) => (
              <ConsultationListItem
                key={consultation.id}
                consultation={consultation}
                isSelected={consultation.id === selectedId}
                onSelect={() => onSelect(consultation)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((value) => Math.min(meta.totalPages, value + 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}

import { FileSignature } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { SectionError } from "@/components/shared/section-error";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadProposalClientTable } from "@/features/lead-proposals/components/lead-proposal-client-table";
import { LeadProposalFilters } from "@/features/lead-proposals/components/lead-proposal-filters";
import { LeadProposalTable } from "@/features/lead-proposals/components/lead-proposal-table";
import {
  useLeadProposalClients,
  useLeadProposalLibrary,
} from "@/features/lead-proposals/hooks/use-lead-proposals";
import {
  PROPOSAL_SORT_OPTIONS,
  type LeadProposalFilterValues,
} from "@/features/lead-proposals/lead-proposal-sort";
import type { LeadProposalStatus, ListLeadProposalsParams } from "@/types";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

const EMPTY_FILTERS: LeadProposalFilterValues = {
  search: "",
  status: "",
  leadId: "",
  sort: "updated-desc",
};

/**
 * Proposal Management — a library of every proposal version across every client
 * request.
 *
 * Replaces the consultation-based proposal screen: proposals now belong to
 * client leads, so there is nothing to select a consultation for. Opening a row
 * goes to the Proposal Editor for that specific version.
 */
export function LeadProposalLibraryPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<LeadProposalFilterValues>(EMPTY_FILTERS);
  /** Debounced mirror of `filters.search` — only this value reaches the query. */
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  const queryParams = useMemo<ListLeadProposalsParams>(() => {
    const sort =
      PROPOSAL_SORT_OPTIONS.find((option) => option.value === filters.sort) ??
      PROPOSAL_SORT_OPTIONS[0];

    return {
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: (filters.status || undefined) as LeadProposalStatus | undefined,
      leadId: filters.leadId || undefined,
      sortBy: sort.sortBy,
      sortDir: sort.sortDir,
    };
  }, [page, debouncedSearch, filters.status, filters.leadId, filters.sort]);

  /**
   * Two grains over the same filters: "versions" is the audit view (what
   * happened), "clients" is the status view (where each client stands). Only
   * the active one fetches.
   */
  const [grouping, setGrouping] = useState<"versions" | "clients">("versions");
  const byVersion = useLeadProposalLibrary(queryParams, grouping === "versions");
  const byClient = useLeadProposalClients(queryParams, grouping === "clients");

  const { isLoading, isError, refetch, isFetching } =
    grouping === "versions" ? byVersion : byClient;

  // Memoized so the derived client options below don't recompute every render.
  const proposals = useMemo(() => byVersion.data?.items ?? [], [byVersion.data]);
  const rollups = byClient.data?.items ?? [];
  const meta = grouping === "versions" ? byVersion.data?.meta : byClient.data?.meta;
  const isEmpty = grouping === "versions" ? proposals.length === 0 : rollups.length === 0;

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "" ||
    filters.leadId !== "" ||
    filters.sort !== EMPTY_FILTERS.sort;

  /** Distinct clients on the current page, for the Client filter. */
  const clientOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const proposal of proposals) {
      if (!seen.has(proposal.leadId)) {
        seen.set(
          proposal.leadId,
          proposal.leadCompany
            ? `${proposal.leadName} · ${proposal.leadCompany}`
            : proposal.leadName,
        );
      }
    }
    return Array.from(seen, ([id, label]) => ({ id, label }));
  }, [proposals]);

  const updateFilters = (patch: Partial<LeadProposalFilterValues>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Proposal Management"
        description="Every proposal version across all client requests. Versions are never overwritten."
        actions={
          <div
            role="group"
            aria-label="Group proposals by"
            className="flex items-center gap-1 rounded-xl border border-border bg-surface-muted p-1"
          >
            {(
              [
                { id: "versions", label: "All versions" },
                { id: "clients", label: "By client" },
              ] as const
            ).map((option) => (
              <Button
                key={option.id}
                variant={grouping === option.id ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={grouping === option.id}
                onClick={() => {
                  setGrouping(option.id);
                  setPage(1);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        }
      />

      <LeadProposalFilters
        values={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        clientOptions={clientOptions}
      />

      {isError ? (
        <SectionError message="Couldn't load proposals." onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={FileSignature}
          title={hasActiveFilters ? "No proposals match those filters" : "No proposals yet"}
          description={
            hasActiveFilters
              ? "Try a different search or status."
              : "Proposals are created from a client request — open one and add its first version."
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => navigate("/client-requests")}>
                Go to Client Requests
              </Button>
            )
          }
        />
      ) : (
        <div className={isFetching ? "opacity-70 transition-opacity" : undefined}>
          {grouping === "versions" ? (
            <LeadProposalTable
              proposals={proposals}
              onOpen={(proposal) =>
                navigate(`/client-requests/${proposal.leadId}/proposals/${proposal.id}`)
              }
            />
          ) : (
            <LeadProposalClientTable
              rollups={rollups}
              // Opens the version that best represents "where this client is":
              // the draft in progress, else whatever they last saw.
              onOpen={(rollup) => {
                const target =
                  rollup.summary.workingDraft ?? rollup.summary.latest;
                navigate(
                  target
                    ? `/client-requests/${rollup.leadId}/proposals/${target.id}`
                    : `/client-requests/${rollup.leadId}`,
                );
              }}
            />
          )}

          {meta && meta.totalPages > 1 ? (
            <div className="mt-4">
              <PaginationControls
                page={meta.page}
                totalPages={meta.totalPages}
                onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                onNext={() =>
                  setPage((current) => Math.min(meta.totalPages, current + 1))
                }
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

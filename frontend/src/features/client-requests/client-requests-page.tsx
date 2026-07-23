import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { SectionError } from "@/components/shared/section-error";
import { ClientRequestEmptyState } from "@/features/client-requests/components/client-request-empty-state";
import {
  ClientRequestFilters,
  type ClientRequestFilterValues,
} from "@/features/client-requests/components/client-request-filters";
import { ClientRequestSkeleton } from "@/features/client-requests/components/client-request-skeleton";
import { ClientRequestTable } from "@/features/client-requests/components/client-request-table";
import { useClientLeads } from "@/features/client-requests/hooks/use-client-leads";
import type { ListClientLeadsParams } from "@/types";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

const EMPTY_FILTERS: ClientRequestFilterValues = {
  search: "",
  status: "",
  dateFrom: "",
  dateTo: "",
};

export function ClientRequestsPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<ClientRequestFilterValues>(EMPTY_FILTERS);
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

  const queryParams = useMemo<ListClientLeadsParams>(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: filters.status || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }),
    [page, debouncedSearch, filters.status, filters.dateFrom, filters.dateTo],
  );

  const { data, isLoading, isError, refetch, isFetching } =
    useClientLeads(queryParams);

  const leads = data?.items ?? [];
  const meta = data?.meta;

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo);

  // Any filter change invalidates the current page number — page 4 of the old
  // result set is meaningless against the new one.
  const handleFilterChange = (next: Partial<ClientRequestFilterValues>) => {
    setFilters((current) => ({ ...current, ...next }));
    if (!("search" in next)) {
      setPage(1);
    }
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const description = meta
    ? `${meta.total} request${meta.total === 1 ? "" : "s"} submitted through the client portal.`
    : "Consultation requests submitted through the public client portal.";

  return (
    <div>
      <PageHeader title="Client Requests" description={description} />

      <ClientRequestFilters
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="mt-4">
        {isError ? (
          <SectionError
            message="Couldn't load client requests."
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <ClientRequestSkeleton />
        ) : leads.length === 0 ? (
          <ClientRequestEmptyState
            hasFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <div
            // Dims the table while a background refetch resolves, so paging
            // reads as "updating" rather than appearing frozen.
            className={
              isFetching ? "opacity-60 transition-opacity duration-200" : undefined
            }
          >
            <ClientRequestTable
              leads={leads}
              onOpen={(lead) => navigate(`/client-requests/${lead.id}`)}
            />
            {meta && meta.totalPages > 1 ? (
              <PaginationControls
                page={meta.page}
                totalPages={meta.totalPages}
                onPrevious={() => setPage((value) => Math.max(1, value - 1))}
                onNext={() =>
                  setPage((value) => Math.min(meta.totalPages, value + 1))
                }
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { SectionError } from "@/components/shared/section-error";
import { Button } from "@/components/ui/button";
import { DeleteFeatureLibraryDialog } from "@/features/feature-library/components/delete-feature-library-dialog";
import { FeatureLibraryEmptyState } from "@/features/feature-library/components/feature-library-empty-state";
import { FeatureLibraryFilters } from "@/features/feature-library/components/feature-library-filters";
import { FeatureLibraryFormModal } from "@/features/feature-library/components/feature-library-form-modal";
import { FeatureLibrarySkeleton } from "@/features/feature-library/components/feature-library-skeleton";
import { FeatureLibraryTable } from "@/features/feature-library/components/feature-library-table";
import { useFeatureLibrary } from "@/features/feature-library/hooks/use-feature-library";
import type { FeatureLibraryItem } from "@/types";

const PAGE_SIZE = 10;

type FormModalState = {
  open: boolean;
  item: FeatureLibraryItem | null;
};

type ActiveFilterValue = "" | "true" | "false";

export function FeatureLibraryPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [category, setCategory] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("");
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState<FormModalState>({ open: false, item: null });
  const [deleteTarget, setDeleteTarget] = useState<FeatureLibraryItem | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCategory(categoryInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [categoryInput]);

  const { data, isLoading, isError, refetch } = useFeatureLibrary({
    page,
    pageSize: PAGE_SIZE,
    name: search || undefined,
    category: category || undefined,
    isActive: activeFilter === "" ? undefined : activeFilter === "true",
  });

  const items = data?.items ?? [];
  const meta = data?.meta;
  const hasFilters = Boolean(search || category || activeFilter);

  const openCreateModal = () => setFormModal({ open: true, item: null });

  return (
    <div>
      <PageHeader
        title="Feature Library"
        description={
          meta
            ? `${meta.total} feature template${meta.total === 1 ? "" : "s"} in your library.`
            : "Reusable feature templates that inform future estimations and matching suggestions."
        }
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Create Feature
          </Button>
        }
      />

      <FeatureLibraryFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        category={categoryInput}
        onCategoryChange={setCategoryInput}
        activeFilter={activeFilter}
        onActiveFilterChange={(value) => {
          setActiveFilter(value);
          setPage(1);
        }}
      />

      <div className="mt-4">
        {isError ? (
          <SectionError message="Couldn't load the feature library." onRetry={refetch} />
        ) : isLoading ? (
          <FeatureLibrarySkeleton />
        ) : items.length === 0 ? (
          <FeatureLibraryEmptyState hasFilters={hasFilters} onCreate={openCreateModal} />
        ) : (
          <>
            <FeatureLibraryTable
              items={items}
              onEdit={(item) => setFormModal({ open: true, item })}
              onDelete={setDeleteTarget}
            />
            {meta && meta.totalPages > 1 ? (
              <PaginationControls
                page={meta.page}
                totalPages={meta.totalPages}
                onPrevious={() => setPage((value) => Math.max(1, value - 1))}
                onNext={() => setPage((value) => Math.min(meta.totalPages, value + 1))}
              />
            ) : null}
          </>
        )}
      </div>

      <FeatureLibraryFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, item: null })}
        item={formModal.item}
      />

      <DeleteFeatureLibraryDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        item={deleteTarget}
      />
    </div>
  );
}

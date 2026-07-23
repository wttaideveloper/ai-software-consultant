import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({
  page,
  totalPages,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-xs"
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={onPrevious}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Previous
      </Button>

      <span aria-live="polite" className="text-xs text-muted asc-tabular">
        Page <span className="font-semibold text-foreground">{page}</span> of{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
      </span>

      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={onNext}
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </nav>
  );
}

import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({ page, totalPages, onPrevious, onNext }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={onPrevious}>
        Previous
      </Button>
      <span className="text-xs text-muted">
        Page {page} of {totalPages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={onNext}>
        Next
      </Button>
    </div>
  );
}

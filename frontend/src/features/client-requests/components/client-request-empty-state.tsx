import { Inbox, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type ClientRequestEmptyStateProps = {
  /** True when filters/search are active — changes "nothing yet" into "nothing matched". */
  hasFilters: boolean;
  onClearFilters: () => void;
};

export function ClientRequestEmptyState({
  hasFilters,
  onClearFilters,
}: ClientRequestEmptyStateProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={SearchX}
        title="No matching requests"
        description="No client requests match your current search and filters. Try broadening them."
        action={
          <Button variant="secondary" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={Inbox}
      title="No client requests yet"
      description="When a visitor completes the public consultation flow and requests a proposal, their request will appear here."
    />
  );
}

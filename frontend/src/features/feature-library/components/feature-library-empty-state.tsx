import { Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type FeatureLibraryEmptyStateProps = {
  hasFilters: boolean;
  onCreate: () => void;
};

export function FeatureLibraryEmptyState({ hasFilters, onCreate }: FeatureLibraryEmptyStateProps) {
  return (
    <EmptyState
      icon={Library}
      title="No Features Found"
      description={
        hasFilters
          ? "No templates match your search or filters. Try adjusting them."
          : "Add reusable feature templates with default complexity, hours, tags, and technologies to accelerate future scoping."
      }
      action={<Button onClick={onCreate}>Create Feature</Button>}
    />
  );
}

import { Library, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function FeatureLibraryPage() {
  return (
    <div>
      <PageHeader
        title="Feature Library"
        description="Reusable feature templates that inform future estimations and matching suggestions."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Add template
          </Button>
        }
      />
      <EmptyState
        icon={Library}
        title="Library is empty"
        description="Add reusable feature templates with default complexity, hours, tags, and technologies to accelerate future scoping."
      />
    </div>
  );
}

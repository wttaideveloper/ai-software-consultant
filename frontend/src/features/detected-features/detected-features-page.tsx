import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function DetectedFeaturesPage() {
  return (
    <div>
      <PageHeader
        title="Detected Features"
        description="AI-extracted feature inventory grouped by category with priority and complexity signals."
        actions={<Button>Detect features</Button>}
      />
      <EmptyState
        icon={Sparkles}
        title="No features detected"
        description="Run feature detection against a requirement summary to populate prioritized feature cards and confidence scores."
      />
    </div>
  );
}

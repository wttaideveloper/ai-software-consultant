import { Calculator } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function EstimationPage() {
  return (
    <div>
      <PageHeader
        title="Estimations"
        description="Effort models, timelines, and risk-aware breakdowns derived from detected features."
        actions={<Button>Generate estimate</Button>}
      />
      <EmptyState
        icon={Calculator}
        title="No estimation yet"
        description="Once features are detected, generate an estimate to review hours, weeks, team size, and category breakdown."
      />
    </div>
  );
}

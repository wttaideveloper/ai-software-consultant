import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function RequirementSummaryPage() {
  return (
    <div>
      <PageHeader
        title="Requirement Summary"
        description="Structured and markdown requirement documents generated from consultation conversations."
        actions={<Button>Generate summary</Button>}
      />
      <EmptyState
        icon={FileText}
        title="No requirement summary"
        description="Generate a summary after you have enough conversation context. Structured goals, users, and open questions will appear here."
      />
    </div>
  );
}

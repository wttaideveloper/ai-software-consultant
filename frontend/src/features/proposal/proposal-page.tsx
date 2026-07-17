import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function ProposalPage() {
  return (
    <div>
      <PageHeader
        title="Proposals"
        description="Client-ready proposals composed from requirements, features, and estimation data."
        actions={<Button>Generate proposal</Button>}
      />
      <EmptyState
        icon={BookOpen}
        title="No proposal drafted"
        description="Generate a professional proposal with scope, deliverables, timeline, and pricing notes when the upstream artifacts are ready."
      />
    </div>
  );
}

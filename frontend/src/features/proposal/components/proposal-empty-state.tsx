import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type ProposalEmptyStateProps = {
  onGenerate: () => void;
  isGenerating: boolean;
};

export function ProposalEmptyState({ onGenerate, isGenerating }: ProposalEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={BookOpen}
        title="No Proposal Generated"
        description="Generate a client-ready proposal from this consultation's requirement summary, detected features, and estimation."
        action={
          <Button onClick={onGenerate} isLoading={isGenerating}>
            Generate Proposal
          </Button>
        }
      />
    </div>
  );
}

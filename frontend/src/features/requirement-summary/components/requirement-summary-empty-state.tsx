import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type RequirementSummaryEmptyStateProps = {
  onGenerate: () => void;
  isGenerating: boolean;
};

export function RequirementSummaryEmptyState({
  onGenerate,
  isGenerating,
}: RequirementSummaryEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={FileText}
        title="No Requirement Summary Generated"
        description="Generate a structured requirement summary from the AI chat conversation for this consultation."
        action={
          <Button onClick={onGenerate} isLoading={isGenerating}>
            Generate Summary
          </Button>
        }
      />
    </div>
  );
}

import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type EstimationEmptyStateProps = {
  onGenerate: () => void;
  isGenerating: boolean;
};

export function EstimationEmptyState({ onGenerate, isGenerating }: EstimationEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={Calculator}
        title="No Estimation Generated"
        description="Generate an effort estimate from this consultation's requirement summary and detected features."
        action={
          <Button onClick={onGenerate} isLoading={isGenerating}>
            Generate Estimation
          </Button>
        }
      />
    </div>
  );
}

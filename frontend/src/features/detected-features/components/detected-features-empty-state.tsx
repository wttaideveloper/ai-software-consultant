import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type DetectedFeaturesEmptyStateProps = {
  onDetect: () => void;
  isDetecting: boolean;
};

export function DetectedFeaturesEmptyState({ onDetect, isDetecting }: DetectedFeaturesEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <EmptyState
        icon={Sparkles}
        title="No Features Detected"
        description="Run AI feature detection against this consultation's requirement summary to extract a prioritized feature inventory."
        action={
          <Button onClick={onDetect} isLoading={isDetecting}>
            Detect Features
          </Button>
        }
      />
    </div>
  );
}

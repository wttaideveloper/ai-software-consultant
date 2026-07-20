import { RefreshCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/utils/format";

type DetectedFeaturesHeaderProps = {
  consultationTitle: string;
  totalFeatures: number;
  verifiedCount: number;
  lastUpdated: string | null;
  hasFeatures: boolean;
  isDetecting: boolean;
  onDetect: () => void;
};

export function DetectedFeaturesHeader({
  consultationTitle,
  totalFeatures,
  verifiedCount,
  lastUpdated,
  hasFeatures,
  isDetecting,
  onDetect,
}: DetectedFeaturesHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Detected Features</h1>
          {hasFeatures ? (
            <>
              <Badge variant="accent">{totalFeatures} total</Badge>
              <Badge variant="success">{verifiedCount} verified</Badge>
            </>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-muted">
          {consultationTitle}
          {lastUpdated ? ` · Updated ${formatRelativeTime(lastUpdated)}` : null}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant={hasFeatures ? "secondary" : "primary"}
          size="sm"
          onClick={onDetect}
          isLoading={isDetecting}
        >
          {hasFeatures ? (
            <>
              <RefreshCcw className="h-3.5 w-3.5" />
              Re-detect
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Detect Features
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

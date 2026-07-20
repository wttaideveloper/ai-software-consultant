import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type SectionErrorProps = {
  message?: string;
  onRetry: () => void;
};

export function SectionError({
  message = "Something went wrong while loading this section.",
  onRetry,
}: SectionErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-subtle text-danger">
        <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-muted">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

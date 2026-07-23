import { AlertTriangle, RefreshCcw } from "lucide-react";
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
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-danger/30 bg-danger-subtle/40 px-6 py-12 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-subtle text-danger">
        <AlertTriangle className="h-5 w-5" strokeWidth={1.85} />
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-foreground-soft text-pretty">
        {message}
      </p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        <RefreshCcw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  );
}

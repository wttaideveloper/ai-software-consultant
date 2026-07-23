import { cn } from "@/utils/cn";

type MetricCardProps = {
  label: string;
  value: string;
  /** True for Project Cost / Technology Stack — no source data in the reused Estimation response, shown as an honest "not available" state instead of fabricated. */
  unavailable?: boolean;
};

export function MetricCard({ label, value, unavailable }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-lg font-semibold",
          unavailable ? "text-muted" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

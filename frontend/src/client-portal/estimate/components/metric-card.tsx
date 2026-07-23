import { cn } from "@/utils/cn";

type MetricCardProps = {
  label: string;
  value: string;
  /** Dims the value to signal a "not available" fallback (e.g. cost or tech stack the response didn't include) rather than a real figure. */
  unavailable?: boolean;
  /** Small caveat under the value — e.g. why a timeline is shown as a range. */
  hint?: string;
};

export function MetricCard({ label, value, unavailable, hint }: MetricCardProps) {
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
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

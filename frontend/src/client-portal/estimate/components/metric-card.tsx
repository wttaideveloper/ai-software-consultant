import { Card } from "@/components/ui";
import { cn } from "@/utils/cn";

type MetricCardProps = {
  label: string;
  value: string;
  /** True for Project Cost / Technology Stack — no source data in the reused Estimation response, shown as an honest "not available" state instead of fabricated. */
  unavailable?: boolean;
};

export function MetricCard({ label, value, unavailable }: MetricCardProps) {
  return (
    <Card hover={false}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-lg font-semibold",
          unavailable ? "text-muted italic" : "text-foreground",
        )}
      >
        {value}
      </p>
    </Card>
  );
}

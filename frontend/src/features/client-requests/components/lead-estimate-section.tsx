import { AlertTriangle, Calculator, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import type { ClientLeadEstimate, ClientLeadFeatureComplexity } from "@/types";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "info";

const COMPLEXITY_VARIANT: Record<ClientLeadFeatureComplexity, BadgeVariant> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
};

function MetricTile({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-canvas p-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground asc-tabular">
        {value}
        {suffix ? (
          <span className="ml-1 text-sm font-medium text-muted">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}

function ListPanel({
  icon: Icon,
  title,
  items,
}: {
  icon: LucideIcon;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-canvas p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.85} />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">None specified.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex gap-2 text-sm text-foreground-soft">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="leading-relaxed text-pretty">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Read-only by design: this estimate is the snapshot the client was shown when
 * they submitted. Editing or regenerating it would destroy that record, so no
 * write path is offered here.
 */
export function LeadEstimateSection({ estimate }: { estimate: ClientLeadEstimate }) {
  const totalHours = estimate.estimatedHours || 1;
  const confidencePercent = Math.round(estimate.confidence * 100);

  return (
    <WorkspaceSection
      id="estimate"
      icon={Calculator}
      title="Estimate"
      description="Snapshot shown to the client at submission — read-only"
      actions={
        <Badge variant={COMPLEXITY_VARIANT[estimate.complexity] ?? "default"} dot>
          {estimate.complexity} complexity
        </Badge>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Estimated Hours" value={estimate.estimatedHours} suffix="h" />
        <MetricTile label="Timeline" value={estimate.estimatedWeeks} suffix="weeks" />
        <MetricTile label="Team Size" value={estimate.teamSize} />
        <MetricTile label="Confidence" value={confidencePercent} suffix="%" />
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Breakdown</p>
        {estimate.breakdown.length === 0 ? (
          <p className="text-sm text-muted">No breakdown was recorded.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Category</TH>
                <TH>Hours</TH>
                <TH>% of Total</TH>
              </TR>
            </THead>
            <TBody>
              {estimate.breakdown.map((item, index) => (
                <TR key={`${item.category}-${index}`}>
                  <TD className="font-medium text-foreground">{item.category}</TD>
                  <TD className="asc-tabular">{item.hours}h</TD>
                  <TD className="asc-tabular">
                    {Math.round((item.hours / totalHours) * 100)}%
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <ListPanel icon={Lightbulb} title="Assumptions" items={estimate.assumptions} />
        <ListPanel icon={AlertTriangle} title="Risks" items={estimate.risks} />
      </div>
    </WorkspaceSection>
  );
}

import { AlertTriangle, Calculator, Cpu, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  formatPriceRange,
  formatWeekRange,
  toPriceRange,
  toWeekRange,
} from "@/client-portal/estimate/estimate-pricing";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { TechStackGroups } from "@/components/shared/tech-stack-groups";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import { cn } from "@/utils/cn";
import type {
  ClientLeadEstimate,
  ClientLeadFeatureComplexity,
  ClientLeadPricing,
  TechStackGroup,
} from "@/types";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "info";

const COMPLEXITY_VARIANT: Record<ClientLeadFeatureComplexity, BadgeVariant> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
};

const COMPLEXITY_LABEL: Record<ClientLeadFeatureComplexity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

function MetricTile({
  label,
  value,
  suffix,
  className,
  muted,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  className?: string;
  /** Dims the value — used for "Not available" placeholders. */
  muted?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-canvas p-4", className)}>
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p
        className={cn(
          "asc-tabular mt-2 text-2xl font-semibold tracking-tight",
          muted ? "text-muted" : "text-foreground",
        )}
      >
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
 * Read-only by design: this is the exact estimate the client was shown when they
 * submitted — cost, timeline, complexity, team, hours and tech stack, all frozen.
 *
 * Every figure comes from the stored snapshot. The cost and timeline *ranges* are
 * rebuilt with the same pure helpers the Client Portal used (`toPriceRange` /
 * `toWeekRange`), so the Admin sees the identical wording — no AI, no Cost Engine,
 * no recalculation. `pricing` is null and `techStack` empty for leads submitted
 * before the snapshot carried them, and both degrade to a clear placeholder.
 */
export function LeadEstimateSection({
  estimate,
  techStack,
  pricing,
}: {
  estimate: ClientLeadEstimate;
  techStack: TechStackGroup[];
  pricing: ClientLeadPricing | null;
}) {
  const totalHours = estimate.estimatedHours || 1;
  const confidencePercent = Math.round(estimate.confidence * 100);

  const costDisplay = pricing
    ? formatPriceRange(toPriceRange(pricing.breakdown.finalPrice), pricing.currency)
    : "Not available";
  const timelineDisplay =
    estimate.estimatedWeeks === null
      ? estimate.maintenancePlan
        ? `${estimate.maintenancePlan.supportHoursPerMonth} hrs / month`
        : "Ongoing"
      : formatWeekRange(toWeekRange(estimate.estimatedWeeks));

  return (
    <WorkspaceSection
      id="estimate"
      icon={Calculator}
      title="Estimate"
      description="Snapshot shown to the client at submission — read-only"
      actions={
        <Badge variant={COMPLEXITY_VARIANT[estimate.complexity] ?? "default"} dot>
          {COMPLEXITY_LABEL[estimate.complexity] ?? estimate.complexity} complexity
        </Badge>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Estimated Project Cost"
          value={costDisplay}
          className="sm:col-span-2"
          muted={!pricing}
        />
        <MetricTile label="Estimated Timeline" value={timelineDisplay} />
        <MetricTile label="Complexity" value={COMPLEXITY_LABEL[estimate.complexity] ?? estimate.complexity} />
        <MetricTile label="Recommended Team" value={estimate.teamSize} suffix="Members" />
        <MetricTile label="Estimated Hours" value={estimate.estimatedHours} suffix="Hours" />
        <MetricTile label="Confidence" value={confidencePercent} suffix="%" />
      </div>

      <p className="mt-2 text-xs text-muted text-pretty">
        Cost and timeline are approximate ranges, shown exactly as the client saw them
        at submission.
      </p>

      <div className="mt-5">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.85} />
          <p className="text-sm font-semibold text-foreground">Technology Stack</p>
        </div>
        <TechStackGroups
          value={techStack}
          variant="compact"
          className="mt-3"
          emptyText="Not recorded for this request."
        />
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

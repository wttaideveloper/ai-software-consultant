import { MetricCard } from "@/client-portal/estimate/components/metric-card";
import type { ClientEstimate } from "@/store/client-consultation.store";

/**
 * The engagement-specific half of the estimate.
 *
 * A support engagement and a new build are not the same document with different
 * numbers — they answer different questions. A client asking for production
 * support wants to know the engagement model, the monthly capacity and the SLA;
 * a delivery date would be meaningless to them, and this component is what makes
 * sure they are never shown one.
 *
 * Purely presentational: every value here was produced by the AI and reconciled
 * server-side (estimation.mode.ts), so which block is populated is already
 * decided by the time it arrives.
 */

const ENGAGEMENT_TYPE_LABELS: Record<string, string> = {
  ONE_TIME_FIX: "One-time fix",
  MONTHLY_RETAINER: "Monthly retainer",
  ONGOING_SUPPORT: "Ongoing support",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

type ModeEstimateDetailsProps = {
  estimate: ClientEstimate;
};

export function ModeEstimateDetails({ estimate }: ModeEstimateDetailsProps) {
  const { maintenancePlan, migrationPlan, enhancementImpact } = estimate;

  if (maintenancePlan) {
    return (
      <section aria-label="Support engagement details" className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Engagement Type"
            value={
              ENGAGEMENT_TYPE_LABELS[maintenancePlan.engagementType] ??
              maintenancePlan.engagementType
            }
          />
          <MetricCard
            label="Support Hours / Month"
            value={`${maintenancePlan.supportHoursPerMonth} hrs`}
          />
          <MetricCard
            label="Priority Level"
            value={
              PRIORITY_LABELS[maintenancePlan.priorityLevel] ??
              maintenancePlan.priorityLevel
            }
          />
        </div>

        <DetailPanel title="Suggested SLA">
          <p className="text-sm text-foreground-soft">{maintenancePlan.suggestedSla}</p>
        </DetailPanel>

        {maintenancePlan.supportScope.length > 0 ? (
          <DetailPanel title="Support Scope">
            <BulletList items={maintenancePlan.supportScope} />
          </DetailPanel>
        ) : null}
      </section>
    );
  }

  if (migrationPlan) {
    return (
      <section aria-label="Migration plan" className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard label="Downtime Estimate" value={migrationPlan.downtimeEstimate} />
          <MetricCard
            label="Migration Phases"
            value={`${migrationPlan.phases.length} phase${
              migrationPlan.phases.length === 1 ? "" : "s"
            }`}
          />
        </div>

        <DetailPanel title="Migration Phases">
          <ol className="flex flex-col gap-3">
            {migrationPlan.phases.map((phase, index) => (
              <li key={`${phase.name}-${index}`} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-accent-subtle text-xs font-semibold text-accent-text"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {phase.name}
                    <span className="ml-2 text-xs font-normal text-muted">
                      {phase.hours} hrs
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-foreground-soft">
                    {phase.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </DetailPanel>

        <DetailPanel title="Rollback Strategy">
          <p className="text-sm text-foreground-soft">{migrationPlan.rollbackStrategy}</p>
        </DetailPanel>
      </section>
    );
  }

  if (enhancementImpact) {
    const panels: Array<{ title: string; items: string[] }> = [
      { title: "Impact Analysis", items: enhancementImpact.impactAnalysis },
      { title: "Affected Modules", items: enhancementImpact.affectedModules },
      { title: "Dependencies", items: enhancementImpact.dependencies },
    ].filter((panel) => panel.items.length > 0);

    if (panels.length === 0) {
      return null;
    }

    return (
      <section aria-label="Enhancement impact" className="flex flex-col gap-4">
        {panels.map((panel) => (
          <DetailPanel key={panel.title} title={panel.title}>
            <BulletList items={panel.items} />
          </DetailPanel>
        ))}
      </section>
    );
  }

  // NEW_PROJECT carries no engagement block — the standard metrics say it all.
  return null;
}

function DetailPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex gap-2 text-sm text-foreground-soft"
        >
          <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

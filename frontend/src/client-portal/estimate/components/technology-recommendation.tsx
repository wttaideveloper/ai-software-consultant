import { ArrowDown } from "lucide-react";
import { TECH_STACK_HELPER_TEXT } from "@/client-portal/estimate/estimate-pricing";
import { Badge } from "@/components/ui/badge";
import { TechStackGroups } from "@/components/shared/tech-stack-groups";
import type { ClientEstimate } from "@/store/client-consultation.store";
import { CONSULTATION_MODES, type ConsultationMode } from "@/types/consultation-mode";
import type { TechStackValue } from "@/types/tech-stack";
import { toTechStackGroups } from "@/types/tech-stack";

/**
 * The technology half of the estimate, which is a different question per mode.
 *
 * A greenfield stack is the right answer only when nothing exists yet. Showing
 * the same "Frontend / Backend / Database / Infrastructure" list to a client who
 * already runs a system reads as a proposal to rebuild it — precisely the message
 * an enhancement, a support engagement or a migration must not send. So each mode
 * gets the section that actually answers its question:
 *
 *   NEW_PROJECT          full recommended stack, grouped by category
 *   FEATURE_ENHANCEMENT  only the technologies the new work introduces
 *   MAINTENANCE          no technologies at all — a scope of service instead
 *   MODERNIZATION        current stack → recommended stack
 *
 * Presentation only. The composition rule lives server-side in the mode profile's
 * `techStackPolicy`, so what arrives here is already the right *content*; this
 * component decides the right *framing*. Nothing here touches effort, cost, team
 * size or the timeline.
 */

/**
 * Fallback support scope, used when the AI returned none.
 *
 * A support engagement always has a scope — leaving the section blank because the
 * model omitted one would tell the client nothing about what they are buying.
 * These are the standard inclusions any retainer covers.
 */
const DEFAULT_SUPPORT_SCOPE = [
  "Bug Fixes",
  "Performance Optimization",
  "Security Updates",
  "Monitoring",
  "Backups",
  "Dependency Updates",
  "Infrastructure Maintenance",
];

type TechnologyRecommendationProps = {
  consultationMode: ConsultationMode;
  techStack: TechStackValue;
  estimate: ClientEstimate | null;
};

function SectionShell({
  title,
  description,
  children,
  helperText,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  helperText?: string;
}) {
  return (
    <section aria-label={title}>
      <h2 className="text-sm font-semibold tracking-tight text-foreground-soft">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-pretty text-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-3">{children}</div>
      {helperText ? (
        <p className="mt-3 text-xs leading-relaxed text-pretty text-muted">
          {helperText}
        </p>
      ) : null}
    </section>
  );
}

/** Wrapping chips — technology names run long, and `Badge` is nowrap by default. */
function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge
          key={item}
          variant="accent"
          className="max-w-full whitespace-normal break-words text-left"
        >
          {item}
        </Badge>
      ))}
    </div>
  );
}

export function TechnologyRecommendation({
  consultationMode,
  techStack,
  estimate,
}: TechnologyRecommendationProps) {
  // ── Maintenance: services, not technologies ──────────────────────────────
  if (consultationMode === CONSULTATION_MODES.MAINTENANCE) {
    const scope = estimate?.maintenancePlan?.supportScope?.length
      ? estimate.maintenancePlan.supportScope
      : DEFAULT_SUPPORT_SCOPE;

    return (
      <SectionShell
        title="Support Scope"
        description="What this engagement covers. A support arrangement is bought as a service, so there is no build stack to recommend."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {scope.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground-soft"
            >
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
              />
              {item}
            </li>
          ))}
        </ul>
      </SectionShell>
    );
  }

  // ── Modernization: current → recommended ─────────────────────────────────
  if (consultationMode === CONSULTATION_MODES.MODERNIZATION) {
    const currentStack = estimate?.migrationPlan?.currentStack ?? [];
    const recommendedGroups = toTechStackGroups(techStack);
    const recommendedItems = recommendedGroups.flatMap((group) => group.items);

    return (
      <SectionShell
        title="Migration Stack"
        description="Where the system runs today, and what it is being migrated to."
        helperText={TECH_STACK_HELPER_TEXT}
      >
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-border bg-surface-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Current Stack
            </p>
            <div className="mt-2.5">
              {currentStack.length > 0 ? (
                <Chips items={currentStack} />
              ) : (
                <p className="text-sm text-muted">
                  Not captured during discovery.
                </p>
              )}
            </div>
          </div>

          <div
            className="flex items-center justify-center text-accent"
            aria-hidden="true"
          >
            <ArrowDown className="size-5" strokeWidth={2} />
          </div>

          <div className="rounded-2xl border border-accent bg-surface p-4 asc-shadow-accent">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-text">
              Recommended Stack
            </p>
            <div className="mt-2.5">
              {recommendedItems.length > 0 ? (
                <Chips items={recommendedItems} />
              ) : (
                <p className="text-sm text-muted">Not available for this estimate.</p>
              )}
            </div>
          </div>
        </div>
      </SectionShell>
    );
  }

  // ── Enhancement: only what the new work introduces ───────────────────────
  if (consultationMode === CONSULTATION_MODES.FEATURE_ENHANCEMENT) {
    // Flattened rather than grouped: these are a handful of additions to a stack
    // the client already has, and splitting three items across three category
    // cards implies far more structure than an enhancement actually involves.
    const additions = toTechStackGroups(techStack).flatMap((group) => group.items);

    return (
      <SectionShell
        title="Recommended Technologies for Enhancement"
        description="Only what the requested features add. Your existing stack stays as it is."
        helperText={TECH_STACK_HELPER_TEXT}
      >
        {additions.length > 0 ? (
          <Chips items={additions} />
        ) : (
          <p className="text-sm text-muted">
            No new technologies are required — the requested features can be built
            with your existing stack.
          </p>
        )}
      </SectionShell>
    );
  }

  // ── New project: unchanged full grouped stack ────────────────────────────
  return (
    <SectionShell title="Technology Stack" helperText={TECH_STACK_HELPER_TEXT}>
      <TechStackGroups
        value={techStack}
        emptyText="Not available for this estimate."
      />
    </SectionShell>
  );
}

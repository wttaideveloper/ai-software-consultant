import { Calculator } from "lucide-react";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TechStackField } from "@/features/proposal-editor/components/tech-stack-field";
import { formatProposalEstimate } from "@/features/proposal-editor/proposal-estimate";
import { cn } from "@/utils/cn";
import type { ProposalProjectEstimate } from "@/types";

const COMPLEXITY_OPTIONS = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
];

/** Empty → null (cost is optional); otherwise the parsed number, or null if invalid. */
function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** For fields that always have a value (hours, weeks, team): never negative, never NaN. */
function parseNumber(raw: string): number {
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function PreviewTile({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-canvas p-3.5">
      <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{label}</p>
      <p
        className={cn(
          "asc-tabular mt-1.5 text-base font-semibold tracking-tight",
          muted ? "text-muted" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Editable Project Estimate for one proposal version.
 *
 * Prefilled from the lead's frozen snapshot, but editable here so an admin can
 * tune the figures for this specific proposal — the client's original lead
 * estimate is never touched. The controls live inside the editor's shared
 * `<fieldset disabled>`, so a locked version renders them read-only automatically.
 * Cost and timeline are edited as range endpoints; the live tiles show exactly the
 * strings the client would read.
 */
export function ProposalProjectEstimate({
  value,
  onChange,
}: {
  value: ProposalProjectEstimate;
  onChange: (next: ProposalProjectEstimate) => void;
}) {
  const set = (patch: Partial<ProposalProjectEstimate>) =>
    onChange({ ...value, ...patch });

  const view = formatProposalEstimate(value);

  return (
    <WorkspaceSection
      id="project-estimate"
      icon={Calculator}
      title="Project Estimate"
      description="Prefilled from the client's request — editable for this proposal version"
      actions={
        <Badge variant="info" size="sm">
          Editable
        </Badge>
      }
    >
      {/* Live preview of the ranges the client sees, kept in sync as fields change. */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <PreviewTile
          label="Estimated Project Cost"
          value={view.costRange ?? "Not set"}
          muted={!view.costRange}
        />
        <PreviewTile label="Estimated Timeline" value={view.timelineRange} />
        <PreviewTile label="Estimated Hours" value={`${view.estimatedHours} Hours`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label={`Cost minimum (${value.currency})`}
          type="number"
          inputMode="decimal"
          min={0}
          value={value.costMin ?? ""}
          onChange={(event) => set({ costMin: parseOptionalNumber(event.target.value) })}
        />
        <Input
          label={`Cost maximum (${value.currency})`}
          type="number"
          inputMode="decimal"
          min={0}
          value={value.costMax ?? ""}
          onChange={(event) => set({ costMax: parseOptionalNumber(event.target.value) })}
        />
        <Select
          label="Complexity"
          options={COMPLEXITY_OPTIONS}
          value={value.complexity}
          onChange={(event) =>
            set({ complexity: event.target.value as ProposalProjectEstimate["complexity"] })
          }
        />
        <Input
          label="Timeline minimum (weeks)"
          type="number"
          inputMode="numeric"
          min={0}
          value={value.timelineMinWeeks}
          onChange={(event) => set({ timelineMinWeeks: parseNumber(event.target.value) })}
        />
        <Input
          label="Timeline maximum (weeks)"
          type="number"
          inputMode="numeric"
          min={0}
          value={value.timelineMaxWeeks}
          onChange={(event) => set({ timelineMaxWeeks: parseNumber(event.target.value) })}
        />
        <Input
          label="Estimated hours"
          type="number"
          inputMode="numeric"
          min={0}
          value={value.estimatedHours}
          onChange={(event) => set({ estimatedHours: parseNumber(event.target.value) })}
        />
        <Input
          label="Recommended team (members)"
          type="number"
          inputMode="numeric"
          min={0}
          value={value.teamSize}
          onChange={(event) => set({ teamSize: parseNumber(event.target.value) })}
        />
      </div>

      <div className="mt-4">
        <p className="mb-3 text-sm font-medium text-foreground">Technology stack</p>
        <TechStackField
          value={value.techStack}
          onChange={(techStack) => set({ techStack })}
        />
      </div>

      <p className="mt-4 text-xs text-muted text-pretty">
        These figures were shown to the client as approximate ranges. Editing them
        applies to this proposal version only — the client's original estimate stays
        unchanged.
      </p>
    </WorkspaceSection>
  );
}

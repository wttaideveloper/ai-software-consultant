import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LEAD_PROPOSAL_STATUS_META } from "@/features/lead-proposals/lead-proposal-status";
import {
  PROPOSAL_SORT_OPTIONS,
  type LeadProposalFilterValues,
} from "@/features/lead-proposals/lead-proposal-sort";
import { LEAD_PROPOSAL_STATUSES } from "@/types";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  ...LEAD_PROPOSAL_STATUSES.map((status) => ({
    label: LEAD_PROPOSAL_STATUS_META[status].label,
    value: status,
  })),
];

type ClientOption = { id: string; label: string };

type LeadProposalFiltersProps = {
  values: LeadProposalFilterValues;
  onChange: (next: Partial<LeadProposalFilterValues>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  /**
   * Built from the clients present in the current results — there is no
   * clients-with-proposals endpoint, and inventing one for a filter dropdown
   * would be a lot of surface for little gain. Search covers the rest.
   */
  clientOptions: ClientOption[];
};

export function LeadProposalFilters({
  values,
  onChange,
  onClear,
  hasActiveFilters,
  clientOptions,
}: LeadProposalFiltersProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Input
          label="Search"
          placeholder="Proposal title, client or company"
          value={values.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={(event) => onChange({ status: event.target.value })}
        />
        <Select
          label="Client"
          options={[
            { label: "All clients", value: "" },
            ...clientOptions.map((option) => ({
              label: option.label,
              value: option.id,
            })),
          ]}
          value={values.leadId}
          onChange={(event) => onChange({ leadId: event.target.value })}
        />
        <Select
          label="Sort by"
          options={PROPOSAL_SORT_OPTIONS.map((option) => ({
            label: option.label,
            value: option.value,
          }))}
          value={values.sort}
          onChange={(event) => onChange({ sort: event.target.value })}
        />
      </div>

      {hasActiveFilters ? (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}

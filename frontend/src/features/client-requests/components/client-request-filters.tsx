import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CLIENT_LEAD_STATUS_META } from "@/features/client-requests/client-lead-status";
import { CLIENT_LEAD_STATUSES, type ClientLeadStatus } from "@/types";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  ...CLIENT_LEAD_STATUSES.map((status) => ({
    label: CLIENT_LEAD_STATUS_META[status].label,
    value: status,
  })),
];

export type ClientRequestFilterValues = {
  search: string;
  status: ClientLeadStatus | "";
  dateFrom: string;
  dateTo: string;
};

type ClientRequestFiltersProps = {
  values: ClientRequestFilterValues;
  onChange: (next: Partial<ClientRequestFilterValues>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
};

export function ClientRequestFilters({
  values,
  onChange,
  onClear,
  hasActiveFilters,
}: ClientRequestFiltersProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {/* No in-field icon: Input renders its own label above the control, so
            any absolutely-positioned glyph would need a magic offset that
            breaks the moment a validation message appears. */}
        <Input
          label="Search"
          value={values.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Name, company or email…"
          type="search"
        />

        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={(event) =>
            onChange({ status: event.target.value as ClientLeadStatus | "" })
          }
        />

        <Input
          label="From"
          type="date"
          value={values.dateFrom}
          max={values.dateTo || undefined}
          onChange={(event) => onChange({ dateFrom: event.target.value })}
        />

        <Input
          label="To"
          type="date"
          value={values.dateTo}
          min={values.dateFrom || undefined}
          onChange={(event) => onChange({ dateTo: event.target.value })}
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

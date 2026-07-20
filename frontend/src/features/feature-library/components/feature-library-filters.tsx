import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type ActiveFilterValue = "" | "true" | "false";

type FeatureLibraryFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  activeFilter: ActiveFilterValue;
  onActiveFilterChange: (value: ActiveFilterValue) => void;
};

export function FeatureLibraryFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  activeFilter,
  onActiveFilterChange,
}: FeatureLibraryFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-foreground-soft" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by feature name…"
          className="pl-9"
        />
      </div>
      <div className="sm:w-56">
        <Input
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          placeholder="Filter by category…"
        />
      </div>
      <div className="sm:w-44">
        <Select
          value={activeFilter}
          onChange={(event) => onActiveFilterChange(event.target.value as ActiveFilterValue)}
          options={[
            { label: "All statuses", value: "" },
            { label: "Active only", value: "true" },
            { label: "Inactive only", value: "false" },
          ]}
        />
      </div>
    </div>
  );
}

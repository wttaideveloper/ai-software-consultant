import { Coins } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Placeholder for the Cost Settings module.
 *
 * The sidebar links here, so the route must resolve to something — this follows
 * the project's documented placeholder-shell pattern (PageHeader + EmptyState)
 * rather than leaving a blank screen or a dead link. No cost/rate model exists
 * in the schema yet, so nothing is fabricated here.
 */
export function CostSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Cost Settings"
        description="Configure the hourly rates and cost multipliers used when pricing an estimate."
      />

      <EmptyState
        icon={Coins}
        title="Cost settings not configured yet"
        description="Rate cards and cost multipliers will be managed here. This module hasn't been built yet."
      />
    </div>
  );
}

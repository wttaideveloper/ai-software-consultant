import { History } from "lucide-react";
import { Timeline } from "@/components/shared/timeline";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import { buildLeadTimeline } from "@/features/client-requests/lead-timeline";
import type { ClientLeadDetail } from "@/types";

export function LeadActivityTimeline({ lead }: { lead: ClientLeadDetail }) {
  return (
    <WorkspaceSection
      id="activity"
      icon={History}
      title="Activity Timeline"
      description="Derived from available timestamps"
    >
      <Timeline events={buildLeadTimeline(lead)} />
    </WorkspaceSection>
  );
}

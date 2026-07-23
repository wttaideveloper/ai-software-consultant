import { CircleDot, Inbox, PencilLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CLIENT_LEAD_STATUS_META } from "@/features/client-requests/client-lead-status";
import type { ClientLeadDetail } from "@/types";

export type TimelineTone = "accent" | "muted";

export type TimelineEvent = {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  timestamp: string;
  tone?: TimelineTone;
};

/**
 * Derives the timeline from the timestamps the lead already carries.
 *
 * Kept in its own module (not beside the component) so new sources — a real
 * activity/audit table, proposal events, note events — can be concatenated here
 * without touching the rendering. The component takes a plain event array and
 * knows nothing about where the events came from.
 */
export function buildLeadTimeline(lead: ClientLeadDetail): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: "created",
      icon: Inbox,
      title: "Lead created",
      description: "Submitted through the client portal",
      timestamp: lead.createdAt,
      tone: "muted",
    },
  ];

  // updatedAt equals createdAt until someone edits, so only show it once it
  // actually represents a distinct event.
  if (lead.updatedAt && lead.updatedAt !== lead.createdAt) {
    events.push({
      id: "updated",
      icon: PencilLine,
      title: "Last updated",
      description: "Request details were edited",
      timestamp: lead.updatedAt,
      tone: "muted",
    });
  }

  events.push({
    id: "status",
    icon: CircleDot,
    title: `Status: ${CLIENT_LEAD_STATUS_META[lead.status]?.label ?? lead.status}`,
    description: "Current stage",
    timestamp: lead.updatedAt ?? lead.createdAt,
    tone: "accent",
  });

  return events;
}

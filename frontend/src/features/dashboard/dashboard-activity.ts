import { Inbox } from "lucide-react";
import type { TimelineEvent } from "@/components/shared/timeline";
import type { ClientLead } from "@/types";

/**
 * Builds the dashboard's Recent Activity feed.
 *
 * Lead-created events only, and deliberately so: nothing in this system records
 * actions. The `audit_logs` table exists but has no writers, proposal exports
 * happen entirely client-side (see proposal-draft.store.ts), and a status change
 * only moves `updatedAt` — which is indistinguishable from a summary or feature
 * edit. Rendering "Status Updated" or "Proposal Downloaded" from that would be
 * inventing history, so the feed shows the one event that is actually recorded.
 *
 * To extend later: write to `audit_logs` on status change / proposal export and
 * concatenate those events here. Nothing in the rendering needs to change.
 */
export function buildDashboardActivity(leads: ClientLead[]): TimelineEvent[] {
  return leads.map((lead) => ({
    id: `lead-created-${lead.id}`,
    icon: Inbox,
    title: "Lead created",
    description: lead.company ? `${lead.name} · ${lead.company}` : lead.name,
    timestamp: lead.createdAt,
    tone: "muted" as const,
  }));
}

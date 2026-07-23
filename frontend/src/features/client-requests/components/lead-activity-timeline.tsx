import { motion } from "framer-motion";
import { History } from "lucide-react";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import { buildLeadTimeline } from "@/features/client-requests/lead-timeline";
import type { ClientLeadDetail } from "@/types";
import { cn } from "@/utils/cn";
import { formatDate, formatRelativeTime, formatTime } from "@/utils/format";

export function LeadActivityTimeline({ lead }: { lead: ClientLeadDetail }) {
  const events = buildLeadTimeline(lead);

  return (
    <WorkspaceSection
      id="activity"
      icon={History}
      title="Activity Timeline"
      description="Derived from available timestamps"
    >
      <ol className="relative flex flex-col gap-6">
        {events.map((event, index) => {
          const Icon = event.icon;
          const isLast = index === events.length - 1;
          const isAccent = event.tone === "accent";

          return (
            <li key={event.id} className="relative flex gap-4">
              {/* Connector stops at the last node so the line doesn't dangle. */}
              {!isLast ? (
                <span
                  aria-hidden
                  className="absolute top-9 left-4.25 h-[calc(100%+0.5rem)] w-px bg-border"
                />
              ) : null}

              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.06, duration: 0.25 }}
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                  isAccent
                    ? "asc-gradient-accent border-transparent text-white"
                    : "border-border bg-surface text-muted",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.85} />
              </motion.span>

              <div className="min-w-0 pt-1">
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                {event.description ? (
                  <p className="mt-0.5 text-sm text-muted">{event.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted">
                  {formatDate(event.timestamp)} at {formatTime(event.timestamp)}
                  <span className="mx-1.5">·</span>
                  {formatRelativeTime(event.timestamp)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </WorkspaceSection>
  );
}

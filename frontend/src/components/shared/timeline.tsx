import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDate, formatRelativeTime, formatTime } from "@/utils/format";

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
 * Presentational vertical timeline. Knows nothing about where its events come
 * from — the Lead Details workspace derives them from one lead's timestamps,
 * the Sales Dashboard from a page of leads.
 *
 * Extracted from LeadActivityTimeline when the dashboard needed the same
 * rendering; that component still owns its section chrome and event building.
 */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
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
                <p className="mt-0.5 truncate text-sm text-muted">{event.description}</p>
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
  );
}

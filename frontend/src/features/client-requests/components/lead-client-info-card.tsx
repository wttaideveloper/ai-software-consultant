import { motion } from "framer-motion";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  Globe,
  Mail,
  MessageCircle,
  Monitor,
  Phone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClientLeadStatusBadge } from "@/features/client-requests/components/client-lead-status-badge";
import type { ClientLeadDetail } from "@/types";
import { formatDate } from "@/utils/format";
import { fadeIn } from "@/utils/motion";

type InfoRowProps = {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
};

function InfoRow({ icon: Icon, label, children }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
        <Icon className="h-4 w-4" strokeWidth={1.85} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {label}
        </p>
        <div className="mt-0.5 text-sm break-words text-foreground">{children}</div>
      </div>
    </div>
  );
}

const EMPTY = <span className="text-muted">—</span>;

export function LeadClientInfoCard({ lead }: { lead: ClientLeadDetail }) {
  const platforms = [
    ...lead.platforms,
    ...(lead.otherPlatform ? [lead.otherPlatform] : []),
  ];

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="asc-gradient-surface overflow-hidden rounded-2xl border border-border shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={lead.name} size="xl" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {lead.name}
            </h2>
            <p className="mt-0.5 truncate text-sm text-muted">
              {lead.company ?? "No company provided"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ClientLeadStatusBadge status={lead.status} />
        </div>
      </div>

      <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
        <InfoRow icon={Mail} label="Email">
          <a
            href={`mailto:${lead.email}`}
            className="rounded-sm text-accent-text underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {lead.email}
          </a>
        </InfoRow>

        <InfoRow icon={Phone} label="Phone">
          {lead.phone ? (
            <a
              href={`tel:${lead.phone}`}
              className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {lead.phone}
            </a>
          ) : (
            EMPTY
          )}
        </InfoRow>

        <InfoRow icon={MessageCircle} label="WhatsApp">
          {lead.whatsapp ?? EMPTY}
        </InfoRow>

        <InfoRow icon={Building2} label="Company">
          {lead.company ?? EMPTY}
        </InfoRow>

        <InfoRow icon={Globe} label="Country">
          {lead.country ?? EMPTY}
        </InfoRow>

        <InfoRow icon={CalendarClock} label="Consultation Time">
          {lead.consultationTime}
        </InfoRow>

        <InfoRow icon={Monitor} label="Platforms">
          {platforms.length === 0 ? (
            EMPTY
          ) : (
            <div className="flex flex-wrap gap-1">
              {platforms.map((platform) => (
                <Badge key={platform} variant="default" size="sm">
                  {platform}
                </Badge>
              ))}
            </div>
          )}
        </InfoRow>

        <InfoRow icon={Mail} label="Preferred Contact">
          <Badge variant="outline" size="sm">
            {lead.preferredContactMethod}
          </Badge>
        </InfoRow>

        <InfoRow icon={CalendarDays} label="Created">
          {formatDate(lead.createdAt)}
        </InfoRow>
      </div>

      {lead.notes ? (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            Client Notes
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground-soft text-pretty">
            {lead.notes}
          </p>
        </div>
      ) : null}
    </motion.div>
  );
}

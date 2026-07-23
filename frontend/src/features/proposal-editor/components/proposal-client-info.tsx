import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import type { ClientLeadDetail } from "@/types";
import { formatDate } from "@/utils/format";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm break-words text-foreground">
        {value ?? <span className="text-muted">—</span>}
      </p>
    </div>
  );
}

/**
 * Read-only by design: this is the client record the proposal is addressed to.
 * Contact details are owned by the lead and edited in the Lead Details
 * Workspace, so there is intentionally no write path here.
 */
export function ProposalClientInfo({ lead }: { lead: ClientLeadDetail }) {
  const platforms = [
    ...lead.platforms,
    ...(lead.otherPlatform ? [lead.otherPlatform] : []),
  ];

  return (
    <WorkspaceSection
      id="client-information"
      icon={Building2}
      title="Client Information"
      description="From the client request — read-only"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Contact Name" value={lead.name} />
        <Field label="Company" value={lead.company} />
        <Field label="Email" value={lead.email} />
        <Field label="Phone" value={lead.phone} />
        <Field label="Country" value={lead.country} />
        <Field label="Consultation Time" value={lead.consultationTime} />
        <Field label="Request Created" value={formatDate(lead.createdAt)} />
        <Field label="Preferred Contact" value={lead.preferredContactMethod} />

        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            Platforms
          </p>
          {platforms.length === 0 ? (
            <p className="mt-1 text-sm text-muted">—</p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {platforms.map((platform) => (
                <Badge key={platform} variant="default" size="sm">
                  {platform}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </WorkspaceSection>
  );
}

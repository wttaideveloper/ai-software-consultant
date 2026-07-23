import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  exportProposal,
  type ExportFormat,
} from "@/features/proposal-editor/export/export-proposal";
import { buildProposalDocument } from "@/features/proposal-editor/export/proposal-document.model";
import type { LeadProposalDraft } from "@/features/proposal-editor/lead-proposal.types";
import { useAuthStore } from "@/store/auth-store";
import type { ClientLeadDetail } from "@/types";

type ExportArgs = {
  draft: LeadProposalDraft;
  lead: ClientLeadDetail;
};

export function useExportProposal() {
  // Which format is in flight, or null. Lets the UI disable both buttons while
  // showing the spinner on only the one that was clicked.
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);

  const runExport = useCallback(
    async (format: ExportFormat, { draft, lead }: ExportArgs) => {
      if (exportingFormat) return;

      setExportingFormat(format);
      const label = format.toUpperCase();
      const toastId = toast.loading(`Preparing your ${label}…`);

      try {
        // "Prepared By" is the signing organization, falling back to the
        // logged-in user when the org name is unavailable.
        const preparedBy =
          organization?.name ?? user?.fullName ?? "AI Software Consultant";

        const document = buildProposalDocument(draft, lead, preparedBy);
        await exportProposal(document, format);

        toast.success(`${label} downloaded.`, { id: toastId });
      } catch (error) {
        toast.error(
          `Couldn't generate the ${label}. ${
            error instanceof Error ? error.message : "Please try again."
          }`,
          { id: toastId },
        );
      } finally {
        setExportingFormat(null);
      }
    },
    [exportingFormat, organization?.name, user?.fullName],
  );

  return {
    runExport,
    exportingFormat,
    isExporting: exportingFormat !== null,
  };
}

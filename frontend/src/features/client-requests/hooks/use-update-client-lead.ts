import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CLIENT_LEADS_QUERY_KEY } from "@/features/client-requests/hooks/use-client-leads";
import { clientLeadsService } from "@/services/client-leads.service";
import type { ClientLeadDetail, UpdateClientLeadPayload } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

type UpdateArgs = {
  leadId: string;
  payload: UpdateClientLeadPayload;
  /** Shown on success — each section describes its own save. */
  successMessage: string;
};

export function useUpdateClientLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, payload }: UpdateArgs) =>
      clientLeadsService.update(leadId, payload),

    onSuccess: (lead: ClientLeadDetail, variables) => {
      // The PATCH returns the updated lead, so seed the detail cache directly
      // instead of triggering a second round-trip.
      queryClient.setQueryData(
        [CLIENT_LEADS_QUERY_KEY, "detail", lead.id],
        lead,
      );
      // The inbox shows status/updatedAt, so its pages are now stale.
      void queryClient.invalidateQueries({
        queryKey: [CLIENT_LEADS_QUERY_KEY, "list"],
      });
      toast.success(variables.successMessage);
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't save your changes."));
    },
  });
}

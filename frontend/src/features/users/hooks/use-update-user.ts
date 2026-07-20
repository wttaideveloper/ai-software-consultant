import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { USERS_QUERY_KEY } from "@/features/users/hooks/use-users";
import { usersService } from "@/services/users.service";
import type { UpdateOrgUserPayload } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

type UpdateVariables = {
  id: string;
  payload: UpdateOrgUserPayload;
};

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateVariables) => usersService.update(id, payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success(`"${user.fullName}" updated.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't update this user."));
    },
  });
}

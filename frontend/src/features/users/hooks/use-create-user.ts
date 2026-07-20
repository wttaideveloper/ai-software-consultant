import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { USERS_QUERY_KEY } from "@/features/users/hooks/use-users";
import { usersService } from "@/services/users.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersService.create,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success(`"${user.fullName}" invited.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't invite this user."));
    },
  });
}

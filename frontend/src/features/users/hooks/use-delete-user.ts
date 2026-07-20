import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { USERS_QUERY_KEY } from "@/features/users/hooks/use-users";
import { usersService } from "@/services/users.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User deleted.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Couldn't delete this user."));
    },
  });
}

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import type { ListOrgUsersParams } from "@/types";

export const USERS_QUERY_KEY = "org-users";

export function useUsers(params: ListOrgUsersParams) {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, "list", params],
    queryFn: () => usersService.list(params),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

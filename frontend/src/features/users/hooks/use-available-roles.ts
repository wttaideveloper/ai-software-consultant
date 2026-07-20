import { useQuery } from "@tanstack/react-query";
import { USERS_QUERY_KEY } from "@/features/users/hooks/use-users";
import { usersService } from "@/services/users.service";
import type { UserRole } from "@/types";

const MAX_USERS_FOR_ROLE_DISCOVERY = 100;

/**
 * No dedicated "list roles" endpoint exists in the backend. Available roles
 * are derived from every currently-visible organization user's `roles`
 * array (deduplicated) — the closest honest approximation to a real
 * roles-listing API without one existing.
 */
export function useAvailableRoles() {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, "roles-discovery"],
    queryFn: async () => {
      const response = await usersService.list({
        page: 1,
        pageSize: MAX_USERS_FOR_ROLE_DISCOVERY,
      });

      const roleMap = new Map<string, UserRole>();
      for (const user of response.items) {
        for (const role of user.roles) {
          roleMap.set(role.id, role);
        }
      }

      return Array.from(roleMap.values());
    },
    staleTime: 60_000,
  });
}

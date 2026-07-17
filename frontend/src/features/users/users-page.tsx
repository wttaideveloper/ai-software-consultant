import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function UsersPage() {
  return (
    <div>
      <PageHeader
        title="Users"
        description="Organization members, roles, and access. Directory data will load after authentication is wired."
        actions={<Button>Invite user</Button>}
      />
      <EmptyState
        icon={Users}
        title="No users to display"
        description="User management UI is ready. Connect the users API to list teammates, assign roles, and manage access."
      />
    </div>
  );
}

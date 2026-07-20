import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type UserEmptyStateProps = {
  hasSearch: boolean;
  onInvite: () => void;
};

export function UserEmptyState({ hasSearch, onInvite }: UserEmptyStateProps) {
  return (
    <EmptyState
      icon={Users}
      title="No Users Found"
      description={
        hasSearch
          ? "No teammates match your search. Try a different name or email."
          : "Invite your first teammate to start collaborating on consultations."
      }
      action={<Button onClick={onInvite}>Invite User</Button>}
    />
  );
}

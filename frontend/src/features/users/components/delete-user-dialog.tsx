import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteUser } from "@/features/users/hooks/use-delete-user";
import type { OrgUser } from "@/types";

type DeleteUserDialogProps = {
  open: boolean;
  onClose: () => void;
  user: OrgUser | null;
};

export function DeleteUserDialog({ open, onClose, user }: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser();

  const handleConfirm = () => {
    if (!user) return;
    deleteUser.mutate(user.id, { onSuccess: () => onClose() });
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete user"
      description={
        user
          ? `This will permanently remove "${user.fullName}" from your organization.`
          : "This will permanently remove this user from your organization."
      }
      confirmLabel="Delete"
      tone="danger"
      isLoading={deleteUser.isPending}
    />
  );
}

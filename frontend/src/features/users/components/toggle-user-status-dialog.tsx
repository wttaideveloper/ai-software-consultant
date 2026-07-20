import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUpdateUser } from "@/features/users/hooks/use-update-user";
import type { OrgUser } from "@/types";

type ToggleUserStatusDialogProps = {
  open: boolean;
  onClose: () => void;
  user: OrgUser | null;
};

export function ToggleUserStatusDialog({ open, onClose, user }: ToggleUserStatusDialogProps) {
  const updateUser = useUpdateUser();
  const willActivate = user?.status !== "active";

  const handleConfirm = () => {
    if (!user) return;
    updateUser.mutate(
      { id: user.id, payload: { status: willActivate ? "active" : "inactive" } },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={willActivate ? "Activate user" : "Deactivate user"}
      description={
        user
          ? willActivate
            ? `"${user.fullName}" will regain access to the platform.`
            : `"${user.fullName}" will lose access to the platform until reactivated.`
          : "This will change the user's access to the platform."
      }
      confirmLabel={willActivate ? "Activate" : "Deactivate"}
      tone={willActivate ? "primary" : "danger"}
      isLoading={updateUser.isPending}
    />
  );
}

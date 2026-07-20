import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteFeatureLibraryItem } from "@/features/feature-library/hooks/use-delete-feature-library-item";
import type { FeatureLibraryItem } from "@/types";

type DeleteFeatureLibraryDialogProps = {
  open: boolean;
  onClose: () => void;
  item: FeatureLibraryItem | null;
};

export function DeleteFeatureLibraryDialog({
  open,
  onClose,
  item,
}: DeleteFeatureLibraryDialogProps) {
  const deleteItem = useDeleteFeatureLibraryItem();

  const handleConfirm = () => {
    if (!item) return;
    deleteItem.mutate(item.id, { onSuccess: () => onClose() });
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete feature"
      description={
        item
          ? `This will remove "${item.name}" from your feature library.`
          : "This will remove this feature from your feature library."
      }
      confirmLabel="Delete"
      tone="danger"
      isLoading={deleteItem.isPending}
    />
  );
}

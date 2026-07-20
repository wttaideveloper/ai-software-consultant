import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteFeature } from "@/features/detected-features/hooks/use-delete-feature";
import type { DetectedFeature } from "@/types";

type DeleteFeatureDialogProps = {
  open: boolean;
  onClose: () => void;
  feature: DetectedFeature | null;
  consultationId: string;
};

export function DeleteFeatureDialog({
  open,
  onClose,
  feature,
  consultationId,
}: DeleteFeatureDialogProps) {
  const deleteFeature = useDeleteFeature(consultationId);

  const handleConfirm = () => {
    if (!feature) return;
    deleteFeature.mutate(feature.id, { onSuccess: () => onClose() });
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete feature"
      description={
        feature
          ? `This will remove "${feature.featureName}" from the detected feature list.`
          : "This will remove this feature from the detected feature list."
      }
      confirmLabel="Delete"
      tone="danger"
      isLoading={deleteFeature.isPending}
    />
  );
}

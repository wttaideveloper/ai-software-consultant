import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteConsultation } from "@/features/consultations/hooks/use-delete-consultation";
import type { Consultation } from "@/types";

type DeleteConsultationDialogProps = {
  open: boolean;
  onClose: () => void;
  consultation: Consultation | null;
  onDeleted?: () => void;
};

export function DeleteConsultationDialog({
  open,
  onClose,
  consultation,
  onDeleted,
}: DeleteConsultationDialogProps) {
  const deleteConsultation = useDeleteConsultation();

  const handleConfirm = () => {
    if (!consultation) return;
    deleteConsultation.mutate(consultation.id, {
      onSuccess: () => {
        onDeleted?.();
        onClose();
      },
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete consultation"
      description={
        consultation
          ? `This will permanently remove "${consultation.title}" and its conversation history.`
          : "This will permanently remove this consultation."
      }
      confirmLabel="Delete"
      tone="danger"
      isLoading={deleteConsultation.isPending}
    />
  );
}

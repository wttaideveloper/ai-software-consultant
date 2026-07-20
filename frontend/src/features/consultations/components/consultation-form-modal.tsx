import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { CONSULTATION_STATUS_OPTIONS } from "@/features/consultations/consultation-status";
import {
  CONSULTATION_FORM_DEFAULTS,
  consultationFormSchema,
  type ConsultationFormValues,
} from "@/features/consultations/consultations.schema";
import { useCreateConsultation } from "@/features/consultations/hooks/use-create-consultation";
import { useUpdateConsultation } from "@/features/consultations/hooks/use-update-consultation";
import type { Consultation } from "@/types";

type ConsultationFormModalProps = {
  open: boolean;
  onClose: () => void;
  consultation?: Consultation | null;
  onCreated?: (consultation: Consultation) => void;
};

function toFieldValue(value: string | null | undefined) {
  return value ?? "";
}

export function ConsultationFormModal({
  open,
  onClose,
  consultation,
  onCreated,
}: ConsultationFormModalProps) {
  const isEditMode = Boolean(consultation);
  const createConsultation = useCreateConsultation();
  const updateConsultation = useUpdateConsultation();
  const isSubmitting = createConsultation.isPending || updateConsultation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: CONSULTATION_FORM_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;

    if (consultation) {
      reset({
        title: consultation.title,
        industry: toFieldValue(consultation.industry),
        projectType: toFieldValue(consultation.projectType),
        budgetRange: toFieldValue(consultation.budgetRange),
        timeline: toFieldValue(consultation.timeline),
        status: consultation.status,
      });
    } else {
      reset(CONSULTATION_FORM_DEFAULTS);
    }
  }, [open, consultation, reset]);

  const onSubmit = (values: ConsultationFormValues) => {
    const shared = {
      title: values.title,
      industry: values.industry?.trim() || undefined,
      projectType: values.projectType?.trim() || undefined,
      budgetRange: values.budgetRange?.trim() || undefined,
      timeline: values.timeline?.trim() || undefined,
    };

    if (isEditMode && consultation) {
      updateConsultation.mutate(
        { id: consultation.id, payload: { ...shared, status: values.status } },
        { onSuccess: () => onClose() },
      );
      return;
    }

    createConsultation.mutate(shared, {
      onSuccess: (created) => {
        onCreated?.(created);
        onClose();
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditMode ? "Edit consultation" : "New consultation"}
      description={
        isEditMode
          ? "Update the project details below."
          : "Start a new AI-guided discovery pipeline."
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="Project title"
          placeholder="Acme Retail Platform Revamp"
          error={errors.title?.message}
          {...register("title")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Industry"
            placeholder="Retail, Healthcare…"
            error={errors.industry?.message}
            {...register("industry")}
          />
          <Input
            label="Project type"
            placeholder="Web app, Mobile app…"
            error={errors.projectType?.message}
            {...register("projectType")}
          />
          <Input
            label="Budget range"
            placeholder="$25k – $50k"
            error={errors.budgetRange?.message}
            {...register("budgetRange")}
          />
          <Input
            label="Timeline"
            placeholder="8-10 weeks"
            error={errors.timeline?.message}
            {...register("timeline")}
          />
        </div>

        {isEditMode ? (
          <Select
            label="Status"
            options={CONSULTATION_STATUS_OPTIONS}
            error={errors.status?.message}
            {...register("status")}
          />
        ) : null}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditMode ? "Save changes" : "Create consultation"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

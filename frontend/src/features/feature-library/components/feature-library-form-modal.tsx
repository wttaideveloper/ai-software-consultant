import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COMPLEXITY_OPTIONS } from "@/features/detected-features/feature-badges";
import {
  FEATURE_LIBRARY_FORM_DEFAULTS,
  featureLibraryFormSchema,
  featureLibraryItemToFormValues,
  formValuesToPayload,
  type FeatureLibraryFormValues,
} from "@/features/feature-library/feature-library.schema";
import { useCreateFeatureLibraryItem } from "@/features/feature-library/hooks/use-create-feature-library-item";
import { useUpdateFeatureLibraryItem } from "@/features/feature-library/hooks/use-update-feature-library-item";
import type { FeatureLibraryItem } from "@/types";

type FeatureLibraryFormModalProps = {
  open: boolean;
  onClose: () => void;
  item: FeatureLibraryItem | null;
};

export function FeatureLibraryFormModal({ open, onClose, item }: FeatureLibraryFormModalProps) {
  const isEditMode = Boolean(item);
  const createItem = useCreateFeatureLibraryItem();
  const updateItem = useUpdateFeatureLibraryItem();
  const isSubmitting = createItem.isPending || updateItem.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeatureLibraryFormValues>({
    resolver: zodResolver(featureLibraryFormSchema),
    defaultValues: FEATURE_LIBRARY_FORM_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    reset(item ? featureLibraryItemToFormValues(item) : FEATURE_LIBRARY_FORM_DEFAULTS);
  }, [open, item, reset]);

  const onSubmit = (values: FeatureLibraryFormValues) => {
    const payload = formValuesToPayload(values);

    if (isEditMode && item) {
      updateItem.mutate({ id: item.id, payload }, { onSuccess: () => onClose() });
      return;
    }

    createItem.mutate(payload, { onSuccess: () => onClose() });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditMode ? "Edit feature" : "Create feature"}
      description={
        isEditMode
          ? "Update this reusable feature template."
          : "Add a reusable feature template to your library."
      }
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Feature name" error={errors.name?.message} {...register("name")} />
          <Input label="Category" error={errors.category?.message} {...register("category")} />
        </div>

        <Textarea
          label="Description"
          rows={3}
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Default complexity"
            options={COMPLEXITY_OPTIONS}
            {...register("defaultComplexity")}
          />
          <Input
            type="number"
            label="Default estimated hours"
            error={errors.defaultEstimatedHours?.message}
            {...register("defaultEstimatedHours", { valueAsNumber: true })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Textarea label="Tags" hint="One tag per line" rows={3} {...register("tags")} />
          <Textarea
            label="Technologies"
            hint="One technology per line"
            rows={3}
            {...register("technologies")}
          />
        </div>

        <Textarea label="Notes" rows={2} {...register("notes")} />

        <Checkbox label="Active" {...register("isActive")} />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditMode ? "Save changes" : "Create feature"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

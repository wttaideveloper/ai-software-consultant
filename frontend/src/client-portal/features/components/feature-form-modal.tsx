import { useEffect, useState } from "react";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { COMPLEXITY_OPTIONS, PRIORITY_OPTIONS } from "@/features/detected-features/feature-badges";
import type { FeatureComplexity, FeaturePriority } from "@/types";

export type FeatureFormValues = {
  name: string;
  category: string;
  description: string;
  priority: FeaturePriority;
  complexity: FeatureComplexity;
};

const EMPTY_VALUES: FeatureFormValues = {
  name: "",
  category: "",
  description: "",
  priority: "MEDIUM",
  complexity: "MEDIUM",
};

type FeatureFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: FeatureFormValues) => void;
  initialValues?: FeatureFormValues;
};

/** Shared by both "Add custom feature" (no initialValues) and "Edit feature" (prefilled). */
export function FeatureFormModal({ open, onClose, onSubmit, initialValues }: FeatureFormModalProps) {
  const [values, setValues] = useState<FeatureFormValues>(initialValues ?? EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? EMPTY_VALUES);
      setError(null);
    }
  }, [open, initialValues]);

  const handleSubmit = () => {
    if (!values.name.trim() || !values.description.trim()) {
      setError("Name and description are required.");
      return;
    }

    onSubmit({
      ...values,
      name: values.name.trim(),
      category: values.category.trim() || "General",
      description: values.description.trim(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initialValues ? "Edit feature" : "Add custom feature"}>
      <div className="flex flex-col gap-3">
        <Input
          label="Feature name"
          value={values.name}
          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
        />
        <Input
          label="Category"
          value={values.category}
          onChange={(event) => setValues((prev) => ({ ...prev, category: event.target.value }))}
          placeholder="e.g. Core Feature"
        />
        <Textarea
          label="Description"
          rows={3}
          value={values.description}
          onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={values.priority}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, priority: event.target.value as FeaturePriority }))
            }
          />
          <Select
            label="Complexity"
            options={COMPLEXITY_OPTIONS}
            value={values.complexity}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, complexity: event.target.value as FeatureComplexity }))
            }
          />
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FEATURE_COMPLEXITIES,
  FEATURE_PRIORITIES,
  type ClientLeadFeature,
  type ClientLeadFeatureComplexity,
  type ClientLeadFeaturePriority,
} from "@/types";

const EMPTY_FEATURE: ClientLeadFeature = {
  name: "",
  category: "",
  description: "",
  priority: "MEDIUM",
  complexity: "MEDIUM",
  included: true,
};

const PRIORITY_OPTIONS = FEATURE_PRIORITIES.map((value) => ({
  label: value.charAt(0) + value.slice(1).toLowerCase(),
  value,
}));

const COMPLEXITY_OPTIONS = FEATURE_COMPLEXITIES.map((value) => ({
  label: value.charAt(0) + value.slice(1).toLowerCase(),
  value,
}));

type LeadFeatureModalProps = {
  open: boolean;
  onClose: () => void;
  /** null = add mode. */
  feature: ClientLeadFeature | null;
  onSubmit: (feature: ClientLeadFeature) => void;
};

/**
 * Add/edit form for a single feature. Fields mirror the ClientLeadFeature shape
 * exactly, which is the same shape the backend's featureInputSchema validates —
 * so anything this form produces is guaranteed to be accepted.
 */
export function LeadFeatureModal({
  open,
  onClose,
  feature,
  onSubmit,
}: LeadFeatureModalProps) {
  const [draft, setDraft] = useState<ClientLeadFeature>(feature ?? EMPTY_FEATURE);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(feature ?? EMPTY_FEATURE);
      setShowErrors(false);
    }
  }, [open, feature]);

  const patch = (next: Partial<ClientLeadFeature>) =>
    setDraft((current) => ({ ...current, ...next }));

  const nameError = draft.name.trim().length === 0 ? "Name is required" : undefined;
  const categoryError =
    draft.category.trim().length === 0 ? "Category is required" : undefined;
  const descriptionError =
    draft.description.trim().length === 0 ? "Description is required" : undefined;

  const isValid = !nameError && !categoryError && !descriptionError;

  const handleSubmit = () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }

    onSubmit({
      ...draft,
      name: draft.name.trim(),
      category: draft.category.trim(),
      description: draft.description.trim(),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={feature ? "Edit feature" : "Add feature"}
      description={
        feature
          ? "Update this feature on the client's request."
          : "Add a feature the client didn't capture during discovery."
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Feature name"
          value={draft.name}
          onChange={(event) => patch({ name: event.target.value })}
          placeholder="e.g. Two-factor authentication"
          error={showErrors ? nameError : undefined}
        />

        <Input
          label="Category"
          value={draft.category}
          onChange={(event) => patch({ category: event.target.value })}
          placeholder="e.g. Authentication"
          error={showErrors ? categoryError : undefined}
        />

        <Textarea
          label="Description"
          value={draft.description}
          onChange={(event) => patch({ description: event.target.value })}
          rows={4}
          placeholder="What this feature does and why it's needed."
          error={showErrors ? descriptionError : undefined}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={draft.priority}
            onChange={(event) =>
              patch({ priority: event.target.value as ClientLeadFeaturePriority })
            }
          />
          <Select
            label="Complexity"
            options={COMPLEXITY_OPTIONS}
            value={draft.complexity}
            onChange={(event) =>
              patch({
                complexity: event.target.value as ClientLeadFeatureComplexity,
              })
            }
          />
        </div>

        <Checkbox
          label="Included in scope"
          checked={draft.included}
          onChange={(event) => patch({ included: event.target.checked })}
        />
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {feature ? "Save feature" : "Add feature"}
        </Button>
      </div>
    </Modal>
  );
}

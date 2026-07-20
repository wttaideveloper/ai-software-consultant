import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  COMPLEXITY_META,
  COMPLEXITY_OPTIONS,
  PRIORITY_META,
  PRIORITY_OPTIONS,
} from "@/features/detected-features/feature-badges";
import {
  featureEditSchema,
  type FeatureEditValues,
} from "@/features/detected-features/detected-features.schema";
import { useUpdateFeature } from "@/features/detected-features/hooks/use-update-feature";
import type { DetectedFeature } from "@/types";
import { fadeIn } from "@/utils/motion";

type FeatureItemProps = {
  feature: DetectedFeature;
  consultationId: string;
  onDelete: () => void;
};

function toEditValues(feature: DetectedFeature): FeatureEditValues {
  return {
    featureName: feature.featureName,
    featureCategory: feature.featureCategory,
    description: feature.description,
    priority: feature.priority,
    complexity: feature.complexity,
    manuallyVerified: feature.manuallyVerified,
  };
}

export function FeatureItem({ feature, consultationId, onDelete }: FeatureItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const updateFeature = useUpdateFeature(consultationId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeatureEditValues>({
    resolver: zodResolver(featureEditSchema),
    defaultValues: toEditValues(feature),
  });

  useEffect(() => {
    if (isEditing) {
      reset(toEditValues(feature));
    }
  }, [isEditing, feature, reset]);

  const handleVerify = () => {
    updateFeature.mutate({ featureId: feature.id, payload: { manuallyVerified: true } });
  };

  const onSave = handleSubmit((values) => {
    updateFeature.mutate(
      { featureId: feature.id, payload: values },
      { onSuccess: () => setIsEditing(false) },
    );
  });

  if (isEditing) {
    return (
      <motion.form
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        onSubmit={onSave}
        noValidate
        className="flex flex-col gap-3 rounded-lg border border-accent/30 bg-surface p-4"
      >
        <Input label="Feature name" error={errors.featureName?.message} {...register("featureName")} />
        <Input label="Category" error={errors.featureCategory?.message} {...register("featureCategory")} />
        <Textarea
          label="Description"
          rows={3}
          error={errors.description?.message}
          {...register("description")}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Priority" options={PRIORITY_OPTIONS} {...register("priority")} />
          <Select label="Complexity" options={COMPLEXITY_OPTIONS} {...register("complexity")} />
        </div>
        <Checkbox label="Manually verified" {...register("manuallyVerified")} />
        <div className="mt-1 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(false)}
            disabled={updateFeature.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={updateFeature.isPending}>
            Save
          </Button>
        </div>
      </motion.form>
    );
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="rounded-lg border border-border/60 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{feature.featureName}</p>
            {feature.manuallyVerified ? (
              <Badge variant="success">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-foreground-soft">{feature.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!feature.manuallyVerified ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVerify}
              disabled={updateFeature.isPending}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Verify
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit feature">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete feature">
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={PRIORITY_META[feature.priority].variant}>
          {PRIORITY_META[feature.priority].label}
        </Badge>
        <Badge variant={COMPLEXITY_META[feature.complexity].variant}>
          {COMPLEXITY_META[feature.complexity].label}
        </Badge>
        <span className="text-xs text-muted">
          Confidence {Math.round(feature.confidenceScore * 100)}%
        </span>
      </div>

      <button
        type="button"
        onClick={() => setReasoningOpen((value) => !value)}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
      >
        <motion.span animate={{ rotate: reasoningOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
        AI Reasoning
      </button>
      <AnimatePresence initial={false}>
        {reasoningOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="mt-2 text-xs leading-relaxed text-muted">{feature.aiReasoning}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

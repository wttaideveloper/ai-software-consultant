import { AnimatePresence, motion } from "framer-motion";
import { ListChecks, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LeadFeatureModal } from "@/features/client-requests/components/lead-feature-modal";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import type { ClientLeadFeature, ClientLeadFeaturePriority } from "@/types";
import { cn } from "@/utils/cn";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "info";

const PRIORITY_VARIANT: Record<ClientLeadFeaturePriority, BadgeVariant> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "default",
};

type EditorState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; index: number };

type LeadFeaturesSectionProps = {
  features: ClientLeadFeature[];
  onSave: (features: ClientLeadFeature[]) => void;
  isSaving: boolean;
};

/**
 * Feature list editor.
 *
 * Changes are staged in local state and persisted with one explicit "Save
 * changes" action, because the API replaces the whole `features` array — saving
 * per-row would fire a full-array PATCH on every keystroke-level edit and make
 * a mid-sequence failure much harder to reason about.
 */
export function LeadFeaturesSection({
  features,
  onSave,
  isSaving,
}: LeadFeaturesSectionProps) {
  const [draft, setDraft] = useState<ClientLeadFeature[]>(features);
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  // Re-seed from the server whenever the persisted list changes.
  useEffect(() => {
    setDraft(features);
  }, [features]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(features),
    [draft, features],
  );

  const includedCount = draft.filter((feature) => feature.included).length;

  const handleSubmitFeature = (feature: ClientLeadFeature) => {
    setDraft((current) =>
      editor.mode === "edit"
        ? current.map((item, index) => (index === editor.index ? feature : item))
        : [...current, feature],
    );
    setEditor({ mode: "closed" });
  };

  const handleRemove = () => {
    if (removeIndex === null) return;
    setDraft((current) => current.filter((_, index) => index !== removeIndex));
    setRemoveIndex(null);
  };

  const editingFeature =
    editor.mode === "edit" ? (draft[editor.index] ?? null) : null;

  return (
    <>
      <WorkspaceSection
        id="detected-features"
        icon={ListChecks}
        title="Detected Features"
        description={`${draft.length} feature${draft.length === 1 ? "" : "s"} · ${includedCount} in scope`}
        actions={
          <>
            {isDirty ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDraft(features)}
                disabled={isSaving}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Discard
              </Button>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditor({ mode: "add" })}
            >
              <Plus className="h-3.5 w-3.5" />
              Add feature
            </Button>
            <Button
              size="sm"
              onClick={() => onSave(draft)}
              isLoading={isSaving}
              disabled={!isDirty}
            >
              Save changes
            </Button>
          </>
        }
      >
        {draft.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            No features on this request yet. Use “Add feature” to create one.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {draft.map((feature, index) => (
                <motion.li
                  // Index-based key: names are user-editable and not unique, so
                  // position is the only stable identity in this array.
                  key={`${index}-${feature.name}`}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "group rounded-xl border border-border bg-canvas p-4",
                    "transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-xs",
                    !feature.included && "opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{feature.name}</p>
                        {!feature.included ? (
                          <Badge variant="outline" size="sm">
                            Excluded
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">
                        {feature.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <Badge variant="accent" size="sm">
                          {feature.category}
                        </Badge>
                        <Badge
                          variant={PRIORITY_VARIANT[feature.priority] ?? "default"}
                          size="sm"
                          dot
                        >
                          {feature.priority} priority
                        </Badge>
                        <Badge variant="default" size="sm">
                          {feature.complexity} complexity
                        </Badge>
                      </div>
                    </div>

                    {/* focus-within keeps these reachable by keyboard. */}
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditor({ mode: "edit", index })}
                        aria-label={`Edit ${feature.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setRemoveIndex(index)}
                        aria-label={`Remove ${feature.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </Button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {isDirty ? (
          <p className="mt-4 text-xs font-medium text-warning">
            You have unsaved feature changes.
          </p>
        ) : null}
      </WorkspaceSection>

      <LeadFeatureModal
        open={editor.mode !== "closed"}
        onClose={() => setEditor({ mode: "closed" })}
        feature={editingFeature}
        onSubmit={handleSubmitFeature}
      />

      <ConfirmDialog
        open={removeIndex !== null}
        onClose={() => setRemoveIndex(null)}
        onConfirm={handleRemove}
        title="Remove feature?"
        description={
          removeIndex !== null
            ? `“${draft[removeIndex]?.name}” will be removed from this request. You'll still need to save your changes.`
            : ""
        }
        confirmLabel="Remove"
        tone="danger"
      />
    </>
  );
}

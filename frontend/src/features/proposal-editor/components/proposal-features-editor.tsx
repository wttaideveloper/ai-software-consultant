import { AnimatePresence, motion } from "framer-motion";
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LeadFeatureModal } from "@/features/client-requests/components/lead-feature-modal";
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

type ProposalFeaturesEditorProps = {
  features: ClientLeadFeature[];
  onChange: (features: ClientLeadFeature[]) => void;
};

/**
 * Feature list for the proposal, pre-filled from the lead.
 *
 * Edits here affect the proposal draft only — the lead's own feature list is
 * untouched, so tailoring a proposal never rewrites the client's original
 * submission. LeadFeatureModal is reused rather than reimplemented; it already
 * edits exactly this shape.
 */
export function ProposalFeaturesEditor({
  features,
  onChange,
}: ProposalFeaturesEditorProps) {
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });

  const includedCount = features.filter((feature) => feature.included).length;

  const handleSubmit = (feature: ClientLeadFeature) => {
    onChange(
      editor.mode === "edit"
        ? features.map((item, index) =>
            index === editor.index ? feature : item,
          )
        : [...features, feature],
    );
    setEditor({ mode: "closed" });
  };

  const toggleIncluded = (index: number) => {
    onChange(
      features.map((item, itemIndex) =>
        itemIndex === index ? { ...item, included: !item.included } : item,
      ),
    );
  };

  return (
    <>
      <WorkspaceSection
        id="features"
        icon={ListChecks}
        title="Features"
        description={`${features.length} feature${features.length === 1 ? "" : "s"} · ${includedCount} in scope`}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditor({ mode: "add" })}
          >
            <Plus className="h-3.5 w-3.5" />
            Add feature
          </Button>
        }
      >
        {features.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            No features on this proposal. Use “Add feature” to create one.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {features.map((feature, index) => (
                <motion.li
                  // Index-based key: names are editable and not unique, so
                  // position is the only stable identity in this array.
                  key={`${index}-${feature.name}`}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl border border-border bg-canvas p-4",
                    "transition-[border-color] duration-200 hover:border-border-strong",
                    !feature.included && "opacity-55",
                  )}
                >
                  <div className="pt-0.5">
                    <Checkbox
                      checked={feature.included}
                      onChange={() => toggleIncluded(index)}
                      aria-label={`Include ${feature.name} in the proposal`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{feature.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted text-pretty">
                      {feature.description}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="accent" size="sm">
                        {feature.category}
                      </Badge>
                      <Badge
                        variant={PRIORITY_VARIANT[feature.priority] ?? "default"}
                        size="sm"
                        dot
                      >
                        {feature.priority}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {feature.complexity} complexity
                      </Badge>
                    </div>
                  </div>

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
                      onClick={() =>
                        onChange(features.filter((_, i) => i !== index))
                      }
                      aria-label={`Remove ${feature.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </WorkspaceSection>

      <LeadFeatureModal
        open={editor.mode !== "closed"}
        onClose={() => setEditor({ mode: "closed" })}
        feature={editor.mode === "edit" ? (features[editor.index] ?? null) : null}
        onSubmit={handleSubmit}
      />
    </>
  );
}

import { Pencil, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { COMPLEXITY_META, PRIORITY_META } from "@/features/detected-features/feature-badges";
import type { ClientFeature } from "@/store/client-consultation.store";

type FeatureCardProps = {
  feature: ClientFeature;
  onEdit: () => void;
  onRemove: () => void;
};

export function FeatureCard({ feature, onEdit, onRemove }: FeatureCardProps) {
  return (
    <Card hover={false}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-foreground">{feature.name}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit feature">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remove feature">
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      </div>
      <p className="mt-1.5 text-sm text-foreground-soft">{feature.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={PRIORITY_META[feature.priority].variant}>
          {PRIORITY_META[feature.priority].label}
        </Badge>
        <Badge variant={COMPLEXITY_META[feature.complexity].variant}>
          {COMPLEXITY_META[feature.complexity].label}
        </Badge>
      </div>
    </Card>
  );
}

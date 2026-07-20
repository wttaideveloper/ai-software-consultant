import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteFeatureDialog } from "@/features/detected-features/components/delete-feature-dialog";
import { FeatureItem } from "@/features/detected-features/components/feature-item";
import type { DetectedFeature, FeatureGroup } from "@/types";
import { staggerContainer, staggerItem } from "@/utils/motion";

type FeatureCategoryCardProps = {
  group: FeatureGroup;
  consultationId: string;
};

export function FeatureCategoryCard({ group, consultationId }: FeatureCategoryCardProps) {
  const [deleteTarget, setDeleteTarget] = useState<DetectedFeature | null>(null);

  return (
    <motion.div variants={staggerItem}>
      <Card hover={false}>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
              <Layers className="h-4 w-4" strokeWidth={1.85} />
            </div>
            <div>
              <CardTitle>{group.category}</CardTitle>
              <p className="text-xs text-muted">
                {group.features.length} feature{group.features.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </CardHeader>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3"
        >
          {group.features.map((feature) => (
            <FeatureItem
              key={feature.id}
              feature={feature}
              consultationId={consultationId}
              onDelete={() => setDeleteTarget(feature)}
            />
          ))}
        </motion.div>
      </Card>

      <DeleteFeatureDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        feature={deleteTarget}
        consultationId={consultationId}
      />
    </motion.div>
  );
}

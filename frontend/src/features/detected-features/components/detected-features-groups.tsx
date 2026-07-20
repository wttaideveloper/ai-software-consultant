import { motion } from "framer-motion";
import { FeatureCategoryCard } from "@/features/detected-features/components/feature-category-card";
import type { FeatureGroup } from "@/types";
import { staggerContainer } from "@/utils/motion";

type DetectedFeaturesGroupsProps = {
  groups: FeatureGroup[];
  consultationId: string;
};

export function DetectedFeaturesGroups({ groups, consultationId }: DetectedFeaturesGroupsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5 p-4 sm:p-6"
    >
      {groups.map((group) => (
        <FeatureCategoryCard key={group.category} group={group} consultationId={consultationId} />
      ))}
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

export function DetectedFeaturesLoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface/90"
    >
      <Spinner />
      <p className="text-sm text-muted">Detecting features…</p>
    </motion.div>
  );
}

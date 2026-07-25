import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { EASE_OUT_EXPO } from "@/utils/motion";

type MetricCardProps = {
  label: string;
  value: string;
  /** Dims the value to signal a "not available" fallback (e.g. cost or tech stack the response didn't include) rather than a real figure. */
  unavailable?: boolean;
  /** Small caveat under the value — e.g. why a timeline is shown as a range. */
  hint?: string;
};

export function MetricCard({ label, value, unavailable, hint }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-border bg-surface p-4 transition-[box-shadow,border-color] duration-300 hover:border-border-strong hover:shadow-md"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-lg font-semibold",
          unavailable ? "text-muted" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p> : null}
    </motion.div>
  );
}

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while the first summary is generating. Mirrors the real section cards
 * so the layout doesn't jump when content arrives, and names what's happening —
 * an AI call takes long enough that a bare spinner reads as a stall.
 */
export function SummarySkeleton() {
  return (
    <div>
      <div className="mb-5 flex items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4">
        <motion.span
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="asc-gradient-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2} />
        </motion.span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Writing your requirement summary…
          </p>
          <p className="mt-0.5 text-xs text-muted">
            This usually takes a few seconds.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {[5, 3, 4].map((lines, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-surface"
          >
            <div className="flex items-center gap-3 border-b border-border px-5 py-3">
              <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="space-y-2.5 px-5 py-4">
              {Array.from({ length: lines }).map((_, line) => (
                <Skeleton
                  key={line}
                  className={line === lines - 1 ? "h-3 w-2/3" : "h-3 w-full"}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Calculator, FileText, Hexagon, MessageSquareText, Sparkles } from "lucide-react";
import { staggerContainer, staggerItem } from "@/utils/motion";

const FEATURES = [
  { icon: MessageSquareText, label: "AI-guided discovery conversations" },
  { icon: FileText, label: "Structured requirement summaries" },
  { icon: Sparkles, label: "Automatic feature detection" },
  { icon: Calculator, label: "Effort estimates, generated for you" },
];

export function AuthBrandPanel() {
  return (
    <div className="relative hidden w-[44%] shrink-0 flex-col justify-between overflow-hidden border-r border-border bg-surface-muted px-12 py-12 lg:flex">
      <div>
        <div className="flex items-center gap-3">
          <div className="asc-gradient-accent flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm shadow-accent/25">
            <Hexagon className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Consultant</p>
            <p className="text-[11px] text-muted">AI Platform</p>
          </div>
        </div>

        <h1 className="mt-16 max-w-sm text-3xl font-semibold tracking-tight text-foreground">
          Turn client conversations into scoped, priced proposals.
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
          AI Software Consultant guides discovery, extracts requirements, and
          drafts estimates and proposals your team can ship with confidence.
        </p>

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-10 space-y-3"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.li
                key={feature.label}
                variants={staggerItem}
                className="flex items-center gap-3 text-sm text-foreground-soft"
              >
                <span className="asc-gradient-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent">
                  <Icon className="h-4 w-4" strokeWidth={1.85} />
                </span>
                {feature.label}
              </motion.li>
            );
          })}
        </motion.ul>
      </div>

      <div className="relative mt-16 flex h-56 items-center justify-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="asc-gradient-subtle absolute h-40 w-52 -rotate-6 rounded-xl border border-border shadow-sm"
        />
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          className="asc-gradient-accent absolute h-40 w-52 rotate-3 rounded-xl shadow-lg shadow-accent/20"
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-surface text-accent shadow-sm ring-1 ring-border">
          <Hexagon className="h-6 w-6" strokeWidth={1.85} />
        </div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Calculator, FileText, MessageSquareText, Sparkles } from "lucide-react";
import { staggerContainer, staggerItem } from "@/utils/motion";

const FEATURES = [
  { icon: MessageSquareText, label: "AI-guided discovery conversations" },
  { icon: FileText, label: "Structured requirement summaries" },
  { icon: Sparkles, label: "Automatic feature detection" },
  { icon: Calculator, label: "Effort estimates, generated for you" },
];

export function AuthBrandPanel() {
  return (
    <div className="asc-gradient-accent relative hidden w-[46%] shrink-0 flex-col justify-between overflow-hidden px-12 py-12 xl:w-[42%] lg:flex">
      {/* Depth wash — two soft radial highlights keep the flat gradient from
          looking like a solid block behind the copy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-40 h-96 w-96 rounded-full bg-white/[0.07] blur-3xl"
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-sm">
            <Sparkles className="h-5 w-5" strokeWidth={2.1} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">
              Consultant
            </p>
            <p className="text-[11px] text-white/60">AI Platform</p>
          </div>
        </div>

        <h1 className="mt-16 max-w-sm text-[clamp(1.75rem,1.2rem+1.4vw,2.25rem)] leading-tight font-semibold tracking-tight text-white text-balance">
          Turn client conversations into scoped, priced proposals.
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70 text-pretty">
          AI Software Consultant guides discovery, extracts requirements, and drafts
          estimates and proposals your team can ship with confidence.
        </p>

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-12 space-y-4"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.li
                key={feature.label}
                variants={staggerItem}
                className="flex items-center gap-3.5 text-sm text-white/85"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/12 text-white ring-1 ring-white/15">
                  <Icon className="h-4 w-4" strokeWidth={1.85} />
                </span>
                {feature.label}
              </motion.li>
            );
          })}
        </motion.ul>
      </div>

      <p className="relative text-xs text-white/50">
        © {new Date().getFullYear()} AI Consultant
      </p>
    </div>
  );
}

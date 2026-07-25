import { motion, useReducedMotion } from "framer-motion";
import { FileText, Gift, PhoneCall, Rocket, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { useStartNewConsultation } from "@/client-portal/hooks/use-start-new-consultation";
import { Button } from "@/components/ui";
import { EASE_OUT_EXPO, SPRING_SNAPPY } from "@/utils/motion";

const NEXT_STEPS: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Search,
    title: "Review",
    description: "We read through your requirements, features and estimate.",
  },
  {
    icon: FileText,
    title: "Proposal preparation",
    description: "We tailor a detailed proposal to your project.",
  },
  {
    icon: PhoneCall,
    title: "Contact",
    description: "We reach out via your preferred method within 1–2 business days.",
  },
  {
    icon: Rocket,
    title: "Project kickoff",
    description: "Once you're happy, we plan the build and get started.",
  },
];

/** Confirmation shown straight after a lead is submitted; hands off to /gift. */
export function ClientProposalSentPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  // The submitted consultation was already cleared on success; this only puts an
  // explicit "start again" affordance on the flow's dead end.
  const startNewConsultation = useStartNewConsultation();

  return (
    <ClientLayout>
      <div className="flex flex-col items-center py-8 text-center">
        {/* Animated success mark: the badge springs in, the tick draws itself, and
            two soft rings ripple outward (rings drop under reduced motion). */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          {reduce
            ? null
            : [0, 0.5].map((delay) => (
                <motion.span
                  key={delay}
                  aria-hidden
                  className="absolute h-16 w-16 rounded-full bg-success-subtle"
                  initial={{ scale: 1, opacity: 0.55 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{
                    duration: 2,
                    ease: EASE_OUT_EXPO,
                    repeat: Infinity,
                    repeatDelay: 0.4,
                    delay,
                  }}
                />
              ))}

          <motion.div
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success-subtle text-success"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...SPRING_SNAPPY, delay: 0.05 }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
              <motion.path
                d="M4 12.5l5 5 11-11"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.25, ease: EASE_OUT_EXPO }}
              />
            </svg>
          </motion.div>
        </div>

        <motion.h1
          className="mt-5 text-2xl font-semibold tracking-tight text-foreground text-balance"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease: EASE_OUT_EXPO }}
        >
          Proposal request sent!
        </motion.h1>
        <motion.p
          className="mt-2 max-w-sm text-sm leading-relaxed text-muted text-pretty"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.4, ease: EASE_OUT_EXPO }}
        >
          We've received your project details and will be in touch with a tailored
          proposal shortly.
        </motion.p>

        {/* What happens next — each step slides in one after another. */}
        <div className="mt-9 w-full max-w-sm text-left">
          <p className="mb-4 text-center text-xs font-semibold tracking-wider text-accent-text uppercase">
            What happens next
          </p>
          <ol className="relative flex flex-col gap-5">
            {/* Connecting spine behind the icons. */}
            <span
              aria-hidden
              className="absolute top-2 bottom-2 left-4.5 w-px bg-border"
            />
            {NEXT_STEPS.map((step, index) => (
              <motion.li
                key={step.title}
                className="relative flex items-start gap-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.6 + index * 0.14,
                  duration: 0.4,
                  ease: EASE_OUT_EXPO,
                }}
              >
                <span className="asc-gradient-subtle relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-accent-text ring-4 ring-canvas">
                  <step.icon className="h-4 w-4" strokeWidth={1.85} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted text-pretty">
                    {step.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        <motion.div
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + NEXT_STEPS.length * 0.14, duration: 0.4 }}
        >
          <Button onClick={() => navigate("/gift")}>
            <Gift className="h-4 w-4" strokeWidth={1.75} />
            Claim your gift
          </Button>
          <Button variant="ghost" onClick={startNewConsultation}>
            Start a new consultation
          </Button>
        </motion.div>
      </div>
    </ClientLayout>
  );
}

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { REQUIREMENTS_WIZARD_BASE_PATH } from "@/client-portal/requirements-wizard/requirements-wizard.config";
import { cn } from "@/utils/cn";
import { staggerContainer, staggerItem } from "@/utils/motion";
import { useClientConsultationStore } from "@/store/client-consultation.store";
import {
  CONSULTATION_MODE_OPTIONS,
  type ConsultationMode,
} from "@/types/consultation-mode";

/**
 * The consultation's first decision, deliberately ahead of the wizard.
 *
 * "Start Free AI Consultation" used to drop straight into the project-idea step,
 * which silently assumed every visitor was commissioning a new build. A client
 * with a production system needing support was asked for their business idea and
 * target users — questions that have no answer. Choosing the engagement type
 * first is what lets the rest of the pipeline ask the right things instead.
 *
 * The choice is stored, not just routed on: it travels with every subsequent AI
 * request (see client-consultation.store.ts).
 */
export function ClientConsultationModePage() {
  const navigate = useNavigate();
  const selectedMode = useClientConsultationStore((state) => state.consultationMode);
  const setConsultationMode = useClientConsultationStore(
    (state) => state.setConsultationMode,
  );

  const choose = (mode: ConsultationMode) => {
    setConsultationMode(mode);
    navigate(REQUIREMENTS_WIZARD_BASE_PATH);
  };

  return (
    <ClientLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            🚀 Start Your Consultation
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            Choose the type of engagement. We&apos;ll tailor the questions, the
            estimate and the proposal to match.
          </p>
        </header>

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-8 grid gap-4 sm:grid-cols-2"
        >
          {CONSULTATION_MODE_OPTIONS.map((option) => {
            const isSelected = option.mode === selectedMode;

            return (
              <motion.li key={option.mode} variants={staggerItem}>
                <button
                  type="button"
                  onClick={() => choose(option.mode)}
                  aria-pressed={isSelected}
                  className={cn(
                    "group flex h-full w-full flex-col rounded-2xl border bg-surface p-5 text-left transition-colors",
                    "hover:border-accent hover:bg-surface-muted",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    isSelected ? "border-accent asc-shadow-accent" : "border-border",
                  )}
                >
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {option.emoji}
                  </span>

                  <span className="mt-3 flex items-center gap-1.5 text-base font-semibold text-foreground">
                    {option.label}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    />
                  </span>

                  <span className="mt-1.5 text-sm text-foreground-soft">
                    {option.description}
                  </span>

                  <span className="mt-4 flex flex-wrap gap-1.5">
                    {option.examples.map((example) => (
                      <span
                        key={example}
                        className="rounded-lg bg-surface-sunken px-2 py-0.5 text-xs text-muted"
                      >
                        {example}
                      </span>
                    ))}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </ClientLayout>
  );
}

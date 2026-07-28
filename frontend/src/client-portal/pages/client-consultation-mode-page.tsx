import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { REQUIREMENTS_WIZARD_BASE_PATH } from "@/client-portal/requirements-wizard/requirements-wizard.config";
import { cn } from "@/utils/cn";
import { SPRING_SNAPPY, staggerContainer, staggerItem } from "@/utils/motion";
import { useClientConsultationStore } from "@/store/client-consultation.store";
import {
  CONSULTATION_MODE_OPTIONS,
  type ConsultationMode,
  type ConsultationModeOption,
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
    <ClientLayout wide>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col"
      >
        <motion.header variants={staggerItem} className="flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground-soft shadow-xs">
            <Sparkles
              className="size-3.5 text-accent"
              strokeWidth={2}
              aria-hidden="true"
            />
            Free · No account required
          </span>

          <h1 className="mt-4 text-center text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
            Start your consultation
          </h1>
          <p className="mt-2 max-w-lg text-center text-sm text-pretty text-muted sm:text-base">
            Choose the type of engagement. We&apos;ll tailor the questions, the
            estimate and the proposal to match.
          </p>
        </motion.header>

        <ul className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-2 md:gap-5">
          {CONSULTATION_MODE_OPTIONS.map((option) => (
            <ConsultationModeCard
              key={option.mode}
              option={option}
              isSelected={option.mode === selectedMode}
              onSelect={() => choose(option.mode)}
            />
          ))}
        </ul>

        <motion.p
          variants={staggerItem}
          className="mt-6 text-center text-xs text-muted"
        >
          Not sure which fits? Pick the closest — you can start over at any point.
        </motion.p>
      </motion.div>
    </ClientLayout>
  );
}

type ConsultationModeCardProps = {
  option: ConsultationModeOption;
  isSelected: boolean;
  onSelect: () => void;
};

function ConsultationModeCard({
  option,
  isSelected,
  onSelect,
}: ConsultationModeCardProps) {
  const Icon = option.icon;

  return (
    <motion.li variants={staggerItem} className="flex">
      {/*
        Hover lift and press are Framer transforms (compositor-only) while the
        border and shadow move on a CSS transition — keeping the two on separate
        properties avoids them fighting over the same style. Reduced motion is
        handled globally by <MotionConfig reducedMotion="user">.
      */}
      <motion.button
        type="button"
        onClick={onSelect}
        // `aria-current`, not `aria-pressed`: this control navigates, it does not
        // toggle. The set has one current choice, which is exactly what
        // aria-current describes.
        aria-current={isSelected ? "true" : undefined}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.985 }}
        transition={SPRING_SNAPPY}
        className={cn(
          "group relative isolate flex w-full flex-col overflow-hidden rounded-2xl border bg-surface p-5 text-left sm:p-6",
          "transition-[border-color,box-shadow] duration-200 ease-out",
          "hover:border-accent hover:asc-shadow-accent",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          isSelected
            ? "border-accent asc-shadow-accent"
            : "border-border shadow-xs",
        )}
      >
        {/*
          A tinted wash that resolves on hover. Uses the brand gradient utility
          rather than a Tailwind `bg-gradient-*`, and is animated via opacity only
          so it stays off the paint path.
        */}
        <span
          aria-hidden="true"
          className={cn(
            "asc-gradient-subtle pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300",
            isSelected ? "opacity-60" : "opacity-0 group-hover:opacity-50",
          )}
        />

        <span className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
              isSelected
                ? "bg-accent text-accent-foreground"
                : "bg-accent-subtle text-accent group-hover:bg-accent group-hover:text-accent-foreground",
            )}
          >
            <Icon className="size-5" strokeWidth={1.85} aria-hidden="true" />
          </span>

          {isSelected ? (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
              <span className="sr-only">Currently selected</span>
            </span>
          ) : (
            <ArrowRight
              aria-hidden="true"
              className="size-4 shrink-0 -translate-x-1 text-accent opacity-0 transition-[transform,opacity] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            />
          )}
        </span>

        {/* Spans, not <h2>/<p>: a <button> may only contain phrasing content, and
            flow content inside one is invalid HTML. The accessible name still
            comes from the button's own text. */}
        <span className="mt-4 block text-base font-semibold tracking-tight text-foreground">
          {option.label}
        </span>
        <span className="mt-1.5 block text-sm leading-relaxed text-pretty text-foreground-soft">
          {option.description}
        </span>

        {/* `mt-auto` pins the examples to the card's base so a 4-example card and
            a 7-example card still line up across the grid row. */}
        <span className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {option.examples.map((example) => (
            <span
              key={example}
              className="rounded-lg border border-border bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted transition-colors duration-200 group-hover:text-foreground-soft"
            >
              {example}
            </span>
          ))}
        </span>
      </motion.button>
    </motion.li>
  );
}

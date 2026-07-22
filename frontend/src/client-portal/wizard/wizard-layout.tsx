import { motion } from "framer-motion";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ClientPortalHeader } from "@/client-portal/layouts/client-portal-header";
import { WizardProgress } from "@/client-portal/wizard/wizard-progress";
import type { WizardStepDefinition } from "@/client-portal/wizard/wizard-step.types";
import { fadeIn } from "@/utils/motion";

type WizardLayoutProps = {
  steps: WizardStepDefinition[];
  basePath: string;
  /** Fired whenever the active step changes, so a caller can persist progress if it wants to. */
  onStepChange?: (stepId: string) => void;
};

/**
 * Generic, reusable wizard shell: brand header + step-count-agnostic progress + animated
 * content area rendered via <Outlet/>. Knows nothing about any specific flow's steps or
 * store — a route wrapper (e.g. RequirementsWizardLayout) supplies those.
 */
export function WizardLayout({ steps, basePath, onStepChange }: WizardLayoutProps) {
  const location = useLocation();
  const currentIndex = steps.findIndex((step) => location.pathname === `${basePath}/${step.path}`);
  const currentStep = currentIndex >= 0 ? steps[currentIndex] : undefined;

  useEffect(() => {
    if (currentStep) {
      onStepChange?.(currentStep.id);
    }
  }, [currentStep, onStepChange]);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <ClientPortalHeader />

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-2xl">
          <WizardProgress
            currentIndex={Math.max(currentIndex, 0)}
            totalSteps={steps.length}
            label={currentStep?.label ?? ""}
          />

          <motion.div
            key={location.pathname}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="asc-gradient-surface mt-8 rounded-xl border border-border p-6 sm:p-8"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}

import { useLocation } from "react-router-dom";
import { CLIENT_PORTAL_STEPS } from "@/client-portal/client-nav-config";
import { StepProgress } from "@/features/auth/components/step-progress";

/** Renders nothing on pages outside the 5-step flow (Home, Gift). */
export function ClientStepIndicator() {
  const location = useLocation();
  const activeIndex = CLIENT_PORTAL_STEPS.findIndex((step) => step.path === location.pathname);

  if (activeIndex === -1) {
    return null;
  }

  return (
    <div className="border-b border-border bg-surface px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <StepProgress
          steps={CLIENT_PORTAL_STEPS.map((step) => step.label)}
          currentStep={activeIndex}
        />
      </div>
    </div>
  );
}

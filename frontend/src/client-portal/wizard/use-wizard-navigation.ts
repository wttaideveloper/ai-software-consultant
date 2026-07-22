import { useLocation, useNavigate } from "react-router-dom";
import type { WizardStepDefinition } from "@/client-portal/wizard/wizard-step.types";

/**
 * Generic step-through-a-route-list navigator. Works for any `steps` array of any
 * length — the wizard shell never assumes a fixed number of steps.
 *
 * @param onCompletePath Where "Next" on the final step should go. Optional so the
 * hook stays usable for a wizard that doesn't leave its own route range.
 */
export function useWizardNavigation(
  steps: WizardStepDefinition[],
  basePath: string,
  onCompletePath?: string,
) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentIndex = steps.findIndex((step) => location.pathname === `${basePath}/${step.path}`);
  const currentStep = currentIndex >= 0 ? steps[currentIndex] : undefined;
  const isFirstStep = currentIndex <= 0;
  const isLastStep = currentIndex === steps.length - 1;

  const goNext = () => {
    if (currentIndex < 0) return;
    if (isLastStep) {
      if (onCompletePath) navigate(onCompletePath);
      return;
    }
    navigate(`${basePath}/${steps[currentIndex + 1].path}`);
  };

  const goPrevious = () => {
    if (currentIndex <= 0) return;
    navigate(`${basePath}/${steps[currentIndex - 1].path}`);
  };

  return {
    steps,
    currentIndex,
    currentStep,
    totalSteps: steps.length,
    isFirstStep,
    isLastStep,
    goNext,
    goPrevious,
  };
}

import { Navigate } from "react-router-dom";
import { REQUIREMENTS_WIZARD_STEPS } from "@/client-portal/requirements-wizard/requirements-wizard.config";
import { useClientConsultationStore } from "@/store/client-consultation.store";

/** Resumes the wizard at the visitor's last-viewed step, falling back to the first step. */
export function RequirementsWizardIndexRedirect() {
  const currentStepId = useClientConsultationStore((state) => state.currentStep);
  const targetStep =
    REQUIREMENTS_WIZARD_STEPS.find((step) => step.id === currentStepId) ?? REQUIREMENTS_WIZARD_STEPS[0];

  return <Navigate to={targetStep.path} replace />;
}

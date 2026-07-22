import { WizardLayout } from "@/client-portal/wizard/wizard-layout";
import {
  REQUIREMENTS_WIZARD_BASE_PATH,
  REQUIREMENTS_WIZARD_STEPS,
} from "@/client-portal/requirements-wizard/requirements-wizard.config";
import { useClientConsultationStore } from "@/store/client-consultation.store";

/** Thin glue between the generic WizardLayout and this specific flow's step registry + store. */
export function RequirementsWizardLayout() {
  const setCurrentStep = useClientConsultationStore((state) => state.setCurrentStep);

  return (
    <WizardLayout
      steps={REQUIREMENTS_WIZARD_STEPS}
      basePath={REQUIREMENTS_WIZARD_BASE_PATH}
      onStepChange={setCurrentStep}
    />
  );
}

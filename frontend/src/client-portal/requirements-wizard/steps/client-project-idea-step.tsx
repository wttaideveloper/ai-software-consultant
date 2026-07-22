import { Textarea } from "@/components/ui";
import { WizardFooter } from "@/client-portal/wizard/wizard-footer";
import { WizardNavigation } from "@/client-portal/wizard/wizard-navigation";
import { useWizardNavigation } from "@/client-portal/wizard/use-wizard-navigation";
import {
  REQUIREMENTS_WIZARD_BASE_PATH,
  REQUIREMENTS_WIZARD_COMPLETE_PATH,
  REQUIREMENTS_WIZARD_STEPS,
} from "@/client-portal/requirements-wizard/requirements-wizard.config";
import { useClientConsultationStore } from "@/store/client-consultation.store";

export function ClientProjectIdeaStep() {
  const { goNext, isFirstStep } = useWizardNavigation(
    REQUIREMENTS_WIZARD_STEPS,
    REQUIREMENTS_WIZARD_BASE_PATH,
    REQUIREMENTS_WIZARD_COMPLETE_PATH,
  );
  const projectIdea = useClientConsultationStore((state) => state.projectIdea);
  const setProjectIdea = useClientConsultationStore((state) => state.setProjectIdea);

  const isValid = projectIdea.trim().length > 0;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        What would you like to build?
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Describe your idea in your own words — as much or as little detail as you have.
      </p>

      <div className="mt-6">
        <Textarea
          value={projectIdea}
          onChange={(event) => setProjectIdea(event.target.value)}
          rows={8}
          placeholder="e.g. An app that helps small gyms manage class bookings and memberships..."
        />
      </div>

      <WizardFooter>
        <WizardNavigation onNext={goNext} isFirstStep={isFirstStep} nextDisabled={!isValid} />
      </WizardFooter>
    </div>
  );
}

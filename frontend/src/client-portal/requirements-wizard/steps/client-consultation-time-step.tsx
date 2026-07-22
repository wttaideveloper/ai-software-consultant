import { WizardFooter } from "@/client-portal/wizard/wizard-footer";
import { WizardNavigation } from "@/client-portal/wizard/wizard-navigation";
import { useWizardNavigation } from "@/client-portal/wizard/use-wizard-navigation";
import {
  REQUIREMENTS_WIZARD_BASE_PATH,
  REQUIREMENTS_WIZARD_COMPLETE_PATH,
  REQUIREMENTS_WIZARD_STEPS,
} from "@/client-portal/requirements-wizard/requirements-wizard.config";
import { useClientConsultationStore } from "@/store/client-consultation.store";
import { cn } from "@/utils/cn";

const CONSULTATION_TIME_OPTIONS = [
  { value: "2", label: "2 Minutes", description: "A quick overview" },
  { value: "5", label: "5 Minutes", description: "A focused walkthrough" },
  { value: "10", label: "10 Minutes", description: "An in-depth discussion" },
];

export function ClientConsultationTimeStep() {
  const { goNext, goPrevious, isFirstStep } = useWizardNavigation(
    REQUIREMENTS_WIZARD_STEPS,
    REQUIREMENTS_WIZARD_BASE_PATH,
    REQUIREMENTS_WIZARD_COMPLETE_PATH,
  );
  const consultationTime = useClientConsultationStore((state) => state.consultationTime);
  const setConsultationTime = useClientConsultationStore((state) => state.setConsultationTime);

  const isValid = consultationTime !== null;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        How much time would you like to spend?
      </h1>
      <p className="mt-1.5 text-sm text-muted">Pick the length that fits your schedule.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {CONSULTATION_TIME_OPTIONS.map((option) => {
          const isSelected = consultationTime === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setConsultationTime(option.value)}
              className={cn(
                "rounded-xl border p-5 text-left transition-colors",
                isSelected
                  ? "asc-gradient-subtle border-accent/40"
                  : "border-border hover:border-accent/25 hover:bg-surface-muted",
              )}
            >
              <p className={cn("text-lg font-semibold", isSelected ? "text-accent" : "text-foreground")}>
                {option.label}
              </p>
              <p className="mt-1 text-xs text-muted">{option.description}</p>
            </button>
          );
        })}
      </div>

      <WizardFooter>
        <WizardNavigation
          onPrevious={goPrevious}
          onNext={goNext}
          isFirstStep={isFirstStep}
          nextDisabled={!isValid}
        />
      </WizardFooter>
    </div>
  );
}

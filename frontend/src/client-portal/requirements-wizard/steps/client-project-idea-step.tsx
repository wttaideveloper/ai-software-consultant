import { useRef } from "react";
import { Textarea } from "@/components/ui";
import { SpeechInput } from "@/client-portal/speech/speech-input";
import { WizardFooter } from "@/client-portal/wizard/wizard-footer";
import { WizardNavigation } from "@/client-portal/wizard/wizard-navigation";
import { useWizardNavigation } from "@/client-portal/wizard/use-wizard-navigation";
import {
  REQUIREMENTS_WIZARD_BASE_PATH,
  REQUIREMENTS_WIZARD_COMPLETE_PATH,
  REQUIREMENTS_WIZARD_STEPS,
} from "@/client-portal/requirements-wizard/requirements-wizard.config";
import { useClientConsultationStore } from "@/store/client-consultation.store";
import { ConsultationModeBadge } from "@/components/shared/consultation-mode-badge";
import { getConsultationModeOption } from "@/types/consultation-mode";

export function ClientProjectIdeaStep() {
  const { goNext, isFirstStep } = useWizardNavigation(
    REQUIREMENTS_WIZARD_STEPS,
    REQUIREMENTS_WIZARD_BASE_PATH,
    REQUIREMENTS_WIZARD_COMPLETE_PATH,
  );
  const projectIdea = useClientConsultationStore((state) => state.projectIdea);
  const setProjectIdea = useClientConsultationStore((state) => state.setProjectIdea);
  const consultationMode = useClientConsultationStore(
    (state) => state.consultationMode,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * The heading, helper text and placeholder all come from the chosen engagement
   * type. "What would you like to build?" is the wrong question to put in front
   * of someone whose production system is falling over — they have nothing to
   * build, and answering it honestly would poison every downstream AI step.
   */
  const modeOption = getConsultationModeOption(consultationMode);

  const isValid = projectIdea.trim().length > 0;

  return (
    <div>
      <ConsultationModeBadge mode={consultationMode} />
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
        {modeOption.ideaStepTitle}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {modeOption.ideaStepDescription} Type it, or say it out loud.
      </p>

      <div className="mt-6">
        <Textarea
          ref={textareaRef}
          value={projectIdea}
          onChange={(event) => setProjectIdea(event.target.value)}
          rows={8}
          placeholder={modeOption.ideaPlaceholder}
        />

        {/*
          Voice is a second way into the same field, never a replacement: it
          writes through setProjectIdea exactly as typing does, so the store,
          the validation below and everything downstream are unchanged. Renders
          nothing on browsers without the Web Speech API.
        */}
        <SpeechInput
          value={projectIdea}
          onChange={setProjectIdea}
          scrollTargetRef={textareaRef}
        />
      </div>

      <WizardFooter>
        <WizardNavigation onNext={goNext} isFirstStep={isFirstStep} nextDisabled={!isValid} />
      </WizardFooter>
    </div>
  );
}

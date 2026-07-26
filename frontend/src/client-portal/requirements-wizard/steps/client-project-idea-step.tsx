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

export function ClientProjectIdeaStep() {
  const { goNext, isFirstStep } = useWizardNavigation(
    REQUIREMENTS_WIZARD_STEPS,
    REQUIREMENTS_WIZARD_BASE_PATH,
    REQUIREMENTS_WIZARD_COMPLETE_PATH,
  );
  const projectIdea = useClientConsultationStore((state) => state.projectIdea);
  const setProjectIdea = useClientConsultationStore((state) => state.setProjectIdea);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isValid = projectIdea.trim().length > 0;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        What would you like to build?
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Describe your idea in your own words — type it, or say it out loud.
      </p>

      <div className="mt-6">
        <Textarea
          ref={textareaRef}
          value={projectIdea}
          onChange={(event) => setProjectIdea(event.target.value)}
          rows={8}
          placeholder="e.g. An app that helps small gyms manage class bookings and memberships..."
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

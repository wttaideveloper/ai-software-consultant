import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner, Textarea } from "@/components/ui";
import {
  useNextDiscoveryQuestion,
  useStartDiscovery,
} from "@/client-portal/requirements-wizard/hooks/use-client-discovery";
import {
  REQUIREMENTS_WIZARD_BASE_PATH,
  REQUIREMENTS_WIZARD_COMPLETE_PATH,
  REQUIREMENTS_WIZARD_STEPS,
} from "@/client-portal/requirements-wizard/requirements-wizard.config";
import { WizardFooter } from "@/client-portal/wizard/wizard-footer";
import { WizardNavigation } from "@/client-portal/wizard/wizard-navigation";
import { useWizardNavigation } from "@/client-portal/wizard/use-wizard-navigation";
import { useClientConsultationStore } from "@/store/client-consultation.store";

/**
 * No hardcoded questions and no fixed count: the first question comes from
 * POST /api/client/questions/start, and every subsequent one from
 * POST /api/client/questions/next — the AI alone decides both the content and
 * when enough information has been gathered (`completed: true`), at which point
 * this step hands off to Requirement Summary automatically.
 */
export function ClientQuestionsStep() {
  const navigate = useNavigate();
  const { goPrevious, isFirstStep } = useWizardNavigation(
    REQUIREMENTS_WIZARD_STEPS,
    REQUIREMENTS_WIZARD_BASE_PATH,
    REQUIREMENTS_WIZARD_COMPLETE_PATH,
  );

  const projectIdea = useClientConsultationStore((state) => state.projectIdea);
  const consultationTime = useClientConsultationStore((state) => state.consultationTime);
  const platforms = useClientConsultationStore((state) => state.platforms);
  const otherPlatform = useClientConsultationStore((state) => state.otherPlatform);
  const conversation = useClientConsultationStore((state) => state.conversation);
  const currentQuestion = useClientConsultationStore((state) => state.currentQuestion);
  const isDiscoveryComplete = useClientConsultationStore((state) => state.isDiscoveryComplete);

  const startDiscovery = useStartDiscovery();
  const nextQuestion = useNextDiscoveryQuestion();

  const [draftAnswer, setDraftAnswer] = useState("");
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current || conversation.length > 0 || isDiscoveryComplete) {
      return;
    }
    hasStartedRef.current = true;
    startDiscovery.mutate({
      projectIdea,
      consultationTime: consultationTime ?? "",
      platforms,
      otherPlatform: otherPlatform || undefined,
    });
    // Intentionally runs once on mount — this kicks off the interview exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isDiscoveryComplete) {
      navigate(REQUIREMENTS_WIZARD_COMPLETE_PATH);
    }
  }, [isDiscoveryComplete, navigate]);

  const handleSubmitAnswer = () => {
    const answer = draftAnswer.trim();
    if (!answer) return;

    nextQuestion.mutate(
      {
        projectIdea,
        consultationTime: consultationTime ?? "",
        platforms,
        otherPlatform: otherPlatform || undefined,
        conversation,
        currentAnswer: answer,
      },
      { onSuccess: () => setDraftAnswer("") },
    );
  };

  const isLoadingFirstQuestion = startDiscovery.isPending && !currentQuestion;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">AI Questions</h1>
      <p className="mt-1.5 text-sm text-muted">
        A few follow-up questions personalized to your project idea.
      </p>

      <div className="mt-6">
        {isLoadingFirstQuestion ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-12">
            <Spinner label="Preparing your first question" />
          </div>
        ) : null}

        {!isLoadingFirstQuestion && startDiscovery.isError && !currentQuestion ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted">Something went wrong starting the interview.</p>
            <button
              type="button"
              className="text-sm font-medium text-accent hover:text-accent-hover"
              onClick={() => {
                hasStartedRef.current = false;
                startDiscovery.mutate({
                  projectIdea,
                  consultationTime: consultationTime ?? "",
                  platforms,
                  otherPlatform: otherPlatform || undefined,
                });
                hasStartedRef.current = true;
              }}
            >
              Try again
            </button>
          </div>
        ) : null}

        {currentQuestion ? (
          <Textarea
            key={currentQuestion}
            label={currentQuestion}
            value={draftAnswer}
            onChange={(event) => setDraftAnswer(event.target.value)}
            rows={4}
            placeholder="Type your answer..."
            autoFocus
          />
        ) : null}
      </div>

      <WizardFooter>
        <WizardNavigation
          onPrevious={goPrevious}
          onNext={handleSubmitAnswer}
          isFirstStep={isFirstStep}
          nextDisabled={!draftAnswer.trim() || nextQuestion.isPending}
          isNextLoading={nextQuestion.isPending}
        />
      </WizardFooter>
    </div>
  );
}

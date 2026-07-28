import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner, Textarea } from "@/components/ui";
import { SpeechInput } from "@/client-portal/speech/speech-input";
import {
  useNextDiscoveryQuestion,
  useStartDiscovery,
} from "@/client-portal/requirements-wizard/hooks/use-client-discovery";
import { QuestionProgress } from "@/client-portal/requirements-wizard/components/question-progress";
import { resolveQuestionCount } from "@/client-portal/requirements-wizard/question-plan";
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
 * No hardcoded questions: the first comes from POST /api/client/questions/start and
 * every subsequent one from POST /api/client/questions/next — the AI decides all of
 * the content, and the server ends the interview (`completed: true`), at which point
 * this step hands off to Requirement Summary automatically.
 *
 * How MANY questions is not the AI's call, though: it follows from the consultation
 * length the client picked, which is what makes a countable "X of N" possible at all.
 * The count is resolved from that choice, never hardcoded — see question-plan.ts.
 */
export function ClientQuestionsStep() {
  const navigate = useNavigate();
  const { goPrevious, isFirstStep } = useWizardNavigation(
    REQUIREMENTS_WIZARD_STEPS,
    REQUIREMENTS_WIZARD_BASE_PATH,
    REQUIREMENTS_WIZARD_COMPLETE_PATH,
  );

  const projectIdea = useClientConsultationStore((state) => state.projectIdea);
  const consultationMode = useClientConsultationStore(
    (state) => state.consultationMode,
  );
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
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (hasStartedRef.current || conversation.length > 0 || isDiscoveryComplete) {
      return;
    }
    hasStartedRef.current = true;
    startDiscovery.mutate({
      consultationMode,
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
        consultationMode,
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

  const totalQuestions = resolveQuestionCount(consultationTime);
  /**
   * Every assistant turn in the transcript is one question asked, so the count of
   * them IS the current position — no separate counter to drift out of sync with
   * the conversation. Floored at 1 so the very first screen reads "1 of N" while
   * question one is still being generated, rather than "0 of N".
   */
  const questionNumber = Math.max(
    conversation.filter((turn) => turn.role === "assistant").length,
    1,
  );
  const showProgress = Boolean(currentQuestion) || isLoadingFirstQuestion;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">AI Questions</h1>
      <p className="mt-1.5 text-sm text-muted">
        A few follow-up questions personalized to your project idea.
      </p>

      {showProgress ? (
        <div className="mt-5">
          <QuestionProgress current={questionNumber} total={totalQuestions} />
        </div>
      ) : null}

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
                  consultationMode,
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
          <>
            <Textarea
              key={currentQuestion}
              ref={answerRef}
              label={currentQuestion}
              value={draftAnswer}
              onChange={(event) => setDraftAnswer(event.target.value)}
              rows={4}
              placeholder="Type your answer..."
              autoFocus
            />

            {/*
              The same voice path as the project idea step, writing through
              setDraftAnswer exactly as typing does — the submitted answer and
              everything downstream of it are unchanged. Keyed on the question
              like the textarea it feeds, so each question gets a fresh dictation
              session: the hook's unmount cleanup releases the microphone, and a
              mic left open on "Next" can never spill words into the next answer.
            */}
            <SpeechInput
              key={`speech-${currentQuestion}`}
              value={draftAnswer}
              onChange={setDraftAnswer}
              scrollTargetRef={answerRef}
              idleLabel="Speak your answer"
            />
          </>
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

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

type WizardNavigationProps = {
  onPrevious?: () => void;
  onNext: () => void;
  isFirstStep: boolean;
  nextDisabled?: boolean;
  isNextLoading?: boolean;
};

/** Previous/Next buttons for a wizard step. Purely presentational — validation gating comes from the step via `nextDisabled`. */
export function WizardNavigation({
  onPrevious,
  onNext,
  isFirstStep,
  nextDisabled,
  isNextLoading,
}: WizardNavigationProps) {
  return (
    <>
      {!isFirstStep && onPrevious ? (
        <Button type="button" variant="secondary" onClick={onPrevious}>
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>
      ) : (
        <span />
      )}
      <Button type="button" onClick={onNext} disabled={nextDisabled} isLoading={isNextLoading}>
        Next
        <ArrowRight className="h-4 w-4" />
      </Button>
    </>
  );
}

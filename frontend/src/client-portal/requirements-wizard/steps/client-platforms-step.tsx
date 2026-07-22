import { Check } from "lucide-react";
import { Input } from "@/components/ui";
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

const PLATFORM_OPTIONS = ["Website", "Android App", "iOS App", "Admin Panel", "Desktop App", "Other"];

export function ClientPlatformsStep() {
  const { goNext, goPrevious, isFirstStep } = useWizardNavigation(
    REQUIREMENTS_WIZARD_STEPS,
    REQUIREMENTS_WIZARD_BASE_PATH,
    REQUIREMENTS_WIZARD_COMPLETE_PATH,
  );
  const platforms = useClientConsultationStore((state) => state.platforms);
  const setPlatforms = useClientConsultationStore((state) => state.setPlatforms);
  const otherPlatform = useClientConsultationStore((state) => state.otherPlatform);
  const setOtherPlatform = useClientConsultationStore((state) => state.setOtherPlatform);

  const togglePlatform = (platform: string) => {
    setPlatforms(
      platforms.includes(platform)
        ? platforms.filter((item) => item !== platform)
        : [...platforms, platform],
    );
  };

  const isValid = platforms.length > 0;
  const showOtherInput = platforms.includes("Other");

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Which platforms do you need?
      </h1>
      <p className="mt-1.5 text-sm text-muted">Select all that apply.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {PLATFORM_OPTIONS.map((platform) => {
          const isSelected = platforms.includes(platform);
          return (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
                isSelected
                  ? "asc-gradient-subtle border-accent/40 text-accent"
                  : "border-border text-foreground hover:border-accent/25 hover:bg-surface-muted",
              )}
            >
              <span>{platform}</span>
              {isSelected ? <Check className="h-4 w-4" /> : null}
            </button>
          );
        })}
      </div>

      {showOtherInput ? (
        <div className="mt-4">
          <Input
            label="Tell us more"
            value={otherPlatform}
            onChange={(event) => setOtherPlatform(event.target.value)}
            placeholder="e.g. Smart TV app"
          />
        </div>
      ) : null}

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

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  REGISTER_STEP_FIELDS,
  REGISTER_STEPS,
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/auth.schema";
import { useRegister } from "@/features/auth/hooks/use-register";
import { stepTransition } from "@/utils/motion";
import { AdminStep } from "./register-steps/admin-step";
import { OrganizationStep } from "./register-steps/organization-step";
import { ReviewStep } from "./register-steps/review-step";
import { StepProgress } from "./step-progress";

const STEP_COMPONENTS = [OrganizationStep, AdminStep, ReviewStep];

export function RegisterForm() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const registerMutation = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      organizationName: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isLastStep = step === REGISTER_STEPS.length - 1;
  const StepComponent = STEP_COMPONENTS[step];

  const goNext = async () => {
    const fields = REGISTER_STEP_FIELDS[step];
    const valid = fields.length === 0 ? true : await form.trigger(fields);
    if (!valid) return;

    setDirection(1);
    setStep((current) => Math.min(current + 1, REGISTER_STEPS.length - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((current) => Math.max(current - 1, 0));
  };

  const onSubmit = (values: RegisterFormValues) => {
    const { confirmPassword: _confirmPassword, ...payload } = values;
    registerMutation.mutate(payload);
  };

  return (
    <FormProvider {...form}>
      <div className="asc-gradient-surface rounded-xl border border-border p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Create your workspace
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Set up your organization and admin account in a few steps.
        </p>

        <StepProgress steps={REGISTER_STEPS} currentStep={step} />

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepTransition}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <StepComponent />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={goBack}
                disabled={registerMutation.isPending}
              >
                Back
              </Button>
            ) : (
              <span />
            )}

            {isLastStep ? (
              <Button type="submit" isLoading={registerMutation.isPending}>
                Create account
              </Button>
            ) : (
              <Button type="button" onClick={goNext}>
                Continue
              </Button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Sign in
          </Link>
        </p>
      </div>
    </FormProvider>
  );
}

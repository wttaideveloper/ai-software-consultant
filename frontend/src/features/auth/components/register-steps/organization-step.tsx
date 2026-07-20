import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { RegisterFormValues } from "@/features/auth/auth.schema";

export function OrganizationStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RegisterFormValues>();

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Organization name"
        placeholder="Acme Consulting"
        autoComplete="organization"
        error={errors.organizationName?.message}
        {...register("organizationName")}
      />
      <p className="text-xs text-muted">
        This becomes your workspace name — you can change it later in Settings.
      </p>
    </div>
  );
}

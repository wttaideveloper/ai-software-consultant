import { useFormContext } from "react-hook-form";
import type { RegisterFormValues } from "@/features/auth/auth.schema";

export function ReviewStep() {
  const { getValues } = useFormContext<RegisterFormValues>();
  const values = getValues();

  const rows: Array<{ label: string; value: string }> = [
    { label: "Organization", value: values.organizationName },
    { label: "Admin name", value: values.fullName },
    { label: "Email", value: values.email },
    { label: "Password", value: "••••••••" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">Review your details before creating the workspace.</p>
      <dl className="divide-y divide-border rounded-lg border border-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-muted">{row.label}</dt>
            <dd className="truncate text-sm font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ARRAY_FIELDS, type RequirementSummaryEditValues } from "@/features/requirement-summary/requirement-summary.schema";

type RequirementSummaryEditorProps = {
  register: UseFormRegister<RequirementSummaryEditValues>;
  errors: FieldErrors<RequirementSummaryEditValues>;
};

export function RequirementSummaryEditor({ register, errors }: RequirementSummaryEditorProps) {
  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <Textarea
        label="Summary (Markdown)"
        rows={10}
        error={errors.summaryMarkdown?.message}
        {...register("summaryMarkdown")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Project name" error={errors.projectName?.message} {...register("projectName")} />
        <Input label="Project type" error={errors.projectType?.message} {...register("projectType")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ARRAY_FIELDS.map((field) => (
          <Textarea
            key={field.key}
            label={field.label}
            hint="One item per line"
            rows={4}
            {...register(field.key)}
          />
        ))}
      </div>
    </div>
  );
}

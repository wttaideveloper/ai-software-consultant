import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { EstimationEditValues } from "@/features/estimation/estimation.schema";

type EstimationEditorProps = {
  register: UseFormRegister<EstimationEditValues>;
  control: Control<EstimationEditValues>;
  errors: FieldErrors<EstimationEditValues>;
};

export function EstimationEditor({ register, control, errors }: EstimationEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "breakdown" });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          type="number"
          label="Estimated hours"
          error={errors.estimatedHours?.message}
          {...register("estimatedHours", { valueAsNumber: true })}
        />
        <Input
          type="number"
          label="Estimated weeks"
          error={errors.estimatedWeeks?.message}
          {...register("estimatedWeeks", { valueAsNumber: true })}
        />
        <Input
          type="number"
          label="Team size"
          error={errors.estimatedTeamSize?.message}
          {...register("estimatedTeamSize", { valueAsNumber: true })}
        />
      </div>

      <Textarea
        label="Assumptions"
        rows={4}
        error={errors.assumptions?.message}
        {...register("assumptions")}
      />

      <Textarea label="Risks" hint="One risk per line" rows={4} {...register("risks")} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground-soft">Feature breakdown</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ category: "", hours: 0 })}
          >
            <Plus className="h-3.5 w-3.5" />
            Add row
          </Button>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Category</TH>
              <TH>Hours</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {fields.map((field, index) => (
              <TR key={field.id}>
                <TD>
                  <Input
                    aria-label={`Breakdown category ${index + 1}`}
                    error={errors.breakdown?.[index]?.category?.message}
                    {...register(`breakdown.${index}.category`)}
                  />
                </TD>
                <TD>
                  <Input
                    type="number"
                    aria-label={`Breakdown hours ${index + 1}`}
                    error={errors.breakdown?.[index]?.hours?.message}
                    {...register(`breakdown.${index}.hours`, { valueAsNumber: true })}
                  />
                </TD>
                <TD className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROPOSAL_STATUS_OPTIONS } from "@/features/proposal/proposal-status";
import type { ProposalEditValues } from "@/features/proposal/proposal.schema";

type ProposalEditorProps = {
  register: UseFormRegister<ProposalEditValues>;
  errors: FieldErrors<ProposalEditValues>;
};

export function ProposalEditor({ register, errors }: ProposalEditorProps) {
  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Input label="Proposal title" error={errors.title?.message} {...register("title")} />
        <Select label="Status" options={PROPOSAL_STATUS_OPTIONS} {...register("status")} />
      </div>

      <Textarea
        label="Executive summary"
        rows={4}
        error={errors.executiveSummary?.message}
        {...register("executiveSummary")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Textarea
          label="Project scope"
          hint="One item per line"
          rows={4}
          {...register("scopeOfWork")}
        />
        <Textarea
          label="Deliverables"
          hint="One item per line"
          rows={4}
          {...register("deliverables")}
        />
      </div>

      <Input label="Timeline" error={errors.timeline?.message} {...register("timeline")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Textarea
          label="Assumptions"
          hint="One item per line"
          rows={4}
          {...register("assumptions")}
        />
        <Textarea
          label="Exclusions"
          hint="One item per line"
          rows={4}
          {...register("exclusions")}
        />
      </div>

      <Textarea
        label="Pricing notes"
        rows={3}
        error={errors.pricingNotes?.message}
        {...register("pricingNotes")}
      />

      <Textarea
        label="Proposal document (Markdown)"
        rows={12}
        error={errors.proposalMarkdown?.message}
        {...register("proposalMarkdown")}
      />
    </div>
  );
}

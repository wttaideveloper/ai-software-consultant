import { zodResolver } from "@hookform/resolvers/zod";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { MetricCard } from "@/client-portal/estimate/components/metric-card";
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/client-portal/proposal-request/contact-form.schema";
import { useCreateClientLead } from "@/client-portal/proposal-request/hooks/use-create-client-lead";
import { Button, EmptyState, Input, Select, Textarea } from "@/components/ui";
import { useClientConsultationStore } from "@/store/client-consultation.store";

const CONTACT_METHOD_OPTIONS = [
  { label: "Email", value: "EMAIL" },
  { label: "Phone", value: "PHONE" },
  { label: "WhatsApp", value: "WHATSAPP" },
];

export function ClientRequestProposalPage() {
  const navigate = useNavigate();

  const projectIdea = useClientConsultationStore((state) => state.projectIdea);
  const consultationTime = useClientConsultationStore((state) => state.consultationTime);
  const platforms = useClientConsultationStore((state) => state.platforms);
  const otherPlatform = useClientConsultationStore((state) => state.otherPlatform);
  const summary = useClientConsultationStore((state) => state.summary);
  const features = useClientConsultationStore((state) => state.features);
  const featureBreakdown = useClientConsultationStore((state) => state.featureBreakdown);
  const estimate = useClientConsultationStore((state) => state.estimate);
  const timeline = useClientConsultationStore((state) => state.timeline);
  const complexity = useClientConsultationStore((state) => state.complexity);
  const recommendedTeam = useClientConsultationStore((state) => state.recommendedTeam);
  const contactInfo = useClientConsultationStore((state) => state.contactInfo);
  const setContactInfo = useClientConsultationStore((state) => state.setContactInfo);

  const createLead = useCreateClientLead();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: contactInfo.name,
      email: contactInfo.email,
      company: contactInfo.company,
      phone: contactInfo.phone,
      whatsapp: contactInfo.whatsapp,
      country: contactInfo.country,
      preferredContactMethod: contactInfo.preferredContactMethod,
      notes: contactInfo.notes,
    },
  });

  const onSubmit = handleSubmit((values) => {
    setContactInfo(values);

    const includedById = new Map(featureBreakdown.map((item) => [item.featureId, item.included]));

    createLead.mutate(
      {
        name: values.name,
        email: values.email,
        company: values.company || undefined,
        phone: values.phone || undefined,
        whatsapp: values.whatsapp || undefined,
        country: values.country || undefined,
        preferredContactMethod: values.preferredContactMethod,
        notes: values.notes || undefined,
        projectIdea,
        consultationTime: consultationTime ?? "",
        platforms,
        otherPlatform: otherPlatform || undefined,
        requirementSummary: summary ?? "",
        features: features.map(({ id, ...feature }) => ({
          ...feature,
          included: includedById.get(id) ?? true,
        })),
        estimate: estimate!,
      },
      { onSuccess: () => navigate("/gift") },
    );
  });

  if (!summary || features.length === 0 || !estimate) {
    return (
      <ClientLayout>
        <EmptyState
          icon={FileText}
          title="Nothing to request yet"
          description="Complete the requirements, features, and estimate steps first."
          action={<Button onClick={() => navigate("/requirements/project-idea")}>Start over</Button>}
        />
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Request Your Free Proposal
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Share your contact details and we'll follow up with a tailored proposal.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Estimated Cost" value="Not available" unavailable />
          <MetricCard label="Timeline" value={timeline ?? "—"} />
          <MetricCard label="Complexity" value={complexity ?? "—"} />
          <MetricCard
            label="Recommended Team"
            value={recommendedTeam ? `${recommendedTeam} member${recommendedTeam === 1 ? "" : "s"}` : "—"}
          />
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" error={errors.name?.message} {...register("name")} />
            <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company" error={errors.company?.message} {...register("company")} />
            <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="WhatsApp" error={errors.whatsapp?.message} {...register("whatsapp")} />
            <Input label="Country" error={errors.country?.message} {...register("country")} />
          </div>
          <Select
            label="Preferred contact method"
            options={CONTACT_METHOD_OPTIONS}
            error={errors.preferredContactMethod?.message}
            {...register("preferredContactMethod")}
          />
          <Textarea
            label="Additional notes"
            rows={4}
            error={errors.notes?.message}
            {...register("notes")}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <Button type="button" variant="secondary" onClick={() => navigate("/estimate")}>
              Back
            </Button>
            <Button type="submit" isLoading={createLead.isPending}>
              Request Free Proposal
            </Button>
          </div>
        </form>
      </div>
    </ClientLayout>
  );
}

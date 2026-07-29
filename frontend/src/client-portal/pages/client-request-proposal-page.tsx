import { zodResolver } from "@hookform/resolvers/zod";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { getPreviousStepPath } from "@/client-portal/client-nav-config";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { MetricCard } from "@/client-portal/estimate/components/metric-card";
import {
  PRICE_RANGE_HELPER_TEXT,
  TIMELINE_RANGE_HELPER_TEXT,
  formatPriceRange,
  formatWeekRange,
  toPriceRange,
  toWeekRange,
} from "@/client-portal/estimate/estimate-pricing";
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/client-portal/proposal-request/contact-form.schema";
import { useCreateClientLead } from "@/client-portal/proposal-request/hooks/use-create-client-lead";
import { useStartNewConsultation } from "@/client-portal/hooks/use-start-new-consultation";
import { Button, EmptyState, Input, Select, Textarea } from "@/components/ui";
import {
  clearClientConsultation,
  useClientConsultationStore,
} from "@/store/client-consultation.store";

const CONTACT_METHOD_OPTIONS = [
  { label: "Email", value: "EMAIL" },
  { label: "Phone", value: "PHONE" },
  { label: "WhatsApp", value: "WHATSAPP" },
];

export function ClientRequestProposalPage() {
  const navigate = useNavigate();

  const projectIdea = useClientConsultationStore((state) => state.projectIdea);
  const consultationMode = useClientConsultationStore(
    (state) => state.consultationMode,
  );
  const consultationTime = useClientConsultationStore((state) => state.consultationTime);
  const platforms = useClientConsultationStore((state) => state.platforms);
  const otherPlatform = useClientConsultationStore((state) => state.otherPlatform);
  const summary = useClientConsultationStore((state) => state.summary);
  const features = useClientConsultationStore((state) => state.features);
  const featureBreakdown = useClientConsultationStore((state) => state.featureBreakdown);
  const estimate = useClientConsultationStore((state) => state.estimate);
  const complexity = useClientConsultationStore((state) => state.complexity);
  const recommendedTeam = useClientConsultationStore((state) => state.recommendedTeam);
  const techStack = useClientConsultationStore((state) => state.techStack);
  const currentPricing = useClientConsultationStore((state) => state.currentPricing);
  const contactInfo = useClientConsultationStore((state) => state.contactInfo);
  const setContactInfo = useClientConsultationStore((state) => state.setContactInfo);

  const createLead = useCreateClientLead();
  const startNewConsultation = useStartNewConsultation();

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
        consultationMode,
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
        // Freeze exactly what this page presented — the tech stack and the price
        // after the client's feature toggles — so the Admin sees the same figures.
        // No repricing or AI: these come straight from the wizard state.
        techStack: techStack ?? [],
        pricing: currentPricing,
      },
      {
        onSuccess: () => {
          // The consultation is now the server's record, so the local copy has
          // done its job — drop it before this page unmounts. Navigating first
          // keeps both updates in one batch, so the guard below can't flash its
          // empty state on the way out. Only the wizard's own key is removed.
          navigate("/proposal-sent");
          clearClientConsultation();
        },
      },
    );
  });

  if (!summary || features.length === 0 || !estimate) {
    return (
      <ClientLayout>
        <EmptyState
          icon={FileText}
          title="Nothing to request yet"
          description="Complete the requirements, features, and estimate steps first."
          action={<Button onClick={startNewConsultation}>Start over</Button>}
        />
      </ClientLayout>
    );
  }

  /**
   * Pure presentation of what the Estimate step already produced — no AI call and
   * no trip to the Cost Engine. `currentPricing` is the figure that page displayed
   * (after any feature toggles), and both ranges are built with the same helpers it
   * used, so the two screens can never disagree.
   */
  const costRangeDisplay = currentPricing
    ? formatPriceRange(
        toPriceRange(currentPricing.breakdown.finalPrice),
        currentPricing.currency,
      )
    : "Not available";

  /**
   * Mirrors the Estimate page: a support engagement has no delivery weeks, so it
   * reports recurring capacity and quotes a monthly figure instead of a project
   * total. The client must see the same framing on both screens.
   */
  const isSupportEngagement = Boolean(estimate.maintenancePlan);
  const timelineDisplay =
    estimate.estimatedWeeks != null
      ? formatWeekRange(toWeekRange(estimate.estimatedWeeks))
      : estimate.maintenancePlan
        ? `${estimate.maintenancePlan.supportHoursPerMonth} hrs / month`
        : "—";

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
          <MetricCard
            label={isSupportEngagement ? "Monthly Cost" : "Estimated Cost"}
            value={costRangeDisplay}
            unavailable={!currentPricing}
            hint={currentPricing ? PRICE_RANGE_HELPER_TEXT : undefined}
          />
          <MetricCard
            label={isSupportEngagement ? "Support Capacity" : "Timeline"}
            value={timelineDisplay}
            hint={
              isSupportEngagement
                ? "Recurring capacity, not a delivery date."
                : TIMELINE_RANGE_HELPER_TEXT
            }
          />
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
            <Button type="button" variant="secondary" onClick={() => navigate(getPreviousStepPath("/request-proposal") ?? "/estimate")}>
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

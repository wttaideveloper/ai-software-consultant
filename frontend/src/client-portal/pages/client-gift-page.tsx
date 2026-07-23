import { GiftReveal } from "@/client-portal/components/gift-reveal";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { useStartNewConsultation } from "@/client-portal/hooks/use-start-new-consultation";

/** The flow's dead end: the reward beat that follows the proposal-sent confirmation. */
export function ClientGiftPage() {
  const startNewConsultation = useStartNewConsultation();

  return (
    <ClientLayout>
      <GiftReveal onStartNew={startNewConsultation} />
    </ClientLayout>
  );
}

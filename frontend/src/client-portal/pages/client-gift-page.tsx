import { useNavigate } from "react-router-dom";
import { GiftReveal } from "@/client-portal/components/gift-reveal";
import { ClientLayout } from "@/client-portal/layouts/client-layout";
import { useStartNewConsultation } from "@/client-portal/hooks/use-start-new-consultation";

/** The flow's dead end: the reward beat that follows the proposal-sent confirmation. */
export function ClientGiftPage() {
  const navigate = useNavigate();
  const startNewConsultation = useStartNewConsultation();

  return (
    <ClientLayout>
      {/* Continue leaves the funnel to the portal home; Start New resets the wizard. */}
      <GiftReveal onContinue={() => navigate("/")} onStartNew={startNewConsultation} />
    </ClientLayout>
  );
}

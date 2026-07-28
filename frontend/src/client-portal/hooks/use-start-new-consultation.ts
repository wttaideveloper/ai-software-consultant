import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CONSULTATION_MODE_PATH } from "@/client-portal/client-nav-config";
import { clearClientConsultation } from "@/store/client-consultation.store";

/**
 * The Client Portal's single "start over" entry point: discards any previous
 * consultation (in-memory + persisted) and sends the visitor to the engagement
 * type chooser.
 *
 * It lands on mode selection rather than the wizard's first step because the mode
 * is now the first thing a consultation needs — every question after it depends
 * on which engagement type was picked. Navigating anywhere inside the wizard
 * would silently keep whatever mode the previous visit used.
 */
export function useStartNewConsultation() {
  const navigate = useNavigate();

  return useCallback(() => {
    clearClientConsultation();
    navigate(CONSULTATION_MODE_PATH);
  }, [navigate]);
}

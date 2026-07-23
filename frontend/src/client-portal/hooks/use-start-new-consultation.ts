import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  REQUIREMENTS_WIZARD_BASE_PATH,
  REQUIREMENTS_WIZARD_STEPS,
} from "@/client-portal/requirements-wizard/requirements-wizard.config";
import { clearClientConsultation } from "@/store/client-consultation.store";

const FIRST_STEP_PATH = `${REQUIREMENTS_WIZARD_BASE_PATH}/${REQUIREMENTS_WIZARD_STEPS[0].path}`;

/**
 * The Client Portal's single "start over" entry point: discards any previous
 * consultation (in-memory + persisted) and sends the visitor to step one.
 *
 * Navigates to the first step explicitly rather than to the wizard index, which
 * would resume at the last-viewed step — the opposite of what's wanted here.
 */
export function useStartNewConsultation() {
  const navigate = useNavigate();

  return useCallback(() => {
    clearClientConsultation();
    navigate(FIRST_STEP_PATH);
  }, [navigate]);
}

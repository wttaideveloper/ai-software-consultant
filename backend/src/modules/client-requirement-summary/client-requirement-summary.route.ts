import { Router } from "express";
import { clientRequirementSummaryController } from "./client-requirement-summary.controller.js";

/** Public — no `authenticate`/`authorize`, same reasoning as client-requirements.route.ts. */
export const clientRequirementSummaryRouter = Router();

clientRequirementSummaryRouter.post("/generate", clientRequirementSummaryController.generate);

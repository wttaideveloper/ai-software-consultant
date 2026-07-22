import { Router } from "express";
import { clientRequirementsController } from "./client-requirements.controller.js";

/**
 * Public — intentionally no `authenticate`/`authorize`. Backs the unauthenticated
 * Client Portal discovery interview, which has no user/organization to authorize.
 */
export const clientRequirementsRouter = Router();

clientRequirementsRouter.post("/start", clientRequirementsController.start);
clientRequirementsRouter.post("/next", clientRequirementsController.next);

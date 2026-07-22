import { Router } from "express";
import { clientFeaturesController } from "./client-features.controller.js";

/** Public — no `authenticate`/`authorize`, same reasoning as client-requirements.route.ts. */
export const clientFeaturesRouter = Router();

clientFeaturesRouter.post("/", clientFeaturesController.generate);

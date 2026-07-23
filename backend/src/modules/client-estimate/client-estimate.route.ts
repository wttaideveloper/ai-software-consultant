import { Router } from "express";
import { clientEstimateController } from "./client-estimate.controller.js";

/** Public — no `authenticate`/`authorize`, same reasoning as client-requirements.route.ts. */
export const clientEstimateRouter = Router();

clientEstimateRouter.post("/", clientEstimateController.generate);
clientEstimateRouter.post("/price", clientEstimateController.price);

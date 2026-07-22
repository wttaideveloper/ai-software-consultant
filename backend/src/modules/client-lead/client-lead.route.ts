import { Router } from "express";
import { clientLeadController } from "./client-lead.controller.js";

/** Public — no `authenticate`/`authorize`, same reasoning as client-requirements.route.ts. */
export const clientLeadRouter = Router();

clientLeadRouter.post("/", clientLeadController.create);

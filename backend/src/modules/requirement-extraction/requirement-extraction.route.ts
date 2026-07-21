import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { authorize } from "../auth/authorization.middleware.js";
import { PERMISSIONS } from "../auth/permissions.constants.js";
import { requirementExtractionController } from "./requirement-extraction.controller.js";

export const requirementExtractionRouter = Router({ mergeParams: true });

requirementExtractionRouter.post(
  "/generate",
  authenticate,
  authorize(PERMISSIONS.CONSULTATION_UPDATE),
  requirementExtractionController.generate,
);

requirementExtractionRouter.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.CONSULTATION_READ),
  requirementExtractionController.get,
);

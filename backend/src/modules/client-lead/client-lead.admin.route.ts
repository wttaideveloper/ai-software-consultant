import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { authorize } from "../auth/authorization.middleware.js";
import { PERMISSIONS } from "../auth/permissions.constants.js";
import { clientLeadController } from "./client-lead.controller.js";

/**
 * Admin-side lead inbox, kept in its own file so client-lead.route.ts stays
 * unambiguously public — that router is the Client Portal's submit endpoint and
 * must never pick up auth middleware.
 *
 * Guarded by CRM_READ, the existing permission for "View CRM records"; a lead
 * inbox is CRM, so no new permission code (and no re-seed) is required.
 */
export const clientLeadAdminRouter = Router();

clientLeadAdminRouter.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.CRM_READ),
  clientLeadController.list,
);

clientLeadAdminRouter.get(
  "/:id",
  authenticate,
  authorize(PERMISSIONS.CRM_READ),
  clientLeadController.getById,
);

/**
 * Admin edits from the Lead Details Workspace. Uses the existing CRM_UPDATE
 * permission — writing to a lead is a stronger action than reading one, so it
 * is deliberately not folded into CRM_READ.
 */
clientLeadAdminRouter.patch(
  "/:id",
  authenticate,
  authorize(PERMISSIONS.CRM_UPDATE),
  clientLeadController.update,
);

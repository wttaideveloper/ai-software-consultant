import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { authorize } from "../auth/authorization.middleware.js";
import { PERMISSIONS } from "../auth/permissions.constants.js";
import { leadProposalController } from "./lead-proposal.controller.js";

/**
 * Versions of one client request, mounted under
 * /api/client-leads/:leadId/proposals. mergeParams so :leadId is readable here.
 *
 * Every route is authenticated and permission-guarded: unlike the Client
 * Portal's submit endpoint, nothing about proposals is public.
 */
export const leadProposalVersionsRouter = Router({ mergeParams: true });

leadProposalVersionsRouter.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.PROPOSAL_READ),
  leadProposalController.listByLead,
);

leadProposalVersionsRouter.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.PROPOSAL_CREATE),
  leadProposalController.create,
);

/**
 * The proposal library and single-version operations, mounted at
 * /api/lead-proposals. Top-level rather than nested because the library lists
 * across every lead, and the editor addresses a version by its own id.
 */
export const leadProposalRouter = Router();

leadProposalRouter.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.PROPOSAL_READ),
  leadProposalController.list,
);

leadProposalRouter.get(
  "/:id",
  authenticate,
  authorize(PERMISSIONS.PROPOSAL_READ),
  leadProposalController.getById,
);

/**
 * Body edits — DRAFT versions only. Any other status is immutable and the
 * service returns 409; the client's route out is /edit below.
 */
leadProposalRouter.patch(
  "/:id",
  authenticate,
  authorize(PERMISSIONS.PROPOSAL_UPDATE),
  leadProposalController.update,
);

/**
 * "I want to edit this version." The server applies the editing rules and
 * returns either this version (already a draft) or a new draft forked from it.
 * PROPOSAL_CREATE because it may create a version.
 */
leadProposalRouter.post(
  "/:id/edit",
  authenticate,
  authorize(PERMISSIONS.PROPOSAL_CREATE),
  leadProposalController.openForEditing,
);

/** Regenerate — always a new version, never an overwrite. */
leadProposalRouter.post(
  "/:id/regenerate",
  authenticate,
  authorize(PERMISSIONS.PROPOSAL_CREATE),
  leadProposalController.regenerate,
);

/** Mark Ready / Sent / Accepted / Rejected / Archive all land here. */
leadProposalRouter.patch(
  "/:id/status",
  authenticate,
  authorize(PERMISSIONS.PROPOSAL_UPDATE),
  leadProposalController.updateStatus,
);

leadProposalRouter.delete(
  "/:id",
  authenticate,
  authorize(PERMISSIONS.PROPOSAL_DELETE),
  leadProposalController.remove,
);

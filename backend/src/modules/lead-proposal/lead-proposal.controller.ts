import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { leadProposalService } from "./lead-proposal.service.js";
import {
  createLeadProposalSchema,
  leadIdParamsSchema,
  leadProposalIdParamsSchema,
  listLeadProposalsQuerySchema,
  updateLeadProposalSchema,
  updateLeadProposalStatusSchema,
} from "./lead-proposal.validation.js";

/** Every action validates params/body the same way, so the 400 is built once. */
function parseOrThrow<T>(result: {
  success: boolean;
  data?: T;
  error?: { issues: { message: string }[] };
}): T {
  if (!result.success || result.data === undefined) {
    throw new AppError(
      result.error?.issues[0]?.message ?? "Validation failed",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return result.data;
}

export class LeadProposalController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const { leadId } = parseOrThrow(leadIdParamsSchema.safeParse(req.params));
    const body = parseOrThrow(createLeadProposalSchema.safeParse(req.body));

    if (!req.user) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await leadProposalService.createVersion(
      leadId,
      body,
      req.user.id,
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse("Proposal version created.", result));
  });

  listByLead = asyncHandler(async (req: Request, res: Response) => {
    const { leadId } = parseOrThrow(leadIdParamsSchema.safeParse(req.params));
    const result = await leadProposalService.listByLead(leadId);

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Proposal versions fetched successfully.", result));
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = parseOrThrow(listLeadProposalsQuerySchema.safeParse(req.query));
    const result = await leadProposalService.list(query);

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Proposals fetched successfully.", result));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = parseOrThrow(leadProposalIdParamsSchema.safeParse(req.params));
    const result = await leadProposalService.getById(id);

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Proposal fetched successfully.", result));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = parseOrThrow(leadProposalIdParamsSchema.safeParse(req.params));
    const body = parseOrThrow(updateLeadProposalSchema.safeParse(req.body));

    const result = await leadProposalService.update(id, body);

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Proposal saved.", result));
  });

  /** Backs Mark Ready / Sent / Accepted / Rejected and Archive. */
  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = parseOrThrow(leadProposalIdParamsSchema.safeParse(req.params));
    const { status } = parseOrThrow(
      updateLeadProposalStatusSchema.safeParse(req.body),
    );

    const result = await leadProposalService.changeStatus(id, status);

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Proposal status updated.", result));
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = parseOrThrow(leadProposalIdParamsSchema.safeParse(req.params));
    await leadProposalService.remove(id);

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Proposal deleted.", { id }));
  });
}

export const leadProposalController = new LeadProposalController();

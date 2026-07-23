import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { clientLeadService } from "./client-lead.service.js";
import {
  clientLeadIdParamsSchema,
  createClientLeadSchema,
  listClientLeadsQuerySchema,
  updateClientLeadSchema,
} from "./client-lead.validation.js";

export class ClientLeadController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const parsedBody = createClientLeadSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await clientLeadService.create(parsedBody.data);

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse("Your proposal request has been submitted.", result));
  });

  /** Admin lead inbox — mounted behind authenticate + authorize(CRM_READ). */
  list = asyncHandler(async (req: Request, res: Response) => {
    const parsedQuery = listClientLeadsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      throw new AppError(
        parsedQuery.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await clientLeadService.list(parsedQuery.data);

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Client requests fetched successfully.", result));
  });

  /** Lead Details Workspace — full lead. authenticate + authorize(CRM_READ). */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const parsedParams = clientLeadIdParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(
        parsedParams.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await clientLeadService.getById(parsedParams.data.id);

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Client request fetched successfully.", result));
  });

  /** Admin edit — status / requirement summary / features. authorize(CRM_UPDATE). */
  update = asyncHandler(async (req: Request, res: Response) => {
    const parsedParams = clientLeadIdParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      throw new AppError(
        parsedParams.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const parsedBody = updateClientLeadSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await clientLeadService.update(
      parsedParams.data.id,
      parsedBody.data,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Client request updated successfully.", result));
  });
}

export const clientLeadController = new ClientLeadController();

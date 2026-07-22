import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { clientRequirementsService } from "./client-requirements.service.js";
import {
  nextClientDiscoverySchema,
  startClientDiscoverySchema,
} from "./client-requirements.validation.js";

export class ClientRequirementsController {
  start = asyncHandler(async (req: Request, res: Response) => {
    const parsedBody = startClientDiscoverySchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await clientRequirementsService.startDiscovery(parsedBody.data);

    res.status(HTTP_STATUS.OK).json(successResponse("Discovery interview started.", result));
  });

  next = asyncHandler(async (req: Request, res: Response) => {
    const parsedBody = nextClientDiscoverySchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await clientRequirementsService.nextQuestion(parsedBody.data);

    res.status(HTTP_STATUS.OK).json(successResponse("Next question generated.", result));
  });
}

export const clientRequirementsController = new ClientRequirementsController();

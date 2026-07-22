import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { clientRequirementSummaryService } from "./client-requirement-summary.service.js";
import { generateClientSummarySchema } from "./client-requirement-summary.validation.js";

export class ClientRequirementSummaryController {
  generate = asyncHandler(async (req: Request, res: Response) => {
    const parsedBody = generateClientSummarySchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await clientRequirementSummaryService.generate(parsedBody.data);

    res.status(HTTP_STATUS.OK).json(successResponse("Requirement summary generated.", result));
  });
}

export const clientRequirementSummaryController = new ClientRequirementSummaryController();

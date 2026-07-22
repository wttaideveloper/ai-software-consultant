import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { clientLeadService } from "./client-lead.service.js";
import { createClientLeadSchema } from "./client-lead.validation.js";

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
}

export const clientLeadController = new ClientLeadController();

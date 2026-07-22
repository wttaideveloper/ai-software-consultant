import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { clientFeaturesService } from "./client-features.service.js";
import { generateClientFeaturesSchema } from "./client-features.validation.js";

export class ClientFeaturesController {
  generate = asyncHandler(async (req: Request, res: Response) => {
    const parsedBody = generateClientFeaturesSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await clientFeaturesService.generate(parsedBody.data);

    res.status(HTTP_STATUS.OK).json(successResponse("Features detected.", result));
  });
}

export const clientFeaturesController = new ClientFeaturesController();

import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { clientEstimateService } from "./client-estimate.service.js";
import {
  generateClientEstimateSchema,
  priceClientEstimateSchema,
} from "./client-estimate.validation.js";

export class ClientEstimateController {
  generate = asyncHandler(async (req: Request, res: Response) => {
    const parsedBody = generateClientEstimateSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await clientEstimateService.generate(parsedBody.data);

    res.status(HTTP_STATUS.OK).json(successResponse("Estimate generated.", result));
  });

  /** Live reprice as the client toggles features — reuses the Cost Engine, no AI. */
  price = asyncHandler(async (req: Request, res: Response) => {
    const parsedBody = priceClientEstimateSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await clientEstimateService.price(parsedBody.data);

    res.status(HTTP_STATUS.OK).json(successResponse("Estimate priced.", result));
  });
}

export const clientEstimateController = new ClientEstimateController();

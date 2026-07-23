import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { costSettingsService } from "./cost.service.js";
import {
  previewCostQuerySchema,
  updateComplexityMultipliersSchema,
  updateCostSettingsSchema,
  updateHourlyRatesSchema,
  updatePlatformMultipliersSchema,
} from "./cost.validation.js";

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

/** Every rate card is organization-scoped; the tenant comes from the token. */
function requireOrganizationId(req: Request): string {
  if (!req.user) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  return req.user.organizationId;
}

export class CostSettingsController {
  getConfiguration = asyncHandler(async (req: Request, res: Response) => {
    const result = await costSettingsService.getConfiguration(
      requireOrganizationId(req),
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Cost settings fetched successfully.", result));
  });

  updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const body = parseOrThrow(updateCostSettingsSchema.safeParse(req.body));
    const result = await costSettingsService.updateSettings(
      requireOrganizationId(req),
      body,
    );

    res.status(HTTP_STATUS.OK).json(successResponse("Cost settings saved.", result));
  });

  getHourlyRates = asyncHandler(async (req: Request, res: Response) => {
    const { hourlyRates } = await costSettingsService.getConfiguration(
      requireOrganizationId(req),
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Hourly rates fetched successfully.", hourlyRates));
  });

  updateHourlyRates = asyncHandler(async (req: Request, res: Response) => {
    const body = parseOrThrow(updateHourlyRatesSchema.safeParse(req.body));
    const result = await costSettingsService.updateHourlyRates(
      requireOrganizationId(req),
      body,
    );

    res.status(HTTP_STATUS.OK).json(successResponse("Hourly rates saved.", result));
  });

  getComplexityMultipliers = asyncHandler(async (req: Request, res: Response) => {
    const { complexityMultipliers } = await costSettingsService.getConfiguration(
      requireOrganizationId(req),
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        successResponse(
          "Complexity multipliers fetched successfully.",
          complexityMultipliers,
        ),
      );
  });

  updateComplexityMultipliers = asyncHandler(
    async (req: Request, res: Response) => {
      const body = parseOrThrow(
        updateComplexityMultipliersSchema.safeParse(req.body),
      );
      const result = await costSettingsService.updateComplexityMultipliers(
        requireOrganizationId(req),
        body,
      );

      res
        .status(HTTP_STATUS.OK)
        .json(successResponse("Complexity multipliers saved.", result));
    },
  );

  getPlatformMultipliers = asyncHandler(async (req: Request, res: Response) => {
    const { platformMultipliers } = await costSettingsService.getConfiguration(
      requireOrganizationId(req),
    );

    res
      .status(HTTP_STATUS.OK)
      .json(
        successResponse(
          "Platform multipliers fetched successfully.",
          platformMultipliers,
        ),
      );
  });

  updatePlatformMultipliers = asyncHandler(async (req: Request, res: Response) => {
    const body = parseOrThrow(updatePlatformMultipliersSchema.safeParse(req.body));
    const result = await costSettingsService.updatePlatformMultipliers(
      requireOrganizationId(req),
      body,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Platform multipliers saved.", result));
  });

  /** Live calculator — read-only, so it needs only the view permission. */
  preview = asyncHandler(async (req: Request, res: Response) => {
    const query = parseOrThrow(previewCostQuerySchema.safeParse(req.query));
    const result = await costSettingsService.preview(
      requireOrganizationId(req),
      query,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Cost preview calculated.", result));
  });
}

export const costSettingsController = new CostSettingsController();

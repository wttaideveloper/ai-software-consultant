import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { settingsService } from "./settings.service.js";
import {
  organizationSettingsUpdateSchema,
  userSettingsUpdateSchema,
} from "./settings.validation.js";

function requireAuthenticatedUser(req: Request) {
  if (!req.user) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  return req.user;
}

export class SettingsController {
  getOrganizationSettings = asyncHandler(async (req: Request, res: Response) => {
    const actor = requireAuthenticatedUser(req);
    const result = await settingsService.getOrganizationSettings(
      actor.organizationId,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Organization settings fetched successfully.", result));
  });

  updateOrganizationSettings = asyncHandler(async (req: Request, res: Response) => {
    const actor = requireAuthenticatedUser(req);
    const parsedBody = organizationSettingsUpdateSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await settingsService.updateOrganizationSettings(
      actor.organizationId,
      parsedBody.data,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Organization settings updated successfully.", result));
  });

  getUserSettings = asyncHandler(async (req: Request, res: Response) => {
    const actor = requireAuthenticatedUser(req);
    const result = await settingsService.getUserSettings(actor.id);

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("User settings fetched successfully.", result));
  });

  updateUserSettings = asyncHandler(async (req: Request, res: Response) => {
    const actor = requireAuthenticatedUser(req);
    const parsedBody = userSettingsUpdateSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new AppError(
        parsedBody.error.issues[0]?.message ?? "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const result = await settingsService.updateUserSettings(
      actor.id,
      parsedBody.data,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("User settings updated successfully.", result));
  });
}

export const settingsController = new SettingsController();

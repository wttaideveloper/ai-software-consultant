import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { clientMockupsService } from "./client-mockups.service.js";
import {
  generateMockupsSchema,
  mockupImageParamsSchema,
  mockupSetParamsSchema,
} from "./client-mockups.validation.js";

function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return req.ip ?? null;
}

function parseOrThrow<T>(result: { success: true; data: T } | { success: false; error: { issues: Array<{ message?: string }> } }): T {
  if (!result.success) {
    throw new AppError(
      result.error.issues[0]?.message ?? "Validation failed",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return result.data;
}

export class ClientMockupsController {
  /** Read-only poll target. Deliberately never starts generation. */
  get = asyncHandler(async (req: Request, res: Response) => {
    const params = parseOrThrow(mockupSetParamsSchema.safeParse(req.params));
    const requirementsHash =
      typeof req.query.requirementsHash === "string"
        ? req.query.requirementsHash
        : undefined;

    const result = await clientMockupsService.getSet(
      params.consultationKey,
      requirementsHash,
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Concept mockups fetched successfully.", result));
  });

  generate = asyncHandler(async (req: Request, res: Response) => {
    const input = parseOrThrow(generateMockupsSchema.safeParse(req.body));

    const result = await clientMockupsService.requestGeneration(input, {
      ipAddress: getClientIp(req),
    });

    res
      .status(HTTP_STATUS.ACCEPTED)
      .json(successResponse("Concept mockup generation started.", result));
  });

  regenerate = asyncHandler(async (req: Request, res: Response) => {
    const input = parseOrThrow(generateMockupsSchema.safeParse(req.body));

    const result = await clientMockupsService.regenerate(input, {
      ipAddress: getClientIp(req),
    });

    res
      .status(HTTP_STATUS.ACCEPTED)
      .json(successResponse("Concept mockup regeneration started.", result));
  });

  /**
   * Streams the stored bytes. Serves from the storage port rather than exposing a
   * filesystem path or a provider URL, so the adapter can change without the
   * public contract moving.
   */
  image = asyncHandler(async (req: Request, res: Response) => {
    const params = parseOrThrow(mockupImageParamsSchema.safeParse(req.params));
    const content = await clientMockupsService.getImageContent(params.imageId);

    if (!content) {
      throw new AppError("Concept image not found", HTTP_STATUS.NOT_FOUND);
    }

    // Immutable: an image id always maps to the same bytes, and regeneration
    // mints new ids rather than overwriting.
    res.setHeader("Content-Type", content.mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.status(HTTP_STATUS.OK).send(content.body);
  });
}

export const clientMockupsController = new ClientMockupsController();

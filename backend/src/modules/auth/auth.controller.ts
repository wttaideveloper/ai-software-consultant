import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { getClientIp } from "../../shared/http/get-client-ip.js";
import { successResponse } from "../../shared/responses/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { authService } from "./auth.service.js";
import { registerSchema } from "./auth.validation.js";
import { loginSchema } from "./login.validation.js";
import { refreshSchema } from "./refresh.validation.js";

function getRequestContext(req: Request) {
  return {
    userAgent: req.get("user-agent") ?? null,
    ipAddress: getClientIp(req),
  };
}

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Validation failed";
      throw new AppError(message, HTTP_STATUS.BAD_REQUEST);
    }

    const result = await authService.register(
      parsed.data,
      getRequestContext(req),
    );

    res
      .status(HTTP_STATUS.CREATED)
      .json(successResponse("Registration successful.", result));
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Validation failed";
      throw new AppError(message, HTTP_STATUS.BAD_REQUEST);
    }

    const result = await authService.login(
      parsed.data,
      getRequestContext(req),
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Login successful.", result));
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const parsed = refreshSchema.safeParse(req.body);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Validation failed";
      throw new AppError(message, HTTP_STATUS.BAD_REQUEST);
    }

    const result = await authService.refreshSession(
      parsed.data,
      getRequestContext(req),
    );

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Session refreshed.", result));
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    const result = await authService.getCurrentUser(req.user.id);

    res
      .status(HTTP_STATUS.OK)
      .json(successResponse("Current user fetched successfully.", result));
  });
}

export const authController = new AuthController();

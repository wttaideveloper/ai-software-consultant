import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";

export const authRouter = Router();

/**
 * POST /register is deliberately NOT mounted.
 *
 * This is an internal consulting platform — accounts are provisioned, never
 * self-served. The implementation is intentionally kept intact and untouched
 * (authController.register → authService.register → registerSchema) so it can be
 * re-enabled or reused later; only the public entry point is gone, which is what
 * actually closes the hole. Re-adding the line below is the entire opt-in:
 *
 *   authRouter.post("/register", authController.register);
 *
 * The account that logs in instead comes from db/seeds/admin.seed.ts, and
 * further staff accounts from the authenticated POST /api/users endpoint
 * (requires the user:create permission).
 */
authRouter.post("/login", authController.login);

/**
 * Unauthenticated by design — callers arrive here because their access token has
 * already expired, so requiring one would be circular. The refresh token itself
 * is the credential, and it is rotated on every use (see authService.refreshSession).
 */
authRouter.post("/refresh", authController.refresh);

authRouter.get("/me", authenticate, authController.me);

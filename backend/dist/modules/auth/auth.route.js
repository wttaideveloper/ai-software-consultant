"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_controller_js_1 = require("./auth.controller.js");
const auth_middleware_js_1 = require("./auth.middleware.js");
exports.authRouter = (0, express_1.Router)();
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
exports.authRouter.post("/login", auth_controller_js_1.authController.login);
exports.authRouter.get("/me", auth_middleware_js_1.authenticate, auth_controller_js_1.authController.me);

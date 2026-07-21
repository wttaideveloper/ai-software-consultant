"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const api_response_js_1 = require("../../shared/responses/api-response.js");
const async_handler_js_1 = require("../../utils/async-handler.js");
const auth_service_js_1 = require("./auth.service.js");
const auth_validation_js_1 = require("./auth.validation.js");
const login_validation_js_1 = require("./login.validation.js");
function getClientIp(req) {
    const forwardedFor = req.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
        return forwardedFor.split(",")[0]?.trim() ?? null;
    }
    return req.ip ?? null;
}
function getRequestContext(req) {
    return {
        userAgent: req.get("user-agent") ?? null,
        ipAddress: getClientIp(req),
    };
}
class AuthController {
    register = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const parsed = auth_validation_js_1.registerSchema.safeParse(req.body);
        if (!parsed.success) {
            const message = parsed.error.issues[0]?.message ?? "Validation failed";
            throw new app_error_js_1.AppError(message, http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await auth_service_js_1.authService.register(parsed.data, getRequestContext(req));
        res
            .status(http_status_js_1.HTTP_STATUS.CREATED)
            .json((0, api_response_js_1.successResponse)("Registration successful.", result));
    });
    login = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const parsed = login_validation_js_1.loginSchema.safeParse(req.body);
        if (!parsed.success) {
            const message = parsed.error.issues[0]?.message ?? "Validation failed";
            throw new app_error_js_1.AppError(message, http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await auth_service_js_1.authService.login(parsed.data, getRequestContext(req));
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Login successful.", result));
    });
    me = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        if (!req.user) {
            throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const result = await auth_service_js_1.authService.getCurrentUser(req.user.id);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Current user fetched successfully.", result));
    });
}
exports.AuthController = AuthController;
exports.authController = new AuthController();

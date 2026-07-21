"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const async_handler_js_1 = require("../../utils/async-handler.js");
const auth_constants_js_1 = require("./auth.constants.js");
const auth_repository_js_1 = require("./auth.repository.js");
const jwt_js_1 = require("./jwt.js");
function extractBearerToken(authorizationHeader) {
    if (!authorizationHeader) {
        throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
    }
    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme !== auth_constants_js_1.TOKEN_TYPE || !token) {
        throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
    }
    return token;
}
function toAuthenticatedUser(user) {
    return {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
    };
}
exports.authenticate = (0, async_handler_js_1.asyncHandler)(async (req, _res, next) => {
    const token = extractBearerToken(req.get(auth_constants_js_1.AUTH_HEADER) ?? undefined);
    let userId;
    try {
        const claims = (0, jwt_js_1.verifyAccessToken)(token);
        userId = claims.sub;
    }
    catch {
        logger_js_1.logger.warn("Access token verification failed");
        throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
    }
    const user = await auth_repository_js_1.authRepository.findUserById(userId);
    if (!user) {
        throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
    }
    if (user.status !== "active") {
        throw new app_error_js_1.AppError("Account is not active", http_status_js_1.HTTP_STATUS.FORBIDDEN);
    }
    req.user = toAuthenticatedUser(user);
    next();
});

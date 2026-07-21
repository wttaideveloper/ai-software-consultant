"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const async_handler_js_1 = require("../../utils/async-handler.js");
const authorization_service_js_1 = require("./authorization.service.js");
function authorize(...requiredPermissions) {
    return (0, async_handler_js_1.asyncHandler)(async (req, _res, next) => {
        if (!req.user) {
            throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
        }
        await authorization_service_js_1.authorizationService.assertHasPermissions(req.user.id, requiredPermissions);
        next();
    });
}

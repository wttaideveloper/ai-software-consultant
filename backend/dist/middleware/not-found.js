"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
const http_status_js_1 = require("../shared/constants/http-status.js");
const app_error_js_1 = require("../shared/errors/app-error.js");
function notFound(req, _res, next) {
    next(new app_error_js_1.AppError(`Route ${req.originalUrl} not found`, http_status_js_1.HTTP_STATUS.NOT_FOUND));
}

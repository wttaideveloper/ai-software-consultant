"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const http_status_js_1 = require("../shared/constants/http-status.js");
const app_error_js_1 = require("../shared/errors/app-error.js");
const logger_js_1 = require("../shared/logger/logger.js");
const api_response_js_1 = require("../shared/responses/api-response.js");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof app_error_js_1.AppError && err.isOperational) {
        res.status(err.statusCode).json((0, api_response_js_1.errorResponse)(err.message));
        return;
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    logger_js_1.logger.error(message);
    res
        .status(http_status_js_1.HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .json((0, api_response_js_1.errorResponse)("Internal server error"));
};
exports.errorHandler = errorHandler;

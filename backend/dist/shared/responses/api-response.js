"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
function successResponse(message, data) {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
}
function errorResponse(message, errors = []) {
    return {
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString(),
    };
}

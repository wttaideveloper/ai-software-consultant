"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureDetectionController = exports.FeatureDetectionController = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const api_response_js_1 = require("../../shared/responses/api-response.js");
const async_handler_js_1 = require("../../utils/async-handler.js");
const feature_detection_service_js_1 = require("./feature-detection.service.js");
const feature_detection_validation_js_1 = require("./feature-detection.validation.js");
function requireAuthenticatedUser(req) {
    if (!req.user) {
        throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
    }
    return req.user;
}
class FeatureDetectionController {
    detect = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = feature_detection_validation_js_1.consultationIdParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await feature_detection_service_js_1.featureDetectionService.detect(actor.organizationId, parsedParams.data.consultationId);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Features detected successfully.", result));
    });
    list = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = feature_detection_validation_js_1.consultationIdParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await feature_detection_service_js_1.featureDetectionService.list(actor.organizationId, parsedParams.data.consultationId);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Features fetched successfully.", result));
    });
    update = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = feature_detection_validation_js_1.featureIdParamsSchema.safeParse(req.params);
        const parsedBody = feature_detection_validation_js_1.updateFeatureSchema.safeParse(req.body);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        if (!parsedBody.success) {
            throw new app_error_js_1.AppError(parsedBody.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await feature_detection_service_js_1.featureDetectionService.update(actor.organizationId, parsedParams.data.featureId, parsedBody.data);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Feature updated successfully.", result));
    });
    remove = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = feature_detection_validation_js_1.featureIdParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        await feature_detection_service_js_1.featureDetectionService.remove(actor.organizationId, parsedParams.data.featureId);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Feature deleted successfully.", null));
    });
}
exports.FeatureDetectionController = FeatureDetectionController;
exports.featureDetectionController = new FeatureDetectionController();

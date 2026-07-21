"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureLibraryController = exports.FeatureLibraryController = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const api_response_js_1 = require("../../shared/responses/api-response.js");
const async_handler_js_1 = require("../../utils/async-handler.js");
const feature_library_service_js_1 = require("./feature-library.service.js");
const feature_library_validation_js_1 = require("./feature-library.validation.js");
function requireAuthenticatedUser(req) {
    if (!req.user) {
        throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
    }
    return req.user;
}
class FeatureLibraryController {
    list = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedQuery = feature_library_validation_js_1.listFeatureLibraryQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            throw new app_error_js_1.AppError(parsedQuery.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await feature_library_service_js_1.featureLibraryService.list(actor.organizationId, parsedQuery.data);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Feature library fetched successfully.", result));
    });
    getById = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = feature_library_validation_js_1.featureLibraryIdParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await feature_library_service_js_1.featureLibraryService.getById(actor.organizationId, parsedParams.data.id);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Feature library item fetched successfully.", result));
    });
    create = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedBody = feature_library_validation_js_1.createFeatureLibrarySchema.safeParse(req.body);
        if (!parsedBody.success) {
            throw new app_error_js_1.AppError(parsedBody.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await feature_library_service_js_1.featureLibraryService.create(actor.organizationId, parsedBody.data);
        res
            .status(http_status_js_1.HTTP_STATUS.CREATED)
            .json((0, api_response_js_1.successResponse)("Feature library item created successfully.", result));
    });
    update = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = feature_library_validation_js_1.featureLibraryIdParamsSchema.safeParse(req.params);
        const parsedBody = feature_library_validation_js_1.updateFeatureLibrarySchema.safeParse(req.body);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        if (!parsedBody.success) {
            throw new app_error_js_1.AppError(parsedBody.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await feature_library_service_js_1.featureLibraryService.update(actor.organizationId, parsedParams.data.id, parsedBody.data);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Feature library item updated successfully.", result));
    });
    remove = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = feature_library_validation_js_1.featureLibraryIdParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        await feature_library_service_js_1.featureLibraryService.remove(actor.organizationId, parsedParams.data.id);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Feature library item deleted successfully.", null));
    });
    match = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedBody = feature_library_validation_js_1.matchDetectedFeaturesSchema.safeParse(req.body);
        if (!parsedBody.success) {
            throw new app_error_js_1.AppError(parsedBody.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await feature_library_service_js_1.featureLibraryService.matchDetectedFeatures(actor.organizationId, parsedBody.data);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Feature matching suggestions generated.", result));
    });
}
exports.FeatureLibraryController = FeatureLibraryController;
exports.featureLibraryController = new FeatureLibraryController();

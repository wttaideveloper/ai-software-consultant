"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultationsController = exports.ConsultationsController = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const api_response_js_1 = require("../../shared/responses/api-response.js");
const async_handler_js_1 = require("../../utils/async-handler.js");
const consultations_service_js_1 = require("./consultations.service.js");
const consultations_validation_js_1 = require("./consultations.validation.js");
function requireAuthenticatedUser(req) {
    if (!req.user) {
        throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
    }
    return req.user;
}
class ConsultationsController {
    list = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedQuery = consultations_validation_js_1.listConsultationsQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            throw new app_error_js_1.AppError(parsedQuery.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await consultations_service_js_1.consultationsService.list(actor.organizationId, parsedQuery.data);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Consultations fetched successfully.", result));
    });
    getById = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = consultations_validation_js_1.consultationIdParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await consultations_service_js_1.consultationsService.getById(actor.organizationId, parsedParams.data.id);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Consultation fetched successfully.", result));
    });
    create = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedBody = consultations_validation_js_1.createConsultationSchema.safeParse(req.body);
        if (!parsedBody.success) {
            throw new app_error_js_1.AppError(parsedBody.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await consultations_service_js_1.consultationsService.create(actor.organizationId, actor.id, parsedBody.data);
        res
            .status(http_status_js_1.HTTP_STATUS.CREATED)
            .json((0, api_response_js_1.successResponse)("Consultation created successfully.", result));
    });
    update = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = consultations_validation_js_1.consultationIdParamsSchema.safeParse(req.params);
        const parsedBody = consultations_validation_js_1.updateConsultationSchema.safeParse(req.body);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        if (!parsedBody.success) {
            throw new app_error_js_1.AppError(parsedBody.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await consultations_service_js_1.consultationsService.update(actor.organizationId, parsedParams.data.id, parsedBody.data);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Consultation updated successfully.", result));
    });
    remove = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = consultations_validation_js_1.consultationIdParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        await consultations_service_js_1.consultationsService.remove(actor.organizationId, parsedParams.data.id);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Consultation deleted successfully.", null));
    });
}
exports.ConsultationsController = ConsultationsController;
exports.consultationsController = new ConsultationsController();

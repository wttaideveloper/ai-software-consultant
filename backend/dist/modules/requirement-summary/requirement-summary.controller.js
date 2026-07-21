"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirementSummaryController = exports.RequirementSummaryController = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const api_response_js_1 = require("../../shared/responses/api-response.js");
const async_handler_js_1 = require("../../utils/async-handler.js");
const requirement_summary_service_js_1 = require("./requirement-summary.service.js");
const requirement_summary_validation_js_1 = require("./requirement-summary.validation.js");
function requireAuthenticatedUser(req) {
    if (!req.user) {
        throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
    }
    return req.user;
}
class RequirementSummaryController {
    generate = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = requirement_summary_validation_js_1.requirementSummaryParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await requirement_summary_service_js_1.requirementSummaryService.generate(actor.organizationId, parsedParams.data.consultationId);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Requirement summary generated successfully.", result));
    });
    get = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = requirement_summary_validation_js_1.requirementSummaryParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await requirement_summary_service_js_1.requirementSummaryService.get(actor.organizationId, parsedParams.data.consultationId);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Requirement summary fetched successfully.", result));
    });
    update = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = requirement_summary_validation_js_1.requirementSummaryParamsSchema.safeParse(req.params);
        const parsedBody = requirement_summary_validation_js_1.updateRequirementSummarySchema.safeParse(req.body);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        if (!parsedBody.success) {
            throw new app_error_js_1.AppError(parsedBody.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await requirement_summary_service_js_1.requirementSummaryService.update(actor.organizationId, parsedParams.data.consultationId, parsedBody.data);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Requirement summary updated successfully.", result));
    });
}
exports.RequirementSummaryController = RequirementSummaryController;
exports.requirementSummaryController = new RequirementSummaryController();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proposalController = exports.ProposalController = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const api_response_js_1 = require("../../shared/responses/api-response.js");
const async_handler_js_1 = require("../../utils/async-handler.js");
const proposal_service_js_1 = require("./proposal.service.js");
const proposal_validation_js_1 = require("./proposal.validation.js");
function requireAuthenticatedUser(req) {
    if (!req.user) {
        throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
    }
    return req.user;
}
class ProposalController {
    generate = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = proposal_validation_js_1.consultationIdParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await proposal_service_js_1.proposalService.generate(actor.organizationId, parsedParams.data.consultationId);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Proposal generated successfully.", result));
    });
    get = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = proposal_validation_js_1.consultationIdParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await proposal_service_js_1.proposalService.get(actor.organizationId, parsedParams.data.consultationId);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Proposal fetched successfully.", result));
    });
    update = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = proposal_validation_js_1.consultationIdParamsSchema.safeParse(req.params);
        const parsedBody = proposal_validation_js_1.updateProposalSchema.safeParse(req.body);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        if (!parsedBody.success) {
            throw new app_error_js_1.AppError(parsedBody.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await proposal_service_js_1.proposalService.update(actor.organizationId, parsedParams.data.consultationId, parsedBody.data);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Proposal updated successfully.", result));
    });
}
exports.ProposalController = ProposalController;
exports.proposalController = new ProposalController();

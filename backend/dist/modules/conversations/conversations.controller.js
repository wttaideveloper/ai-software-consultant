"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationsController = exports.ConversationsController = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const api_response_js_1 = require("../../shared/responses/api-response.js");
const async_handler_js_1 = require("../../utils/async-handler.js");
const conversations_service_js_1 = require("./conversations.service.js");
const conversations_validation_js_1 = require("./conversations.validation.js");
function requireAuthenticatedUser(req) {
    if (!req.user) {
        throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
    }
    return req.user;
}
class ConversationsController {
    list = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = conversations_validation_js_1.consultationIdParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await conversations_service_js_1.conversationsService.listByConsultation(actor.organizationId, parsedParams.data.consultationId);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Messages fetched successfully.", result));
    });
    create = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = conversations_validation_js_1.consultationIdParamsSchema.safeParse(req.params);
        const parsedBody = conversations_validation_js_1.createMessageSchema.safeParse(req.body);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        if (!parsedBody.success) {
            throw new app_error_js_1.AppError(parsedBody.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await conversations_service_js_1.conversationsService.createUserMessage(actor.organizationId, parsedParams.data.consultationId, actor.id, parsedBody.data);
        res
            .status(http_status_js_1.HTTP_STATUS.CREATED)
            .json((0, api_response_js_1.successResponse)("Message created successfully.", result));
    });
    update = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = conversations_validation_js_1.messageIdParamsSchema.safeParse(req.params);
        const parsedBody = conversations_validation_js_1.updateMessageSchema.safeParse(req.body);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        if (!parsedBody.success) {
            throw new app_error_js_1.AppError(parsedBody.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const result = await conversations_service_js_1.conversationsService.updateUserMessage(actor.organizationId, parsedParams.data.id, parsedBody.data);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Message updated successfully.", result));
    });
    remove = (0, async_handler_js_1.asyncHandler)(async (req, res) => {
        const actor = requireAuthenticatedUser(req);
        const parsedParams = conversations_validation_js_1.messageIdParamsSchema.safeParse(req.params);
        if (!parsedParams.success) {
            throw new app_error_js_1.AppError(parsedParams.error.issues[0]?.message ?? "Validation failed", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        await conversations_service_js_1.conversationsService.remove(actor.organizationId, parsedParams.data.id);
        res
            .status(http_status_js_1.HTTP_STATUS.OK)
            .json((0, api_response_js_1.successResponse)("Message deleted successfully.", null));
    });
}
exports.ConversationsController = ConversationsController;
exports.conversationsController = new ConversationsController();

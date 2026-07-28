"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultationsService = exports.ConsultationsService = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const consultations_repository_js_1 = require("./consultations.repository.js");
function toConsultationDto(consultation) {
    return {
        id: consultation.id,
        organizationId: consultation.organizationId,
        createdBy: consultation.createdBy,
        assignedTo: consultation.assignedTo,
        title: consultation.title,
        status: consultation.status,
        industry: consultation.industry,
        projectType: consultation.projectType,
        consultationMode: consultation.consultationMode,
        budgetRange: consultation.budgetRange,
        timeline: consultation.timeline,
        startedAt: consultation.startedAt,
        completedAt: consultation.completedAt,
        createdAt: consultation.createdAt,
        updatedAt: consultation.updatedAt,
    };
}
class ConsultationsService {
    async assertAssigneeInOrganization(organizationId, assignedTo) {
        if (!assignedTo) {
            return;
        }
        const assignee = await consultations_repository_js_1.consultationsRepository.findActiveUserInOrganization(assignedTo, organizationId);
        if (!assignee) {
            throw new app_error_js_1.AppError("Assigned user was not found in this organization", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
    }
    async list(organizationId, query) {
        const filters = {
            organizationId,
            search: query.search,
            status: query.status,
            assignedTo: query.assignedTo,
            page: query.page,
            pageSize: query.pageSize,
        };
        const [total, items] = await Promise.all([
            consultations_repository_js_1.consultationsRepository.countByOrganization(filters),
            consultations_repository_js_1.consultationsRepository.findManyByOrganization(filters),
        ]);
        return {
            items: items.map(toConsultationDto),
            meta: {
                page: query.page,
                pageSize: query.pageSize,
                total,
                totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
            },
        };
    }
    async getById(organizationId, consultationId) {
        const consultation = await consultations_repository_js_1.consultationsRepository.findByIdAndOrganization(consultationId, organizationId);
        if (!consultation) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        return toConsultationDto(consultation);
    }
    async create(organizationId, createdBy, input) {
        await this.assertAssigneeInOrganization(organizationId, input.assignedTo);
        const consultation = await consultations_repository_js_1.consultationsRepository.create({
            organizationId,
            createdBy,
            assignedTo: input.assignedTo ?? null,
            title: input.title,
            status: "draft",
            industry: input.industry ?? null,
            projectType: input.projectType ?? null,
            consultationMode: input.consultationMode,
            budgetRange: input.budgetRange ?? null,
            timeline: input.timeline ?? null,
        });
        logger_js_1.logger.info(`Consultation created: ${consultation.id}`);
        return toConsultationDto(consultation);
    }
    async update(organizationId, consultationId, input) {
        const existing = await consultations_repository_js_1.consultationsRepository.findByIdAndOrganization(consultationId, organizationId);
        if (!existing) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        if (existing.status === "completed") {
            throw new app_error_js_1.AppError("Completed consultations cannot be edited", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        if (input.assignedTo !== undefined) {
            await this.assertAssigneeInOrganization(organizationId, input.assignedTo);
        }
        const nextStatus = input.status ?? existing.status;
        const startedAt = nextStatus === "in_progress" && !existing.startedAt
            ? new Date()
            : undefined;
        const completedAt = nextStatus === "completed" && !existing.completedAt
            ? new Date()
            : undefined;
        const consultation = await consultations_repository_js_1.consultationsRepository.update(consultationId, organizationId, {
            title: input.title,
            industry: input.industry,
            projectType: input.projectType,
            budgetRange: input.budgetRange,
            timeline: input.timeline,
            status: input.status,
            assignedTo: input.assignedTo,
            startedAt,
            completedAt,
        });
        logger_js_1.logger.info(`Consultation updated: ${consultation.id}`);
        return toConsultationDto(consultation);
    }
    async remove(organizationId, consultationId) {
        const existing = await consultations_repository_js_1.consultationsRepository.findByIdAndOrganization(consultationId, organizationId);
        if (!existing) {
            throw new app_error_js_1.AppError("Consultation not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        await consultations_repository_js_1.consultationsRepository.softDelete(consultationId, organizationId);
        logger_js_1.logger.info(`Consultation soft-deleted: ${consultationId}`);
    }
}
exports.ConsultationsService = ConsultationsService;
exports.consultationsService = new ConsultationsService();

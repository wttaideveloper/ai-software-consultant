"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizationService = exports.AuthorizationService = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const auth_repository_js_1 = require("./auth.repository.js");
class AuthorizationService {
    async getUserPermissionCodes(userId) {
        const roles = await auth_repository_js_1.authRepository.findRolesByUserId(userId);
        const roleIds = roles.map((role) => role.id);
        return auth_repository_js_1.authRepository.findPermissionCodesByRoleIds(roleIds);
    }
    hasAllPermissions(userPermissions, requiredPermissions) {
        if (requiredPermissions.length === 0) {
            return true;
        }
        const granted = new Set(userPermissions);
        return requiredPermissions.every((permission) => granted.has(permission));
    }
    async assertHasPermissions(userId, requiredPermissions) {
        const userPermissions = await this.getUserPermissionCodes(userId);
        const allowed = this.hasAllPermissions(userPermissions, requiredPermissions);
        if (!allowed) {
            logger_js_1.logger.warn(`Permission denied for user ${userId}. Required: ${requiredPermissions.join(", ")}`);
            throw new app_error_js_1.AppError("Forbidden", http_status_js_1.HTTP_STATUS.FORBIDDEN);
        }
    }
}
exports.AuthorizationService = AuthorizationService;
exports.authorizationService = new AuthorizationService();

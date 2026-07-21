"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = exports.UsersService = void 0;
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const password_js_1 = require("../auth/password.js");
const users_repository_js_1 = require("./users.repository.js");
function toRoleDto(role) {
    return {
        id: role.id,
        name: role.name,
        slug: role.slug,
    };
}
function toUserDto(user, roles) {
    return {
        id: user.id,
        organizationId: user.organizationId,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: roles.map(toRoleDto),
    };
}
function groupRolesByUserId(rows) {
    const map = new Map();
    for (const row of rows) {
        const current = map.get(row.userId) ?? [];
        current.push(row.role);
        map.set(row.userId, current);
    }
    return map;
}
class UsersService {
    async list(organizationId, query) {
        const filters = {
            organizationId,
            search: query.search,
            page: query.page,
            pageSize: query.pageSize,
        };
        const [total, users] = await Promise.all([
            users_repository_js_1.usersRepository.countByOrganization(filters),
            users_repository_js_1.usersRepository.findManyByOrganization(filters),
        ]);
        const roleRows = await users_repository_js_1.usersRepository.findRolesByUserIds(users.map((user) => user.id));
        const rolesByUserId = groupRolesByUserId(roleRows);
        return {
            items: users.map((user) => toUserDto(user, rolesByUserId.get(user.id) ?? [])),
            meta: {
                page: query.page,
                pageSize: query.pageSize,
                total,
                totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
            },
        };
    }
    async getById(organizationId, userId) {
        const user = await users_repository_js_1.usersRepository.findByIdAndOrganization(userId, organizationId);
        if (!user) {
            throw new app_error_js_1.AppError("User not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        const roleRows = await users_repository_js_1.usersRepository.findRolesByUserIds([user.id]);
        const roles = roleRows.map((row) => row.role);
        return toUserDto(user, roles);
    }
    async create(organizationId, actorUserId, input) {
        const existingUser = await users_repository_js_1.usersRepository.findByEmail(input.email);
        if (existingUser) {
            throw new app_error_js_1.AppError("Email is already registered", http_status_js_1.HTTP_STATUS.CONFLICT);
        }
        const roleIds = [...new Set(input.roleIds)];
        const organizationRoles = await users_repository_js_1.usersRepository.findRolesByIdsAndOrganization(roleIds, organizationId);
        if (organizationRoles.length !== roleIds.length) {
            throw new app_error_js_1.AppError("One or more roles are invalid for this organization", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
        }
        const passwordHash = await (0, password_js_1.hashPassword)(input.password);
        const user = await users_repository_js_1.usersRepository.runInTransaction(async (tx) => {
            const createdUser = await users_repository_js_1.usersRepository.create({
                organizationId,
                fullName: input.fullName,
                email: input.email,
                passwordHash,
                phone: input.phone ?? null,
                avatarUrl: input.avatarUrl ?? null,
                status: "active",
            }, tx);
            await users_repository_js_1.usersRepository.assignRoles(createdUser.id, roleIds, actorUserId, tx);
            return createdUser;
        });
        logger_js_1.logger.info(`User created: ${user.email}`);
        return toUserDto(user, organizationRoles);
    }
    async update(organizationId, actorUserId, userId, input) {
        const existingUser = await users_repository_js_1.usersRepository.findByIdAndOrganization(userId, organizationId);
        if (!existingUser) {
            throw new app_error_js_1.AppError("User not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        let roleIds = null;
        let assignedRoles = null;
        if (input.roleIds) {
            roleIds = [...new Set(input.roleIds)];
            assignedRoles = await users_repository_js_1.usersRepository.findRolesByIdsAndOrganization(roleIds, organizationId);
            if (assignedRoles.length !== roleIds.length) {
                throw new app_error_js_1.AppError("One or more roles are invalid for this organization", http_status_js_1.HTTP_STATUS.BAD_REQUEST);
            }
        }
        const updatedUser = await users_repository_js_1.usersRepository.runInTransaction(async (tx) => {
            const user = await users_repository_js_1.usersRepository.update(userId, organizationId, {
                fullName: input.fullName,
                phone: input.phone,
                avatarUrl: input.avatarUrl,
                status: input.status,
            }, tx);
            if (roleIds) {
                await users_repository_js_1.usersRepository.deleteUserRoles(userId, tx);
                await users_repository_js_1.usersRepository.assignRoles(userId, roleIds, actorUserId, tx);
            }
            return user;
        });
        const roleRows = await users_repository_js_1.usersRepository.findRolesByUserIds([userId]);
        const roles = roleRows.map((row) => row.role);
        logger_js_1.logger.info(`User updated: ${updatedUser.email}`);
        return toUserDto(updatedUser, roles);
    }
    async remove(organizationId, userId) {
        const existingUser = await users_repository_js_1.usersRepository.findByIdAndOrganization(userId, organizationId);
        if (!existingUser) {
            throw new app_error_js_1.AppError("User not found", http_status_js_1.HTTP_STATUS.NOT_FOUND);
        }
        await users_repository_js_1.usersRepository.softDelete(userId, organizationId);
        logger_js_1.logger.info(`User soft-deleted: ${existingUser.email}`);
    }
}
exports.UsersService = UsersService;
exports.usersService = new UsersService();

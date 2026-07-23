"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
exports.slugify = slugify;
const node_crypto_1 = require("node:crypto");
const env_js_1 = require("../../config/env.js");
const app_js_1 = require("../../shared/constants/app.js");
const http_status_js_1 = require("../../shared/constants/http-status.js");
const app_error_js_1 = require("../../shared/errors/app-error.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const auth_repository_js_1 = require("./auth.repository.js");
const jwt_js_1 = require("./jwt.js");
const password_js_1 = require("./password.js");
function toPublicUser(user) {
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
    };
}
function toPublicOrganization(organization) {
    return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        status: organization.status,
        billingEmail: organization.billingEmail,
        timezone: organization.timezone,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
    };
}
/** Exported for the admin bootstrap seed, which creates an organization the same way this module does. */
function slugify(value) {
    const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
    return slug.length > 0 ? slug : "organization";
}
async function createUniqueSlug(organizationName, executor) {
    const baseSlug = slugify(organizationName);
    let candidate = baseSlug;
    let suffix = 1;
    while (await auth_repository_js_1.authRepository.findOrganizationBySlug(candidate, executor)) {
        candidate = `${baseSlug}-${suffix}`;
        suffix += 1;
    }
    return candidate;
}
function hashRefreshToken(token) {
    return (0, node_crypto_1.createHash)("sha256").update(token).digest("hex");
}
function resolveRefreshTokenExpiry(expiresIn) {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + amount * (multipliers[unit] ?? multipliers.d));
}
class AuthService {
    async register(input, context) {
        const passwordHash = await (0, password_js_1.hashPassword)(input.password);
        const result = await auth_repository_js_1.authRepository.runInTransaction(async (tx) => {
            const existingUser = await auth_repository_js_1.authRepository.findUserByEmail(input.email, tx);
            if (existingUser) {
                throw new app_error_js_1.AppError("Email is already registered", http_status_js_1.HTTP_STATUS.CONFLICT);
            }
            const slug = await createUniqueSlug(input.organizationName, tx);
            const organization = await auth_repository_js_1.authRepository.createOrganization({
                name: input.organizationName,
                slug,
                plan: "free",
                status: "active",
                billingEmail: input.email.toLowerCase(),
                timezone: app_js_1.TIMEZONE,
            }, tx);
            const user = await auth_repository_js_1.authRepository.createUser({
                organizationId: organization.id,
                fullName: input.fullName,
                email: input.email,
                passwordHash,
                status: "active",
            }, tx);
            const roleCount = await auth_repository_js_1.authRepository.countOrganizationRoles(organization.id, tx);
            if (roleCount === 0) {
                const adminRole = await auth_repository_js_1.authRepository.createRole({
                    organizationId: organization.id,
                    name: "Admin",
                    slug: "admin",
                    description: "Organization administrator",
                    isSystem: true,
                }, tx);
                const permissionIds = await auth_repository_js_1.authRepository.findAllPermissionIds(tx);
                await auth_repository_js_1.authRepository.assignPermissionsToRole(adminRole.id, permissionIds, tx);
                await auth_repository_js_1.authRepository.assignRoleToUser(user.id, adminRole.id, user.id, tx);
            }
            await auth_repository_js_1.authRepository.createOrganizationSetting(organization.id, {
                key: "general",
                value: {
                    language: app_js_1.DEFAULT_LANGUAGE,
                    timezone: app_js_1.TIMEZONE,
                    onboardingCompleted: false,
                },
            }, tx);
            await auth_repository_js_1.authRepository.createUserSetting(user.id, {
                key: "preferences",
                value: {
                    language: app_js_1.DEFAULT_LANGUAGE,
                    theme: "system",
                    notificationsEnabled: true,
                },
            }, tx);
            const tokenInput = {
                sub: user.id,
                organizationId: organization.id,
                email: user.email,
            };
            const accessToken = (0, jwt_js_1.generateAccessToken)(tokenInput);
            const refreshToken = (0, jwt_js_1.generateRefreshToken)(tokenInput);
            await auth_repository_js_1.authRepository.createRefreshToken({
                userId: user.id,
                tokenHash: hashRefreshToken(refreshToken),
                expiresAt: resolveRefreshTokenExpiry(env_js_1.config.REFRESH_TOKEN_EXPIRES),
                userAgent: context.userAgent,
                ipAddress: context.ipAddress,
            }, tx);
            return {
                user: toPublicUser(user),
                organization: toPublicOrganization(organization),
                accessToken,
                refreshToken,
            };
        });
        logger_js_1.logger.info(`User registered successfully: ${result.user.email}`);
        return result;
    }
    async login(input, context) {
        const user = await auth_repository_js_1.authRepository.findUserByEmail(input.email);
        if (!user) {
            throw new app_error_js_1.AppError("Invalid email or password", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
        }
        if (user.status !== "active") {
            throw new app_error_js_1.AppError("Account is not active", http_status_js_1.HTTP_STATUS.FORBIDDEN);
        }
        const isPasswordValid = await (0, password_js_1.comparePassword)(input.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new app_error_js_1.AppError("Invalid email or password", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const organization = await auth_repository_js_1.authRepository.findOrganizationById(user.organizationId);
        if (!organization) {
            throw new app_error_js_1.AppError("Organization not found", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
        }
        const tokenInput = {
            sub: user.id,
            organizationId: organization.id,
            email: user.email,
        };
        const accessToken = (0, jwt_js_1.generateAccessToken)(tokenInput);
        const refreshToken = (0, jwt_js_1.generateRefreshToken)(tokenInput);
        const updatedUser = await auth_repository_js_1.authRepository.runInTransaction(async (tx) => {
            const loggedInUser = await auth_repository_js_1.authRepository.updateLastLoginAt(user.id, new Date(), tx);
            await auth_repository_js_1.authRepository.deleteRefreshTokensByUserId(user.id, tx);
            await auth_repository_js_1.authRepository.createRefreshToken({
                userId: user.id,
                tokenHash: hashRefreshToken(refreshToken),
                expiresAt: resolveRefreshTokenExpiry(env_js_1.config.REFRESH_TOKEN_EXPIRES),
                userAgent: context.userAgent,
                ipAddress: context.ipAddress,
            }, tx);
            return loggedInUser;
        });
        logger_js_1.logger.info(`User logged in successfully: ${updatedUser.email}`);
        return {
            user: toPublicUser(updatedUser),
            organization: toPublicOrganization(organization),
            accessToken,
            refreshToken,
        };
    }
    async getCurrentUser(userId) {
        const record = await auth_repository_js_1.authRepository.findUserWithOrganizationById(userId);
        if (!record) {
            throw new app_error_js_1.AppError("Unauthorized", http_status_js_1.HTTP_STATUS.UNAUTHORIZED);
        }
        if (record.user.status !== "active") {
            throw new app_error_js_1.AppError("Account is not active", http_status_js_1.HTTP_STATUS.FORBIDDEN);
        }
        logger_js_1.logger.debug(`Current user loaded: ${record.user.email}`);
        return {
            user: toPublicUser(record.user),
            organization: toPublicOrganization(record.organization),
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();

import { createHash } from "node:crypto";
import { config } from "../../config/env.js";
import type { DbExecutor } from "../../db/index.js";
import { DEFAULT_LANGUAGE, TIMEZONE } from "../../shared/constants/app.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import {
  authRepository,
  type OrganizationRecord,
  type UserRecord,
} from "./auth.repository.js";
import type { RegisterInput } from "./auth.validation.js";
import type { LoginInput } from "./login.validation.js";
import type { RefreshInput } from "./refresh.validation.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "./jwt.js";
import { comparePassword, hashPassword } from "./password.js";

export type PublicUser = {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  status: string;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicOrganization = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  billingEmail: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthSessionResult = {
  user: PublicUser;
  organization: PublicOrganization;
  accessToken: string;
  refreshToken: string;
};

export type RegisterResult = AuthSessionResult;
export type LoginResult = AuthSessionResult;
export type RefreshResult = AuthSessionResult;

export type CurrentUserResult = {
  user: PublicUser;
  organization: PublicOrganization;
};

export type AuthRequestContext = {
  userAgent: string | null;
  ipAddress: string | null;
};

export type RegisterContext = AuthRequestContext;
export type LoginContext = AuthRequestContext;
export type RefreshContext = AuthRequestContext;

function toPublicUser(user: UserRecord): PublicUser {
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

function toPublicOrganization(
  organization: OrganizationRecord,
): PublicOrganization {
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
export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug.length > 0 ? slug : "organization";
}

async function createUniqueSlug(
  organizationName: string,
  executor: DbExecutor,
): Promise<string> {
  const baseSlug = slugify(organizationName);
  let candidate = baseSlug;
  let suffix = 1;

  while (await authRepository.findOrganizationBySlug(candidate, executor)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function resolveRefreshTokenExpiry(expiresIn: string): Date {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);

  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + amount * (multipliers[unit] ?? multipliers.d));
}

export class AuthService {
  async register(
    input: RegisterInput,
    context: RegisterContext,
  ): Promise<RegisterResult> {
    const passwordHash = await hashPassword(input.password);

    const result = await authRepository.runInTransaction(async (tx) => {
      const existingUser = await authRepository.findUserByEmail(
        input.email,
        tx,
      );

      if (existingUser) {
        throw new AppError(
          "Email is already registered",
          HTTP_STATUS.CONFLICT,
        );
      }

      const slug = await createUniqueSlug(input.organizationName, tx);

      const organization = await authRepository.createOrganization(
        {
          name: input.organizationName,
          slug,
          plan: "free",
          status: "active",
          billingEmail: input.email.toLowerCase(),
          timezone: TIMEZONE,
        },
        tx,
      );

      const user = await authRepository.createUser(
        {
          organizationId: organization.id,
          fullName: input.fullName,
          email: input.email,
          passwordHash,
          status: "active",
        },
        tx,
      );

      const roleCount = await authRepository.countOrganizationRoles(
        organization.id,
        tx,
      );

      if (roleCount === 0) {
        const adminRole = await authRepository.createRole(
          {
            organizationId: organization.id,
            name: "Admin",
            slug: "admin",
            description: "Organization administrator",
            isSystem: true,
          },
          tx,
        );

        const permissionIds = await authRepository.findAllPermissionIds(tx);
        await authRepository.assignPermissionsToRole(
          adminRole.id,
          permissionIds,
          tx,
        );

        await authRepository.assignRoleToUser(
          user.id,
          adminRole.id,
          user.id,
          tx,
        );
      }

      await authRepository.createOrganizationSetting(
        organization.id,
        {
          key: "general",
          value: {
            language: DEFAULT_LANGUAGE,
            timezone: TIMEZONE,
            onboardingCompleted: false,
          },
        },
        tx,
      );

      await authRepository.createUserSetting(
        user.id,
        {
          key: "preferences",
          value: {
            language: DEFAULT_LANGUAGE,
            theme: "system",
            notificationsEnabled: true,
          },
        },
        tx,
      );

      const tokenInput = {
        sub: user.id,
        organizationId: organization.id,
        email: user.email,
      };

      const accessToken = generateAccessToken(tokenInput);
      const refreshToken = generateRefreshToken(tokenInput);

      await authRepository.createRefreshToken(
        {
          userId: user.id,
          tokenHash: hashRefreshToken(refreshToken),
          expiresAt: resolveRefreshTokenExpiry(config.REFRESH_TOKEN_EXPIRES),
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
        },
        tx,
      );

      return {
        user: toPublicUser(user),
        organization: toPublicOrganization(organization),
        accessToken,
        refreshToken,
      };
    });

    logger.info(`User registered successfully: ${result.user.email}`);

    return result;
  }

  async login(
    input: LoginInput,
    context: LoginContext,
  ): Promise<LoginResult> {
    const user = await authRepository.findUserByEmail(input.email);

    if (!user) {
      throw new AppError(
        "Invalid email or password",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    if (user.status !== "active") {
      throw new AppError("Account is not active", HTTP_STATUS.FORBIDDEN);
    }

    const isPasswordValid = await comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new AppError(
        "Invalid email or password",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const organization = await authRepository.findOrganizationById(
      user.organizationId,
    );

    if (!organization) {
      throw new AppError(
        "Organization not found",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const tokenInput = {
      sub: user.id,
      organizationId: organization.id,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenInput);
    const refreshToken = generateRefreshToken(tokenInput);

    const updatedUser = await authRepository.runInTransaction(async (tx) => {
      const loggedInUser = await authRepository.updateLastLoginAt(
        user.id,
        new Date(),
        tx,
      );

      await authRepository.deleteRefreshTokensByUserId(user.id, tx);

      await authRepository.createRefreshToken(
        {
          userId: user.id,
          tokenHash: hashRefreshToken(refreshToken),
          expiresAt: resolveRefreshTokenExpiry(config.REFRESH_TOKEN_EXPIRES),
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
        },
        tx,
      );

      return loggedInUser;
    });

    logger.info(`User logged in successfully: ${updatedUser.email}`);

    return {
      user: toPublicUser(updatedUser),
      organization: toPublicOrganization(organization),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Exchanges a valid refresh token for a brand-new token pair.
   *
   * Deliberately unauthenticated: the caller reaches here precisely *because*
   * its access token has expired, so requiring one would be circular.
   *
   * The refresh token is rotated on every use — the presented one is deleted and
   * a replacement issued in the same transaction. That preserves login's "one
   * valid refresh token per user at a time" invariant and means a captured token
   * is single-use: replaying it after the real client has refreshed hits the
   * `findRefreshTokenByHash` miss below and is rejected.
   *
   * Every failure is a flat 401 with the same message. The client's only correct
   * reaction to any of them is identical (log in again), and distinguishing
   * "expired" from "revoked" from "unknown user" only helps someone probing.
   */
  async refreshSession(
    input: RefreshInput,
    context: RefreshContext,
  ): Promise<RefreshResult> {
    const invalidSession = () =>
      new AppError("Session expired. Please log in again.", HTTP_STATUS.UNAUTHORIZED);

    let claims;
    try {
      claims = verifyRefreshToken(input.refreshToken);
    } catch {
      throw invalidSession();
    }

    // Signature alone is not enough: the token must still be the one on record,
    // which is what makes logout-by-rotation and "newer login wins" actually bite.
    const stored = await authRepository.findRefreshTokenByHash(
      hashRefreshToken(input.refreshToken),
    );

    if (!stored || stored.revokedAt !== null || stored.expiresAt.getTime() <= Date.now()) {
      throw invalidSession();
    }

    if (stored.userId !== claims.sub) {
      throw invalidSession();
    }

    const record = await authRepository.findUserWithOrganizationById(claims.sub);

    if (!record || record.user.status !== "active") {
      throw invalidSession();
    }

    const tokenInput = {
      sub: record.user.id,
      organizationId: record.organization.id,
      email: record.user.email,
    };

    const accessToken = generateAccessToken(tokenInput);
    const refreshToken = generateRefreshToken(tokenInput);

    await authRepository.runInTransaction(async (tx) => {
      await authRepository.deleteRefreshTokensByUserId(record.user.id, tx);

      await authRepository.createRefreshToken(
        {
          userId: record.user.id,
          tokenHash: hashRefreshToken(refreshToken),
          expiresAt: resolveRefreshTokenExpiry(config.REFRESH_TOKEN_EXPIRES),
          userAgent: context.userAgent,
          ipAddress: context.ipAddress,
        },
        tx,
      );
    });

    logger.debug(`Session refreshed for user: ${record.user.email}`);

    return {
      user: toPublicUser(record.user),
      organization: toPublicOrganization(record.organization),
      accessToken,
      refreshToken,
    };
  }

  async getCurrentUser(userId: string): Promise<CurrentUserResult> {
    const record = await authRepository.findUserWithOrganizationById(userId);

    if (!record) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    if (record.user.status !== "active") {
      throw new AppError("Account is not active", HTTP_STATUS.FORBIDDEN);
    }

    logger.debug(`Current user loaded: ${record.user.email}`);

    return {
      user: toPublicUser(record.user),
      organization: toPublicOrganization(record.organization),
    };
  }
}

export const authService = new AuthService();

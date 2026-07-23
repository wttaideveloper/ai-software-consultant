import "dotenv/config";
import { and, asc, eq, isNull } from "drizzle-orm";
import { config } from "../../config/env.js";
import { slugify } from "../../modules/auth/auth.service.js";
import { registerSchema } from "../../modules/auth/auth.validation.js";
import { hashPassword } from "../../modules/auth/password.js";
import {
  APP_NAME,
  DEFAULT_LANGUAGE,
  TIMEZONE,
} from "../../shared/constants/app.js";
import { logger } from "../../shared/logger/logger.js";
import { db, pool, type DbExecutor } from "../index.js";
import {
  organizationSettings,
  organizations,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  userSettings,
  users,
} from "../schema/index.js";
import { seedPermissions } from "./permissions.seed.js";

/**
 * Bootstraps the single administrator account.
 *
 * Public self-registration is disabled (see auth.route.ts), so this seed is the
 * only way the first login account comes into existence. It runs on every boot
 * and on demand via `npm run db:seed:admin`; both paths are idempotent.
 *
 * Idempotency key: DEFAULT_ADMIN_EMAIL. If a non-deleted user already holds that
 * address, the seed does nothing at all — it never rewrites a password, never
 * reactivates a disabled account, and never re-grants a role that an admin may
 * have deliberately changed. Changing the env var to a new address is therefore
 * how you deliberately provision a second bootstrap admin.
 *
 * Nothing here alters the database schema; it only inserts rows using the same
 * tables and defaults the registration flow already used.
 */

/**
 * There is no "Super Admin" role in this schema — roles are org-scoped, and the
 * full-permission role the app has always created is `admin` ("Admin",
 * isSystem: true, every permission granted). That is the role assigned here, so
 * the bootstrap admin is identical to what registration used to produce.
 */
const ADMIN_ROLE_SLUG = "admin";
const ADMIN_ROLE_NAME = "Admin";

/**
 * Reuses the (retained but no longer routed) registration policy instead of
 * restating it, so the env-provided credentials must clear exactly the same bar
 * a registered account did — including the password complexity rules.
 */
const adminCredentialsSchema = registerSchema.pick({
  fullName: true,
  email: true,
  password: true,
});

async function findExistingAdmin(
  email: string,
  executor: DbExecutor = db,
): Promise<{ id: string; status: string } | null> {
  const [user] = await executor
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  return user ?? null;
}

/**
 * Attaches the admin to the existing tenant when there is one — this platform is
 * internal and single-tenant now, so a second organization would silently split
 * the data. An organization is only created when the database has none.
 */
async function resolveOrganization(executor: DbExecutor) {
  const [existing] = await executor
    .select()
    .from(organizations)
    .where(isNull(organizations.deletedAt))
    .orderBy(asc(organizations.createdAt))
    .limit(1);

  if (existing) {
    return existing;
  }

  const name = config.DEFAULT_ADMIN_ORGANIZATION.trim() || APP_NAME;

  // Safe to use the bare slug: this branch only runs on an empty organizations
  // table, so there is nothing for it to collide with.
  const [created] = await executor
    .insert(organizations)
    .values({
      name,
      slug: slugify(name),
      plan: "free",
      status: "active",
      billingEmail: config.DEFAULT_ADMIN_EMAIL.trim().toLowerCase(),
      timezone: TIMEZONE,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create the bootstrap organization");
  }

  await executor
    .insert(organizationSettings)
    .values({
      organizationId: created.id,
      key: "general",
      value: {
        language: DEFAULT_LANGUAGE,
        timezone: TIMEZONE,
        onboardingCompleted: false,
      },
    })
    .onConflictDoNothing({
      target: [organizationSettings.organizationId, organizationSettings.key],
    });

  logger.info(`Bootstrap organization created: ${created.name}`);

  return created;
}

async function resolveAdminRole(organizationId: string, executor: DbExecutor) {
  const [existing] = await executor
    .select()
    .from(roles)
    .where(
      and(
        eq(roles.organizationId, organizationId),
        eq(roles.slug, ADMIN_ROLE_SLUG),
      ),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await executor
    .insert(roles)
    .values({
      organizationId,
      name: ADMIN_ROLE_NAME,
      slug: ADMIN_ROLE_SLUG,
      description: "Organization administrator",
      isSystem: true,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create the Admin role");
  }

  const permissionIds = await executor
    .select({ id: permissions.id })
    .from(permissions);

  if (permissionIds.length > 0) {
    await executor
      .insert(rolePermissions)
      .values(
        permissionIds.map((permission) => ({
          roleId: created.id,
          permissionId: permission.id,
        })),
      )
      .onConflictDoNothing({
        target: [rolePermissions.roleId, rolePermissions.permissionId],
      });
  }

  logger.info(
    `Admin role created for organization ${organizationId} with ${permissionIds.length} permissions`,
  );

  return created;
}

export async function ensureDefaultAdmin(): Promise<void> {
  const email = config.DEFAULT_ADMIN_EMAIL.trim().toLowerCase();
  const password = config.DEFAULT_ADMIN_PASSWORD;
  const fullName = config.DEFAULT_ADMIN_NAME.trim();

  if (!email || !password) {
    logger.warn(
      "Admin bootstrap skipped: DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD are not both set. " +
        "No account was created — set them in backend/.env (see .env.example) and restart, " +
        "or run `npm run db:seed:admin`.",
    );
    return;
  }

  const parsed = adminCredentialsSchema.safeParse({ fullName, email, password });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    logger.error(
      `Admin bootstrap skipped: invalid DEFAULT_ADMIN_* configuration — ` +
        `${issue?.path.join(".") ?? "value"}: ${issue?.message ?? "validation failed"}`,
    );
    return;
  }

  const existing = await findExistingAdmin(email);

  if (existing) {
    logger.info(
      `Admin bootstrap skipped: ${email} already exists (status=${existing.status}).`,
    );
    return;
  }

  // Guarantees the permission catalogue exists before a role is granted "all"
  // permissions — otherwise a first boot would produce an Admin role with none.
  await seedPermissions();

  const passwordHash = await hashPassword(parsed.data.password);

  await db.transaction(async (tx) => {
    const organization = await resolveOrganization(tx);
    const adminRole = await resolveAdminRole(organization.id, tx);

    const [user] = await tx
      .insert(users)
      .values({
        organizationId: organization.id,
        fullName: parsed.data.fullName,
        email,
        passwordHash,
        status: "active",
      })
      .returning();

    if (!user) {
      throw new Error("Failed to create the default admin user");
    }

    await tx
      .insert(userRoles)
      .values({ userId: user.id, roleId: adminRole.id, assignedBy: user.id })
      .onConflictDoNothing({ target: [userRoles.userId, userRoles.roleId] });

    await tx
      .insert(userSettings)
      .values({
        userId: user.id,
        key: "preferences",
        value: {
          language: DEFAULT_LANGUAGE,
          theme: "system",
          notificationsEnabled: true,
        },
      })
      .onConflictDoNothing({
        target: [userSettings.userId, userSettings.key],
      });

    logger.info(
      `Default admin created: ${email} (organization=${organization.slug}, role=${ADMIN_ROLE_SLUG})`,
    );
  });
}

async function run(): Promise<void> {
  try {
    await ensureDefaultAdmin();
    logger.info("Admin bootstrap finished successfully");
  } finally {
    await pool.end();
  }
}

const entrypoint = process.argv[1] ?? "";
const isDirectRun =
  entrypoint.endsWith("admin.seed.ts") || entrypoint.endsWith("admin.seed.js");

if (isDirectRun) {
  void run().catch((error: unknown) => {
    logger.error(
      error instanceof Error ? error.message : "Admin bootstrap failed",
    );
    process.exitCode = 1;
  });
}

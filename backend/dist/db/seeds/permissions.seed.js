"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPermissions = seedPermissions;
require("dotenv/config");
const drizzle_orm_1 = require("drizzle-orm");
const permissions_constants_js_1 = require("../../modules/auth/permissions.constants.js");
const logger_js_1 = require("../../shared/logger/logger.js");
const index_js_1 = require("../index.js");
const index_js_2 = require("../schema/index.js");
async function seedPermissions() {
    await index_js_1.db.transaction(async (tx) => {
        await tx
            .insert(index_js_2.permissions)
            .values(permissions_constants_js_1.SYSTEM_PERMISSION_DEFINITIONS.map((permission) => ({
            code: permission.code,
            module: permission.module,
            description: permission.description,
        })))
            .onConflictDoNothing({ target: index_js_2.permissions.code });
        const allPermissions = await tx.select().from(index_js_2.permissions);
        const permissionIds = allPermissions.map((permission) => permission.id);
        if (permissionIds.length === 0) {
            logger_js_1.logger.warn("No permissions available to assign to Admin roles");
            return;
        }
        const adminRoles = await tx
            .select()
            .from(index_js_2.roles)
            .where((0, drizzle_orm_1.eq)(index_js_2.roles.slug, "admin"));
        for (const adminRole of adminRoles) {
            await tx
                .insert(index_js_2.rolePermissions)
                .values(permissionIds.map((permissionId) => ({
                roleId: adminRole.id,
                permissionId,
            })))
                .onConflictDoNothing({
                target: [index_js_2.rolePermissions.roleId, index_js_2.rolePermissions.permissionId],
            });
        }
        logger_js_1.logger.info(`Permissions seed complete. permissions=${allPermissions.length}, adminRolesUpdated=${adminRoles.length}`);
    });
}
async function run() {
    try {
        await seedPermissions();
        logger_js_1.logger.info("Permission bootstrap finished successfully");
    }
    finally {
        await index_js_1.pool.end();
    }
}
const entrypoint = process.argv[1] ?? "";
const isDirectRun = entrypoint.endsWith("permissions.seed.ts") ||
    entrypoint.endsWith("permissions.seed.js");
if (isDirectRun) {
    void run().catch((error) => {
        logger_js_1.logger.error(error instanceof Error
            ? error.message
            : "Permission bootstrap failed");
        process.exitCode = 1;
    });
}

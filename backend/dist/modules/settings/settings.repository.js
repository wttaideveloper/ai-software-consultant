"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRepository = exports.SettingsRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_js_1 = require("../../db/index.js");
const index_js_2 = require("../../db/schema/index.js");
class SettingsRepository {
    async runInTransaction(callback) {
        return index_js_1.db.transaction(async (tx) => callback(tx));
    }
    async findOrganizationSetting(organizationId, key, executor = index_js_1.db) {
        const [setting] = await executor
            .select()
            .from(index_js_2.organizationSettings)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.organizationSettings.organizationId, organizationId), (0, drizzle_orm_1.eq)(index_js_2.organizationSettings.key, key)))
            .limit(1);
        return setting ?? null;
    }
    async upsertOrganizationSetting(organizationId, key, value, executor = index_js_1.db) {
        const [setting] = await executor
            .insert(index_js_2.organizationSettings)
            .values({ organizationId, key, value })
            .onConflictDoUpdate({
            target: [index_js_2.organizationSettings.organizationId, index_js_2.organizationSettings.key],
            set: { value, updatedAt: new Date() },
        })
            .returning();
        if (!setting) {
            throw new Error("Failed to save organization setting");
        }
        return setting;
    }
    async findUserSetting(userId, key, executor = index_js_1.db) {
        const [setting] = await executor
            .select()
            .from(index_js_2.userSettings)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.userSettings.userId, userId), (0, drizzle_orm_1.eq)(index_js_2.userSettings.key, key)))
            .limit(1);
        return setting ?? null;
    }
    async upsertUserSetting(userId, key, value, executor = index_js_1.db) {
        const [setting] = await executor
            .insert(index_js_2.userSettings)
            .values({ userId, key, value })
            .onConflictDoUpdate({
            target: [index_js_2.userSettings.userId, index_js_2.userSettings.key],
            set: { value, updatedAt: new Date() },
        })
            .returning();
        if (!setting) {
            throw new Error("Failed to save user setting");
        }
        return setting;
    }
}
exports.SettingsRepository = SettingsRepository;
exports.settingsRepository = new SettingsRepository();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = exports.SettingsService = void 0;
const logger_js_1 = require("../../shared/logger/logger.js");
const settings_constants_js_1 = require("./settings.constants.js");
const settings_repository_js_1 = require("./settings.repository.js");
function mergeOrganizationSettings(stored) {
    return {
        ...settings_constants_js_1.DEFAULT_ORGANIZATION_SETTINGS,
        ...stored,
    };
}
function mergeUserSettings(stored) {
    return {
        ...settings_constants_js_1.DEFAULT_USER_SETTINGS,
        ...stored,
    };
}
class SettingsService {
    async getOrganizationSettings(organizationId) {
        const setting = await settings_repository_js_1.settingsRepository.findOrganizationSetting(organizationId, settings_constants_js_1.SETTINGS_KEYS.ORGANIZATION_GENERAL);
        return mergeOrganizationSettings(setting?.value);
    }
    async updateOrganizationSettings(organizationId, input) {
        const updated = await settings_repository_js_1.settingsRepository.runInTransaction(async (tx) => {
            const existing = await settings_repository_js_1.settingsRepository.findOrganizationSetting(organizationId, settings_constants_js_1.SETTINGS_KEYS.ORGANIZATION_GENERAL, tx);
            const mergedValue = {
                ...settings_constants_js_1.DEFAULT_ORGANIZATION_SETTINGS,
                ...existing?.value,
                ...input,
            };
            return settings_repository_js_1.settingsRepository.upsertOrganizationSetting(organizationId, settings_constants_js_1.SETTINGS_KEYS.ORGANIZATION_GENERAL, mergedValue, tx);
        });
        logger_js_1.logger.info(`Organization settings updated: ${organizationId}`);
        return mergeOrganizationSettings(updated.value);
    }
    async getUserSettings(userId) {
        const setting = await settings_repository_js_1.settingsRepository.findUserSetting(userId, settings_constants_js_1.SETTINGS_KEYS.USER_PREFERENCES);
        return mergeUserSettings(setting?.value);
    }
    async updateUserSettings(userId, input) {
        const updated = await settings_repository_js_1.settingsRepository.runInTransaction(async (tx) => {
            const existing = await settings_repository_js_1.settingsRepository.findUserSetting(userId, settings_constants_js_1.SETTINGS_KEYS.USER_PREFERENCES, tx);
            const mergedValue = {
                ...settings_constants_js_1.DEFAULT_USER_SETTINGS,
                ...existing?.value,
                ...input,
            };
            return settings_repository_js_1.settingsRepository.upsertUserSetting(userId, settings_constants_js_1.SETTINGS_KEYS.USER_PREFERENCES, mergedValue, tx);
        });
        logger_js_1.logger.info(`User settings updated: ${userId}`);
        return mergeUserSettings(updated.value);
    }
}
exports.SettingsService = SettingsService;
exports.settingsService = new SettingsService();

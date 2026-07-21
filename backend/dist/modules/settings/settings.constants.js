"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_USER_SETTINGS = exports.DEFAULT_ORGANIZATION_SETTINGS = exports.SETTINGS_KEYS = void 0;
const app_js_1 = require("../../shared/constants/app.js");
// Matches the keys/values already written once at registration in
// auth.service.ts / auth.repository.ts — this module reads and updates
// exactly those rows, it does not introduce new ones.
exports.SETTINGS_KEYS = {
    ORGANIZATION_GENERAL: "general",
    USER_PREFERENCES: "preferences",
};
exports.DEFAULT_ORGANIZATION_SETTINGS = {
    language: app_js_1.DEFAULT_LANGUAGE,
    timezone: app_js_1.TIMEZONE,
    onboardingCompleted: false,
};
exports.DEFAULT_USER_SETTINGS = {
    language: app_js_1.DEFAULT_LANGUAGE,
    theme: "system",
    notificationsEnabled: true,
};

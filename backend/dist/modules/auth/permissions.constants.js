"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_PERMISSION_DEFINITIONS = exports.PERMISSIONS = void 0;
exports.PERMISSIONS = {
    USER_READ: "USER_READ",
    USER_CREATE: "USER_CREATE",
    USER_UPDATE: "USER_UPDATE",
    USER_DELETE: "USER_DELETE",
    ROLE_READ: "ROLE_READ",
    ROLE_CREATE: "ROLE_CREATE",
    ROLE_UPDATE: "ROLE_UPDATE",
    ROLE_DELETE: "ROLE_DELETE",
    PERMISSION_READ: "PERMISSION_READ",
    CONSULTATION_CREATE: "CONSULTATION_CREATE",
    CONSULTATION_READ: "CONSULTATION_READ",
    CONSULTATION_UPDATE: "CONSULTATION_UPDATE",
    CONSULTATION_DELETE: "CONSULTATION_DELETE",
    FEATURE_LIBRARY_READ: "FEATURE_LIBRARY_READ",
    FEATURE_LIBRARY_MANAGE: "FEATURE_LIBRARY_MANAGE",
    PROPOSAL_CREATE: "PROPOSAL_CREATE",
    PROPOSAL_READ: "PROPOSAL_READ",
    PROPOSAL_UPDATE: "PROPOSAL_UPDATE",
    PROPOSAL_DELETE: "PROPOSAL_DELETE",
    CRM_READ: "CRM_READ",
    CRM_CREATE: "CRM_CREATE",
    CRM_UPDATE: "CRM_UPDATE",
    SETTINGS_READ: "SETTINGS_READ",
    SETTINGS_UPDATE: "SETTINGS_UPDATE",
    /**
     * Separate from SETTINGS_* on purpose: the rate card is what the company
     * charges, so viewing a quote's basis and being able to change pricing are
     * different privileges.
     */
    COST_SETTINGS_VIEW: "COST_SETTINGS_VIEW",
    COST_SETTINGS_EDIT: "COST_SETTINGS_EDIT",
    DASHBOARD_VIEW: "DASHBOARD_VIEW",
};
exports.SYSTEM_PERMISSION_DEFINITIONS = [
    {
        code: exports.PERMISSIONS.USER_READ,
        module: "users",
        description: "View organization users",
    },
    {
        code: exports.PERMISSIONS.USER_CREATE,
        module: "users",
        description: "Create organization users",
    },
    {
        code: exports.PERMISSIONS.USER_UPDATE,
        module: "users",
        description: "Update organization users",
    },
    {
        code: exports.PERMISSIONS.USER_DELETE,
        module: "users",
        description: "Delete organization users",
    },
    {
        code: exports.PERMISSIONS.ROLE_READ,
        module: "roles",
        description: "View roles",
    },
    {
        code: exports.PERMISSIONS.ROLE_CREATE,
        module: "roles",
        description: "Create roles",
    },
    {
        code: exports.PERMISSIONS.ROLE_UPDATE,
        module: "roles",
        description: "Update roles",
    },
    {
        code: exports.PERMISSIONS.ROLE_DELETE,
        module: "roles",
        description: "Delete roles",
    },
    {
        code: exports.PERMISSIONS.PERMISSION_READ,
        module: "permissions",
        description: "View permissions",
    },
    {
        code: exports.PERMISSIONS.CONSULTATION_CREATE,
        module: "consultation",
        description: "Create consultations",
    },
    {
        code: exports.PERMISSIONS.CONSULTATION_READ,
        module: "consultation",
        description: "View consultations",
    },
    {
        code: exports.PERMISSIONS.CONSULTATION_UPDATE,
        module: "consultation",
        description: "Update consultations",
    },
    {
        code: exports.PERMISSIONS.CONSULTATION_DELETE,
        module: "consultation",
        description: "Delete consultations",
    },
    {
        code: exports.PERMISSIONS.FEATURE_LIBRARY_READ,
        module: "feature-library",
        description: "View feature library",
    },
    {
        code: exports.PERMISSIONS.FEATURE_LIBRARY_MANAGE,
        module: "feature-library",
        description: "Manage feature library",
    },
    {
        code: exports.PERMISSIONS.PROPOSAL_CREATE,
        module: "proposal",
        description: "Create proposals",
    },
    {
        code: exports.PERMISSIONS.PROPOSAL_READ,
        module: "proposal",
        description: "View proposals",
    },
    {
        code: exports.PERMISSIONS.PROPOSAL_UPDATE,
        module: "proposal",
        description: "Update proposals",
    },
    {
        code: exports.PERMISSIONS.PROPOSAL_DELETE,
        module: "proposal",
        description: "Delete draft proposals",
    },
    {
        code: exports.PERMISSIONS.CRM_READ,
        module: "crm",
        description: "View CRM records",
    },
    {
        code: exports.PERMISSIONS.CRM_CREATE,
        module: "crm",
        description: "Create CRM records",
    },
    {
        code: exports.PERMISSIONS.CRM_UPDATE,
        module: "crm",
        description: "Update CRM records",
    },
    {
        code: exports.PERMISSIONS.SETTINGS_READ,
        module: "settings",
        description: "View settings",
    },
    {
        code: exports.PERMISSIONS.SETTINGS_UPDATE,
        module: "settings",
        description: "Update settings",
    },
    {
        code: exports.PERMISSIONS.COST_SETTINGS_VIEW,
        module: "cost-settings",
        description: "View pricing rates and multipliers",
    },
    {
        code: exports.PERMISSIONS.COST_SETTINGS_EDIT,
        module: "cost-settings",
        description: "Edit pricing rates and multipliers",
    },
    {
        code: exports.PERMISSIONS.DASHBOARD_VIEW,
        module: "dashboard",
        description: "View dashboard",
    },
];

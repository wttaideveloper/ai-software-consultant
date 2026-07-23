export const PERMISSIONS = {
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

  DASHBOARD_VIEW: "DASHBOARD_VIEW",
} as const;

export type PermissionCode =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type SystemPermissionDefinition = {
  code: PermissionCode;
  module: string;
  description: string;
};

export const SYSTEM_PERMISSION_DEFINITIONS: readonly SystemPermissionDefinition[] =
  [
    {
      code: PERMISSIONS.USER_READ,
      module: "users",
      description: "View organization users",
    },
    {
      code: PERMISSIONS.USER_CREATE,
      module: "users",
      description: "Create organization users",
    },
    {
      code: PERMISSIONS.USER_UPDATE,
      module: "users",
      description: "Update organization users",
    },
    {
      code: PERMISSIONS.USER_DELETE,
      module: "users",
      description: "Delete organization users",
    },
    {
      code: PERMISSIONS.ROLE_READ,
      module: "roles",
      description: "View roles",
    },
    {
      code: PERMISSIONS.ROLE_CREATE,
      module: "roles",
      description: "Create roles",
    },
    {
      code: PERMISSIONS.ROLE_UPDATE,
      module: "roles",
      description: "Update roles",
    },
    {
      code: PERMISSIONS.ROLE_DELETE,
      module: "roles",
      description: "Delete roles",
    },
    {
      code: PERMISSIONS.PERMISSION_READ,
      module: "permissions",
      description: "View permissions",
    },
    {
      code: PERMISSIONS.CONSULTATION_CREATE,
      module: "consultation",
      description: "Create consultations",
    },
    {
      code: PERMISSIONS.CONSULTATION_READ,
      module: "consultation",
      description: "View consultations",
    },
    {
      code: PERMISSIONS.CONSULTATION_UPDATE,
      module: "consultation",
      description: "Update consultations",
    },
    {
      code: PERMISSIONS.CONSULTATION_DELETE,
      module: "consultation",
      description: "Delete consultations",
    },
    {
      code: PERMISSIONS.FEATURE_LIBRARY_READ,
      module: "feature-library",
      description: "View feature library",
    },
    {
      code: PERMISSIONS.FEATURE_LIBRARY_MANAGE,
      module: "feature-library",
      description: "Manage feature library",
    },
    {
      code: PERMISSIONS.PROPOSAL_CREATE,
      module: "proposal",
      description: "Create proposals",
    },
    {
      code: PERMISSIONS.PROPOSAL_READ,
      module: "proposal",
      description: "View proposals",
    },
    {
      code: PERMISSIONS.PROPOSAL_UPDATE,
      module: "proposal",
      description: "Update proposals",
    },
    {
      code: PERMISSIONS.PROPOSAL_DELETE,
      module: "proposal",
      description: "Delete draft proposals",
    },
    {
      code: PERMISSIONS.CRM_READ,
      module: "crm",
      description: "View CRM records",
    },
    {
      code: PERMISSIONS.CRM_CREATE,
      module: "crm",
      description: "Create CRM records",
    },
    {
      code: PERMISSIONS.CRM_UPDATE,
      module: "crm",
      description: "Update CRM records",
    },
    {
      code: PERMISSIONS.SETTINGS_READ,
      module: "settings",
      description: "View settings",
    },
    {
      code: PERMISSIONS.SETTINGS_UPDATE,
      module: "settings",
      description: "Update settings",
    },
    {
      code: PERMISSIONS.DASHBOARD_VIEW,
      module: "dashboard",
      description: "View dashboard",
    },
  ] as const;

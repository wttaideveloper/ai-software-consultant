"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureLibraryRelations = exports.projectProposalsRelations = exports.projectEstimationsRelations = exports.detectedFeaturesRelations = exports.requirementSummariesRelations = exports.aiGenerationsRelations = exports.conversationMessagesRelations = exports.consultationsRelations = exports.auditLogsRelations = exports.userSettingsRelations = exports.organizationSettingsRelations = exports.verificationTokensRelations = exports.refreshTokensRelations = exports.userRolesRelations = exports.rolePermissionsRelations = exports.permissionsRelations = exports.rolesRelations = exports.usersRelations = exports.organizationsRelations = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const ai_generations_js_1 = require("./ai-generations.js");
const audit_logs_js_1 = require("./audit-logs.js");
const consultations_js_1 = require("./consultations.js");
const conversation_messages_js_1 = require("./conversation-messages.js");
const detected_features_js_1 = require("./detected-features.js");
const feature_library_js_1 = require("./feature-library.js");
const organization_settings_js_1 = require("./organization-settings.js");
const organizations_js_1 = require("./organizations.js");
const permissions_js_1 = require("./permissions.js");
const project_estimations_js_1 = require("./project-estimations.js");
const project_proposals_js_1 = require("./project-proposals.js");
const refresh_tokens_js_1 = require("./refresh-tokens.js");
const requirement_summaries_js_1 = require("./requirement-summaries.js");
const role_permissions_js_1 = require("./role-permissions.js");
const roles_js_1 = require("./roles.js");
const user_roles_js_1 = require("./user-roles.js");
const user_settings_js_1 = require("./user-settings.js");
const users_js_1 = require("./users.js");
const verification_tokens_js_1 = require("./verification-tokens.js");
exports.organizationsRelations = (0, drizzle_orm_1.relations)(organizations_js_1.organizations, ({ many }) => ({
    users: many(users_js_1.users),
    roles: many(roles_js_1.roles),
    settings: many(organization_settings_js_1.organizationSettings),
    auditLogs: many(audit_logs_js_1.auditLogs),
    consultations: many(consultations_js_1.consultations),
    conversationMessages: many(conversation_messages_js_1.conversationMessages),
    aiGenerations: many(ai_generations_js_1.aiGenerations),
    requirementSummaries: many(requirement_summaries_js_1.requirementSummaries),
    detectedFeatures: many(detected_features_js_1.detectedFeatures),
    projectEstimations: many(project_estimations_js_1.projectEstimations),
    projectProposals: many(project_proposals_js_1.projectProposals),
    featureLibrary: many(feature_library_js_1.featureLibrary),
}));
exports.usersRelations = (0, drizzle_orm_1.relations)(users_js_1.users, ({ one, many }) => ({
    organization: one(organizations_js_1.organizations, {
        fields: [users_js_1.users.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
    roles: many(user_roles_js_1.userRoles, {
        relationName: "userRoleUser",
    }),
    assignedUserRoles: many(user_roles_js_1.userRoles, {
        relationName: "userRoleAssigner",
    }),
    refreshTokens: many(refresh_tokens_js_1.refreshTokens),
    verificationTokens: many(verification_tokens_js_1.verificationTokens),
    settings: many(user_settings_js_1.userSettings),
    auditLogs: many(audit_logs_js_1.auditLogs),
    createdConsultations: many(consultations_js_1.consultations, {
        relationName: "consultationCreator",
    }),
    assignedConsultations: many(consultations_js_1.consultations, {
        relationName: "consultationAssignee",
    }),
    conversationMessages: many(conversation_messages_js_1.conversationMessages),
}));
exports.rolesRelations = (0, drizzle_orm_1.relations)(roles_js_1.roles, ({ one, many }) => ({
    organization: one(organizations_js_1.organizations, {
        fields: [roles_js_1.roles.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
    permissions: many(role_permissions_js_1.rolePermissions),
    users: many(user_roles_js_1.userRoles),
}));
exports.permissionsRelations = (0, drizzle_orm_1.relations)(permissions_js_1.permissions, ({ many }) => ({
    roles: many(role_permissions_js_1.rolePermissions),
}));
exports.rolePermissionsRelations = (0, drizzle_orm_1.relations)(role_permissions_js_1.rolePermissions, ({ one }) => ({
    role: one(roles_js_1.roles, {
        fields: [role_permissions_js_1.rolePermissions.roleId],
        references: [roles_js_1.roles.id],
    }),
    permission: one(permissions_js_1.permissions, {
        fields: [role_permissions_js_1.rolePermissions.permissionId],
        references: [permissions_js_1.permissions.id],
    }),
}));
exports.userRolesRelations = (0, drizzle_orm_1.relations)(user_roles_js_1.userRoles, ({ one }) => ({
    user: one(users_js_1.users, {
        fields: [user_roles_js_1.userRoles.userId],
        references: [users_js_1.users.id],
        relationName: "userRoleUser",
    }),
    role: one(roles_js_1.roles, {
        fields: [user_roles_js_1.userRoles.roleId],
        references: [roles_js_1.roles.id],
    }),
    assignedByUser: one(users_js_1.users, {
        fields: [user_roles_js_1.userRoles.assignedBy],
        references: [users_js_1.users.id],
        relationName: "userRoleAssigner",
    }),
}));
exports.refreshTokensRelations = (0, drizzle_orm_1.relations)(refresh_tokens_js_1.refreshTokens, ({ one }) => ({
    user: one(users_js_1.users, {
        fields: [refresh_tokens_js_1.refreshTokens.userId],
        references: [users_js_1.users.id],
    }),
}));
exports.verificationTokensRelations = (0, drizzle_orm_1.relations)(verification_tokens_js_1.verificationTokens, ({ one }) => ({
    user: one(users_js_1.users, {
        fields: [verification_tokens_js_1.verificationTokens.userId],
        references: [users_js_1.users.id],
    }),
}));
exports.organizationSettingsRelations = (0, drizzle_orm_1.relations)(organization_settings_js_1.organizationSettings, ({ one }) => ({
    organization: one(organizations_js_1.organizations, {
        fields: [organization_settings_js_1.organizationSettings.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
}));
exports.userSettingsRelations = (0, drizzle_orm_1.relations)(user_settings_js_1.userSettings, ({ one }) => ({
    user: one(users_js_1.users, {
        fields: [user_settings_js_1.userSettings.userId],
        references: [users_js_1.users.id],
    }),
}));
exports.auditLogsRelations = (0, drizzle_orm_1.relations)(audit_logs_js_1.auditLogs, ({ one }) => ({
    organization: one(organizations_js_1.organizations, {
        fields: [audit_logs_js_1.auditLogs.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
    actor: one(users_js_1.users, {
        fields: [audit_logs_js_1.auditLogs.actorId],
        references: [users_js_1.users.id],
    }),
}));
exports.consultationsRelations = (0, drizzle_orm_1.relations)(consultations_js_1.consultations, ({ one, many }) => ({
    organization: one(organizations_js_1.organizations, {
        fields: [consultations_js_1.consultations.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
    creator: one(users_js_1.users, {
        fields: [consultations_js_1.consultations.createdBy],
        references: [users_js_1.users.id],
        relationName: "consultationCreator",
    }),
    assignee: one(users_js_1.users, {
        fields: [consultations_js_1.consultations.assignedTo],
        references: [users_js_1.users.id],
        relationName: "consultationAssignee",
    }),
    messages: many(conversation_messages_js_1.conversationMessages),
    aiGenerations: many(ai_generations_js_1.aiGenerations),
    requirementSummary: many(requirement_summaries_js_1.requirementSummaries),
    detectedFeatures: many(detected_features_js_1.detectedFeatures),
    projectEstimation: many(project_estimations_js_1.projectEstimations),
    projectProposal: many(project_proposals_js_1.projectProposals),
}));
exports.conversationMessagesRelations = (0, drizzle_orm_1.relations)(conversation_messages_js_1.conversationMessages, ({ one, many }) => ({
    consultation: one(consultations_js_1.consultations, {
        fields: [conversation_messages_js_1.conversationMessages.consultationId],
        references: [consultations_js_1.consultations.id],
    }),
    organization: one(organizations_js_1.organizations, {
        fields: [conversation_messages_js_1.conversationMessages.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
    creator: one(users_js_1.users, {
        fields: [conversation_messages_js_1.conversationMessages.createdBy],
        references: [users_js_1.users.id],
    }),
    aiGenerations: many(ai_generations_js_1.aiGenerations),
}));
exports.aiGenerationsRelations = (0, drizzle_orm_1.relations)(ai_generations_js_1.aiGenerations, ({ one }) => ({
    organization: one(organizations_js_1.organizations, {
        fields: [ai_generations_js_1.aiGenerations.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
    consultation: one(consultations_js_1.consultations, {
        fields: [ai_generations_js_1.aiGenerations.consultationId],
        references: [consultations_js_1.consultations.id],
    }),
    conversationMessage: one(conversation_messages_js_1.conversationMessages, {
        fields: [ai_generations_js_1.aiGenerations.conversationMessageId],
        references: [conversation_messages_js_1.conversationMessages.id],
    }),
}));
exports.requirementSummariesRelations = (0, drizzle_orm_1.relations)(requirement_summaries_js_1.requirementSummaries, ({ one, many }) => ({
    organization: one(organizations_js_1.organizations, {
        fields: [requirement_summaries_js_1.requirementSummaries.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
    consultation: one(consultations_js_1.consultations, {
        fields: [requirement_summaries_js_1.requirementSummaries.consultationId],
        references: [consultations_js_1.consultations.id],
    }),
    detectedFeatures: many(detected_features_js_1.detectedFeatures),
    projectEstimations: many(project_estimations_js_1.projectEstimations),
    projectProposals: many(project_proposals_js_1.projectProposals),
}));
exports.detectedFeaturesRelations = (0, drizzle_orm_1.relations)(detected_features_js_1.detectedFeatures, ({ one }) => ({
    organization: one(organizations_js_1.organizations, {
        fields: [detected_features_js_1.detectedFeatures.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
    consultation: one(consultations_js_1.consultations, {
        fields: [detected_features_js_1.detectedFeatures.consultationId],
        references: [consultations_js_1.consultations.id],
    }),
    requirementSummary: one(requirement_summaries_js_1.requirementSummaries, {
        fields: [detected_features_js_1.detectedFeatures.requirementSummaryId],
        references: [requirement_summaries_js_1.requirementSummaries.id],
    }),
}));
exports.projectEstimationsRelations = (0, drizzle_orm_1.relations)(project_estimations_js_1.projectEstimations, ({ one, many }) => ({
    organization: one(organizations_js_1.organizations, {
        fields: [project_estimations_js_1.projectEstimations.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
    consultation: one(consultations_js_1.consultations, {
        fields: [project_estimations_js_1.projectEstimations.consultationId],
        references: [consultations_js_1.consultations.id],
    }),
    requirementSummary: one(requirement_summaries_js_1.requirementSummaries, {
        fields: [project_estimations_js_1.projectEstimations.requirementSummaryId],
        references: [requirement_summaries_js_1.requirementSummaries.id],
    }),
    projectProposals: many(project_proposals_js_1.projectProposals),
}));
exports.projectProposalsRelations = (0, drizzle_orm_1.relations)(project_proposals_js_1.projectProposals, ({ one }) => ({
    organization: one(organizations_js_1.organizations, {
        fields: [project_proposals_js_1.projectProposals.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
    consultation: one(consultations_js_1.consultations, {
        fields: [project_proposals_js_1.projectProposals.consultationId],
        references: [consultations_js_1.consultations.id],
    }),
    requirementSummary: one(requirement_summaries_js_1.requirementSummaries, {
        fields: [project_proposals_js_1.projectProposals.requirementSummaryId],
        references: [requirement_summaries_js_1.requirementSummaries.id],
    }),
    estimation: one(project_estimations_js_1.projectEstimations, {
        fields: [project_proposals_js_1.projectProposals.estimationId],
        references: [project_estimations_js_1.projectEstimations.id],
    }),
}));
exports.featureLibraryRelations = (0, drizzle_orm_1.relations)(feature_library_js_1.featureLibrary, ({ one }) => ({
    organization: one(organizations_js_1.organizations, {
        fields: [feature_library_js_1.featureLibrary.organizationId],
        references: [organizations_js_1.organizations.id],
    }),
}));

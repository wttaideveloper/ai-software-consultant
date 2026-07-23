"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_js_1 = require("./config/env.js");
const index_js_1 = require("./db/index.js");
const admin_seed_js_1 = require("./db/seeds/admin.seed.js");
const error_handler_js_1 = require("./middleware/error-handler.js");
const not_found_js_1 = require("./middleware/not-found.js");
const auth_route_js_1 = require("./modules/auth/auth.route.js");
const chat_route_js_1 = require("./modules/chat/chat.route.js");
const client_estimate_route_js_1 = require("./modules/client-estimate/client-estimate.route.js");
const client_features_route_js_1 = require("./modules/client-features/client-features.route.js");
const client_lead_admin_route_js_1 = require("./modules/client-lead/client-lead.admin.route.js");
const client_lead_route_js_1 = require("./modules/client-lead/client-lead.route.js");
const client_requirement_summary_route_js_1 = require("./modules/client-requirement-summary/client-requirement-summary.route.js");
const client_requirements_route_js_1 = require("./modules/client-requirements/client-requirements.route.js");
const consultations_route_js_1 = require("./modules/consultations/consultations.route.js");
const cost_route_js_1 = require("./modules/cost/cost.route.js");
const conversations_route_js_1 = require("./modules/conversations/conversations.route.js");
const estimation_route_js_1 = require("./modules/estimation/estimation.route.js");
const feature_detection_route_js_1 = require("./modules/feature-detection/feature-detection.route.js");
const feature_library_route_js_1 = require("./modules/feature-library/feature-library.route.js");
const lead_proposal_route_js_1 = require("./modules/lead-proposal/lead-proposal.route.js");
const proposal_route_js_1 = require("./modules/proposal/proposal.route.js");
const requirement_extraction_route_js_1 = require("./modules/requirement-extraction/requirement-extraction.route.js");
const requirement_summary_route_js_1 = require("./modules/requirement-summary/requirement-summary.route.js");
const settings_route_js_1 = require("./modules/settings/settings.route.js");
const users_route_js_1 = require("./modules/users/users.route.js");
const app_js_1 = require("./shared/constants/app.js");
const app = (0, express_1.default)();
const PORT = env_js_1.config.PORT;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend is running successfully 🚀",
        timestamp: new Date().toISOString(),
    });
});
app.use(`${app_js_1.API_PREFIX}/client/questions`, client_requirements_route_js_1.clientRequirementsRouter);
app.use(`${app_js_1.API_PREFIX}/client/summary`, client_requirement_summary_route_js_1.clientRequirementSummaryRouter);
app.use(`${app_js_1.API_PREFIX}/client/features`, client_features_route_js_1.clientFeaturesRouter);
app.use(`${app_js_1.API_PREFIX}/client/estimate`, client_estimate_route_js_1.clientEstimateRouter);
app.use(`${app_js_1.API_PREFIX}/client/request-proposal`, client_lead_route_js_1.clientLeadRouter);
app.use(`${app_js_1.API_PREFIX}/auth`, auth_route_js_1.authRouter);
// Admin lead inbox — same module as the public submit route above, but
// authenticated. Mounted at a top-level path so it is not confused with the
// public /client/* namespace.
app.use(`${app_js_1.API_PREFIX}/client-leads`, client_lead_admin_route_js_1.clientLeadAdminRouter);
// Proposal versions of one client request. Safe to mount after the lead router
// above: its `/:id` routes match a single path segment, so they never swallow
// `/client-leads/<id>/proposals`.
app.use(`${app_js_1.API_PREFIX}/client-leads/:leadId/proposals`, lead_proposal_route_js_1.leadProposalVersionsRouter);
// Proposal library + single-version operations.
app.use(`${app_js_1.API_PREFIX}/lead-proposals`, lead_proposal_route_js_1.leadProposalRouter);
app.use(`${app_js_1.API_PREFIX}/users`, users_route_js_1.usersRouter);
app.use(`${app_js_1.API_PREFIX}/consultations`, consultations_route_js_1.consultationsRouter);
app.use(`${app_js_1.API_PREFIX}/consultations/:consultationId/messages`, conversations_route_js_1.consultationMessagesRouter);
app.use(`${app_js_1.API_PREFIX}/consultations/:consultationId/chat`, chat_route_js_1.chatRouter);
app.use(`${app_js_1.API_PREFIX}/consultations/:consultationId/requirement-extraction`, requirement_extraction_route_js_1.requirementExtractionRouter);
app.use(`${app_js_1.API_PREFIX}/consultations/:consultationId/requirement-summary`, requirement_summary_route_js_1.requirementSummaryRouter);
app.use(`${app_js_1.API_PREFIX}/consultations/:consultationId/features`, feature_detection_route_js_1.consultationFeaturesRouter);
app.use(`${app_js_1.API_PREFIX}/consultations/:consultationId/estimate`, estimation_route_js_1.estimationRouter);
app.use(`${app_js_1.API_PREFIX}/consultations/:consultationId/proposal`, proposal_route_js_1.proposalRouter);
app.use(`${app_js_1.API_PREFIX}/features`, feature_detection_route_js_1.featuresRouter);
app.use(`${app_js_1.API_PREFIX}/feature-library`, feature_library_route_js_1.featureLibraryRouter);
app.use(`${app_js_1.API_PREFIX}/messages`, conversations_route_js_1.messagesRouter);
app.use(`${app_js_1.API_PREFIX}/settings`, settings_route_js_1.settingsRouter);
// Cost Management — the pricing engine's configuration.
app.use(`${app_js_1.API_PREFIX}/cost-settings`, cost_route_js_1.costSettingsRouter);
app.use(`${app_js_1.API_PREFIX}/hourly-rates`, cost_route_js_1.hourlyRatesRouter);
app.use(`${app_js_1.API_PREFIX}/complexity-multipliers`, cost_route_js_1.complexityMultipliersRouter);
app.use(`${app_js_1.API_PREFIX}/platform-multipliers`, cost_route_js_1.platformMultipliersRouter);
app.use(not_found_js_1.notFound);
app.use(error_handler_js_1.errorHandler);
async function verifyDatabaseConnection() {
    try {
        const result = await index_js_1.pool.query("SELECT NOW() AS current_time");
        const currentTime = result.rows[0]?.current_time;
        console.log("✅ Connected to Neon PostgreSQL");
        console.log(`Database Time: ${currentTime?.toISOString?.() ?? String(currentTime)}`);
        return true;
    }
    catch (error) {
        console.error("❌ Failed to connect to Neon PostgreSQL");
        console.error(error);
        return false;
    }
}
/**
 * Public registration is disabled, so the admin account has to come from
 * somewhere: this creates it on boot when it is missing. Idempotent — see
 * db/seeds/admin.seed.ts. A failure is logged but never takes the server down;
 * the API is still useful (and the seed is re-runnable via db:seed:admin).
 */
async function bootstrap() {
    const isDatabaseReachable = await verifyDatabaseConnection();
    if (!isDatabaseReachable) {
        console.warn("⚠️  Skipping admin bootstrap — database is unreachable.");
        return;
    }
    try {
        await (0, admin_seed_js_1.ensureDefaultAdmin)();
    }
    catch (error) {
        console.error("❌ Admin bootstrap failed");
        console.error(error);
    }
}
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    void bootstrap();
});

import "dotenv/config";
import cors from "cors";
import express from "express";
import { config } from "./config/env.js";
import { pool } from "./db/index.js";
import { ensureDefaultAdmin } from "./db/seeds/admin.seed.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { authRouter } from "./modules/auth/auth.route.js";
import { chatRouter } from "./modules/chat/chat.route.js";
import { clientEstimateRouter } from "./modules/client-estimate/client-estimate.route.js";
import { clientFeaturesRouter } from "./modules/client-features/client-features.route.js";
import { clientLeadAdminRouter } from "./modules/client-lead/client-lead.admin.route.js";
import { clientLeadRouter } from "./modules/client-lead/client-lead.route.js";
import { clientRequirementSummaryRouter } from "./modules/client-requirement-summary/client-requirement-summary.route.js";
import { clientRequirementsRouter } from "./modules/client-requirements/client-requirements.route.js";
import { consultationsRouter } from "./modules/consultations/consultations.route.js";
import {
  consultationMessagesRouter,
  messagesRouter,
} from "./modules/conversations/conversations.route.js";
import { estimationRouter } from "./modules/estimation/estimation.route.js";
import {
  consultationFeaturesRouter,
  featuresRouter,
} from "./modules/feature-detection/feature-detection.route.js";
import { featureLibraryRouter } from "./modules/feature-library/feature-library.route.js";
import { proposalRouter } from "./modules/proposal/proposal.route.js";
import { requirementExtractionRouter } from "./modules/requirement-extraction/requirement-extraction.route.js";
import { requirementSummaryRouter } from "./modules/requirement-summary/requirement-summary.route.js";
import { settingsRouter } from "./modules/settings/settings.route.js";
import { usersRouter } from "./modules/users/users.route.js";
import { API_PREFIX } from "./shared/constants/app.js";

const app = express();
const PORT = config.PORT;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running successfully 🚀",
    timestamp: new Date().toISOString(),
  });
});

app.use(`${API_PREFIX}/client/questions`, clientRequirementsRouter);
app.use(`${API_PREFIX}/client/summary`, clientRequirementSummaryRouter);
app.use(`${API_PREFIX}/client/features`, clientFeaturesRouter);
app.use(`${API_PREFIX}/client/estimate`, clientEstimateRouter);
app.use(`${API_PREFIX}/client/request-proposal`, clientLeadRouter);
app.use(`${API_PREFIX}/auth`, authRouter);
// Admin lead inbox — same module as the public submit route above, but
// authenticated. Mounted at a top-level path so it is not confused with the
// public /client/* namespace.
app.use(`${API_PREFIX}/client-leads`, clientLeadAdminRouter);
app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/consultations`, consultationsRouter);
app.use(
  `${API_PREFIX}/consultations/:consultationId/messages`,
  consultationMessagesRouter,
);
app.use(
  `${API_PREFIX}/consultations/:consultationId/chat`,
  chatRouter,
);
app.use(
  `${API_PREFIX}/consultations/:consultationId/requirement-extraction`,
  requirementExtractionRouter,
);
app.use(
  `${API_PREFIX}/consultations/:consultationId/requirement-summary`,
  requirementSummaryRouter,
);
app.use(
  `${API_PREFIX}/consultations/:consultationId/features`,
  consultationFeaturesRouter,
);
app.use(
  `${API_PREFIX}/consultations/:consultationId/estimate`,
  estimationRouter,
);
app.use(
  `${API_PREFIX}/consultations/:consultationId/proposal`,
  proposalRouter,
);
app.use(`${API_PREFIX}/features`, featuresRouter);
app.use(`${API_PREFIX}/feature-library`, featureLibraryRouter);
app.use(`${API_PREFIX}/messages`, messagesRouter);
app.use(`${API_PREFIX}/settings`, settingsRouter);

app.use(notFound);
app.use(errorHandler);

async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query<{ current_time: Date }>(
      "SELECT NOW() AS current_time",
    );
    const currentTime = result.rows[0]?.current_time;

    console.log("✅ Connected to Neon PostgreSQL");
    console.log(`Database Time: ${currentTime?.toISOString?.() ?? String(currentTime)}`);
    return true;
  } catch (error) {
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
async function bootstrap(): Promise<void> {
  const isDatabaseReachable = await verifyDatabaseConnection();

  if (!isDatabaseReachable) {
    console.warn("⚠️  Skipping admin bootstrap — database is unreachable.");
    return;
  }

  try {
    await ensureDefaultAdmin();
  } catch (error) {
    console.error("❌ Admin bootstrap failed");
    console.error(error);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  void bootstrap();
});

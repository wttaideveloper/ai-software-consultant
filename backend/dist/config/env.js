"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
function resolveNodeEnv(value) {
    if (value === "production" || value === "test" || value === "development") {
        return value;
    }
    return "development";
}
function loadEnv() {
    return {
        PORT: Number(process.env.PORT) || 5000,
        NODE_ENV: resolveNodeEnv(process.env.NODE_ENV),
        DATABASE_URL: process.env.DATABASE_URL ?? "",
        JWT_SECRET: process.env.JWT_SECRET ?? "",
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "",
        ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES ?? "15m",
        REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES ?? "7d",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
        OPENAI_DEFAULT_MODEL: process.env.OPENAI_DEFAULT_MODEL ?? "gpt-4o-mini",
        OPENAI_TIMEOUT: Number(process.env.OPENAI_TIMEOUT) || 60_000,
        // Opt-in, not opt-out: an unconfigured deployment must not start billing for
        // image generation just because the code shipped.
        MOCKUPS_ENABLED: process.env.MOCKUPS_ENABLED === "true",
        OPENAI_IMAGE_MODEL: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
        OPENAI_IMAGE_SIZE: process.env.OPENAI_IMAGE_SIZE ?? "1024x1024",
        OPENAI_IMAGE_QUALITY: process.env.OPENAI_IMAGE_QUALITY ?? "low",
        MOCKUP_STORAGE_DIR: process.env.MOCKUP_STORAGE_DIR ?? "storage/mockups",
        MOCKUP_SCREEN_COUNT: Number(process.env.MOCKUP_SCREEN_COUNT) || 5,
        MOCKUP_MAX_REGENERATIONS: Number(process.env.MOCKUP_MAX_REGENERATIONS) || 2,
        MOCKUP_RATE_LIMIT_PER_HOUR: Number(process.env.MOCKUP_RATE_LIMIT_PER_HOUR) || 3,
        MOCKUP_DAILY_BATCH_BUDGET: Number(process.env.MOCKUP_DAILY_BATCH_BUDGET) || 50,
        APP_NAME: process.env.APP_NAME ?? "AI Software Consultant",
        APP_VERSION: process.env.APP_VERSION ?? "1.0.0",
        DISCOVERY_MAX_CLARIFICATION_QUESTIONS: Number(process.env.DISCOVERY_MAX_CLARIFICATION_QUESTIONS) || 8,
        DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME ?? "Administrator",
        DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL ?? "",
        DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD ?? "",
        DEFAULT_ADMIN_ORGANIZATION: process.env.DEFAULT_ADMIN_ORGANIZATION ?? "",
    };
}
exports.config = loadEnv();

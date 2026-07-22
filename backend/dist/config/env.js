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
        APP_NAME: process.env.APP_NAME ?? "AI Software Consultant",
        APP_VERSION: process.env.APP_VERSION ?? "1.0.0",
        DISCOVERY_MAX_CLARIFICATION_QUESTIONS: Number(process.env.DISCOVERY_MAX_CLARIFICATION_QUESTIONS) || 8,
    };
}
exports.config = loadEnv();

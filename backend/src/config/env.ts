import "dotenv/config";

export type NodeEnv = "development" | "production" | "test";

export type EnvConfig = {
  PORT: number;
  NODE_ENV: NodeEnv;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_EXPIRES: string;
  REFRESH_TOKEN_EXPIRES: string;
  OPENAI_API_KEY: string;
  OPENAI_DEFAULT_MODEL: string;
  OPENAI_TIMEOUT: number;
  APP_NAME: string;
  APP_VERSION: string;
  DISCOVERY_MAX_CLARIFICATION_QUESTIONS: number;
};

function resolveNodeEnv(value: string | undefined): NodeEnv {
  if (value === "production" || value === "test" || value === "development") {
    return value;
  }

  return "development";
}

function loadEnv(): EnvConfig {
  return {
    PORT: Number(process.env.PORT) || 5000,
    NODE_ENV: resolveNodeEnv(process.env.NODE_ENV),
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    JWT_SECRET: process.env.JWT_SECRET ?? "",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "",
    ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES ?? "15m",
    REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES ?? "7d",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    OPENAI_DEFAULT_MODEL:
      process.env.OPENAI_DEFAULT_MODEL ?? "gpt-4o-mini",
    OPENAI_TIMEOUT: Number(process.env.OPENAI_TIMEOUT) || 60_000,
    APP_NAME: process.env.APP_NAME ?? "AI Software Consultant",
    APP_VERSION: process.env.APP_VERSION ?? "1.0.0",
    DISCOVERY_MAX_CLARIFICATION_QUESTIONS:
      Number(process.env.DISCOVERY_MAX_CLARIFICATION_QUESTIONS) || 8,
  };
}

export const config: EnvConfig = loadEnv();

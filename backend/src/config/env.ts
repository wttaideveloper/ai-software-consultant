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
  /**
   * Bootstrap admin, used by db/seeds/admin.seed.ts. Public registration is
   * disabled, so this is how the first login account comes into existence.
   *
   * EMAIL and PASSWORD intentionally default to "" rather than to a well-known
   * credential: an unconfigured deployment must end up with *no* admin, never
   * with an admin whose password is published in this repository. The seed logs
   * loudly and does nothing when they are blank.
   */
  DEFAULT_ADMIN_NAME: string;
  DEFAULT_ADMIN_EMAIL: string;
  DEFAULT_ADMIN_PASSWORD: string;
  /** Organization to attach the bootstrap admin to. Only used when the database has no organization yet. */
  DEFAULT_ADMIN_ORGANIZATION: string;
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
    DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME ?? "Administrator",
    DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL ?? "",
    DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD ?? "",
    DEFAULT_ADMIN_ORGANIZATION: process.env.DEFAULT_ADMIN_ORGANIZATION ?? "",
  };
}

export const config: EnvConfig = loadEnv();

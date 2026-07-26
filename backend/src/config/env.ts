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
  /**
   * Concept-mockup generation (Client Portal). Image calls cost orders of
   * magnitude more than the text calls on a public, unauthenticated endpoint, so
   * every knob here is a spend control, not a preference.
   *
   * MOCKUPS_ENABLED is the kill switch: with it off the portal simply omits the
   * section rather than erroring, which is also the correct state for any
   * deployment that has not thought about the budget yet.
   */
  MOCKUPS_ENABLED: boolean;
  /**
   * Client Portal speech-to-text. Reuses OPENAI_API_KEY — no second provider.
   *
   * The timeout is its own knob rather than OPENAI_TIMEOUT because audio is a
   * fundamentally slower call than a chat completion: a two-minute recording can
   * legitimately take far longer than the 60s a text prompt is allowed.
   *
   * The three limits below are abuse controls on a public, unauthenticated and
   * billable endpoint. The byte cap is the enforceable one (duration is only ever
   * client-declared); both are checked before a single byte reaches OpenAI.
   */
  OPENAI_WHISPER_MODEL: string;
  OPENAI_WHISPER_TIMEOUT_MS: number;
  SPEECH_MAX_UPLOAD_BYTES: number;
  SPEECH_MAX_DURATION_SECONDS: number;
  /** Transcriptions one IP may request per hour. */
  SPEECH_RATE_LIMIT_PER_HOUR: number;
  OPENAI_IMAGE_MODEL: string;
  OPENAI_IMAGE_SIZE: string;
  OPENAI_IMAGE_QUALITY: string;
  MOCKUP_STORAGE_DIR: string;
  /** Screens per batch — each one is a separate billable image call. */
  MOCKUP_SCREEN_COUNT: number;
  /** Total regenerations allowed for one consultation key, on top of the first batch. */
  MOCKUP_MAX_REGENERATIONS: number;
  /** Batches one IP may start per hour. */
  MOCKUP_RATE_LIMIT_PER_HOUR: number;
  /** Hard ceiling on batches generated per rolling day, across all visitors. */
  MOCKUP_DAILY_BATCH_BUDGET: number;
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
    // Opt-in, not opt-out: an unconfigured deployment must not start billing for
    // image generation just because the code shipped.
    MOCKUPS_ENABLED: process.env.MOCKUPS_ENABLED === "true",
    OPENAI_WHISPER_MODEL: process.env.OPENAI_WHISPER_MODEL ?? "whisper-1",
    OPENAI_WHISPER_TIMEOUT_MS:
      Number(process.env.OPENAI_WHISPER_TIMEOUT_MS) || 120_000,
    SPEECH_MAX_UPLOAD_BYTES:
      Number(process.env.SPEECH_MAX_UPLOAD_BYTES) || 10_485_760,
    SPEECH_MAX_DURATION_SECONDS:
      Number(process.env.SPEECH_MAX_DURATION_SECONDS) || 120,
    SPEECH_RATE_LIMIT_PER_HOUR:
      Number(process.env.SPEECH_RATE_LIMIT_PER_HOUR) || 30,
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
    DISCOVERY_MAX_CLARIFICATION_QUESTIONS:
      Number(process.env.DISCOVERY_MAX_CLARIFICATION_QUESTIONS) || 8,
    DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME ?? "Administrator",
    DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL ?? "",
    DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD ?? "",
    DEFAULT_ADMIN_ORGANIZATION: process.env.DEFAULT_ADMIN_ORGANIZATION ?? "",
  };
}

export const config: EnvConfig = loadEnv();

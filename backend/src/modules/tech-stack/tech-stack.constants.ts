import { PLATFORM_LABEL_ALIASES, type CostPlatform } from "../cost/cost.constants.js";
import {
  PROJECT_SIZES,
  TECH_CAPABILITIES,
  TECH_INDUSTRIES,
  TECH_STACK_CATEGORIES,
  type ProjectSize,
  type TechCapability,
  type TechIndustry,
  type TechStackCategory,
} from "./tech-stack.types.js";

/**
 * The technology catalogue behind the deterministic baseline.
 *
 * Everything a project is *guaranteed* to be recommended is data in this file —
 * no rule lives in the engine except how the tables are combined. Adding a
 * technology for a platform, a capability or an industry is a one-line edit here
 * and needs no code change.
 */

/** A bundle of technologies keyed by the category they belong to. */
export type CategoryTechnologies = Partial<Record<TechStackCategory, string[]>>;

export const TECH_STACK_CATEGORY_LABELS: Record<TechStackCategory, string> = {
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  DATABASE: "Database",
  MOBILE: "Mobile",
  IOS: "iOS",
  ANDROID: "Android",
  DESKTOP: "Desktop",
  AUTHENTICATION: "Authentication",
  PAYMENTS: "Payments",
  MAPS: "Maps & Location",
  NOTIFICATIONS: "Notifications",
  STORAGE: "Storage & Media",
  MESSAGING: "Chat & Realtime",
  VIDEO: "Video & Streaming",
  AI: "AI & Machine Learning",
  SEARCH: "Search",
  ANALYTICS: "Analytics & Reporting",
  COMMUNICATIONS: "Email & SMS",
  INTEGRATIONS: "Integrations",
  SECURITY: "Security & Compliance",
  DEPLOYMENT: "Infrastructure",
  DEVOPS: "DevOps & CI/CD",
  TESTING: "Testing & QA",
  OTHER: "Other",
};

/**
 * Presentation order. Product surface first (what the client can see), then the
 * services behind it, then how it ships — the order a proposal reads best in.
 * OTHER is deliberately last: it only ever holds technologies the AI named that
 * the catalogue does not recognise.
 */
export const TECH_STACK_CATEGORY_ORDER: TechStackCategory[] = [
  TECH_STACK_CATEGORIES.FRONTEND,
  TECH_STACK_CATEGORIES.MOBILE,
  TECH_STACK_CATEGORIES.IOS,
  TECH_STACK_CATEGORIES.ANDROID,
  TECH_STACK_CATEGORIES.DESKTOP,
  TECH_STACK_CATEGORIES.BACKEND,
  TECH_STACK_CATEGORIES.DATABASE,
  TECH_STACK_CATEGORIES.AUTHENTICATION,
  TECH_STACK_CATEGORIES.PAYMENTS,
  TECH_STACK_CATEGORIES.MAPS,
  TECH_STACK_CATEGORIES.NOTIFICATIONS,
  TECH_STACK_CATEGORIES.STORAGE,
  TECH_STACK_CATEGORIES.MESSAGING,
  TECH_STACK_CATEGORIES.VIDEO,
  TECH_STACK_CATEGORIES.AI,
  TECH_STACK_CATEGORIES.SEARCH,
  TECH_STACK_CATEGORIES.ANALYTICS,
  TECH_STACK_CATEGORIES.COMMUNICATIONS,
  TECH_STACK_CATEGORIES.INTEGRATIONS,
  TECH_STACK_CATEGORIES.SECURITY,
  TECH_STACK_CATEGORIES.DEPLOYMENT,
  TECH_STACK_CATEGORIES.DEVOPS,
  TECH_STACK_CATEGORIES.TESTING,
  TECH_STACK_CATEGORIES.OTHER,
];

/**
 * Platform labels the tech engine understands, on top of the ones the Cost
 * Engine already resolves.
 *
 * PLATFORM_LABEL_ALIASES is imported rather than copied so the two never drift —
 * but it is deliberately not *edited*, because every entry there also changes
 * what a platform premium is charged for. The extras below affect technology
 * recommendations only and can never move a price.
 */
export const TECH_PLATFORM_ALIASES: Record<string, CostPlatform> = {
  ...PLATFORM_LABEL_ALIASES,
  "mobile app": "ANDROID",
  "mobile application": "ANDROID",
  "cross platform": "ANDROID",
  "cross-platform": "ANDROID",
  "android application": "ANDROID",
  "play store": "ANDROID",
  "ios application": "IOS",
  ipad: "IOS",
  "app store": "IOS",
  "progressive web app": "WEB",
  pwa: "WEB",
  "web portal": "WEB",
  "client portal": "WEB",
  "customer portal": "WEB",
  "landing page": "WEB",
  "windows app": "DESKTOP",
  "mac app": "DESKTOP",
  "macos app": "DESKTOP",
  "admin dashboard": "ADMIN_PANEL",
  "admin portal": "ADMIN_PANEL",
  "back office": "ADMIN_PANEL",
  cms: "ADMIN_PANEL",
  "rest api": "API",
  "api only": "API",
  "backend api": "API",
  webhooks: "API",
  "ai features": "AI_INTEGRATION",
  "machine learning": "AI_INTEGRATION",
  chatbot: "AI_INTEGRATION",
};

/**
 * Recommended for every project regardless of platform.
 *
 * A server and a datastore are not a "web" concern — a mobile-only app that
 * takes payments still needs both, so they are core rather than hanging off the
 * WEB platform.
 *
 * PostgreSQL is the default datastore, not MongoDB. Almost everything this
 * pipeline estimates — users with roles, orders, payments, bookings, audit
 * trails — is relational data with real integrity requirements, and quoting a
 * document store for it was a recommendation the consultancy would have had to
 * walk back. A project that genuinely wants MongoDB gets it through AI
 * enrichment, where it is a considered addition rather than a silent default.
 *
 * Testing and CI are core for the same reason a database is: every engagement
 * ships them, and a stack that omits them reads as an incomplete quote.
 */
export const CORE_TECHNOLOGIES: CategoryTechnologies = {
  BACKEND: ["Node.js", "Express.js", "TypeScript"],
  DATABASE: ["PostgreSQL", "Drizzle ORM"],
  DEPLOYMENT: ["Docker", "AWS"],
  DEVOPS: ["GitHub Actions (CI/CD)"],
  TESTING: ["Jest"],
};

/**
 * The guarantee behind "never omit a selected platform": every platform the
 * client picked contributes at least one technology, so it cannot vanish from
 * the final stack no matter what the AI returns.
 *
 * Push services deliberately do NOT live here. FCM and APNs used to be attached
 * to ANDROID and IOS unconditionally, which quoted a Firebase service to every
 * mobile client whether or not they had asked for notifications. They are now
 * conditional on the NOTIFICATIONS capability actually being detected — see
 * CONDITIONAL_TECHNOLOGIES.
 */
export const PLATFORM_TECHNOLOGIES: Record<CostPlatform, CategoryTechnologies> = {
  WEB: {
    FRONTEND: ["React.js", "TypeScript", "Tailwind CSS"],
  },
  ANDROID: {
    MOBILE: ["React Native"],
    ANDROID: ["Kotlin (Native modules)", "Google Play Console"],
  },
  IOS: {
    MOBILE: ["React Native"],
    IOS: ["Swift (Native modules)", "App Store Connect"],
  },
  DESKTOP: {
    DESKTOP: ["Electron", "Tauri (Alternative)"],
    FRONTEND: ["React.js", "TypeScript"],
  },
  ADMIN_PANEL: {
    FRONTEND: ["React.js", "TypeScript", "Tailwind CSS"],
    ANALYTICS: ["Recharts"],
  },
  API: {
    BACKEND: ["REST API (OpenAPI / Swagger)"],
    SECURITY: ["API rate limiting"],
    TESTING: ["Supertest (API testing)"],
  },
  /**
   * One model, not three. Selecting "AI features" says nothing about speech or
   * vision, and listing Whisper and Vision for a text-only chatbot is exactly the
   * over-recommendation the baseline exists to avoid — the AI adds those when the
   * requirements actually describe transcription or image understanding.
   */
  AI_INTEGRATION: {
    AI: ["OpenAI GPT-4o"],
  },
};

/**
 * Capability → technologies. Detected from the feature list and requirement
 * summary, so a project that mentions payments is always quoted a payment
 * provider even when the AI forgets to name one.
 *
 * One choice per job, not a menu. These bundles used to list two or three
 * interchangeable services per capability (Elasticsearch *and* Algolia, Agora
 * *and* Daily.co *and* Mux), which read to a client as indecision and made the
 * same project look like it needed three video vendors. The baseline now commits
 * to one, and an alternative reaches the stack only when the AI judges the
 * requirements actually warrant it.
 */
export const CAPABILITY_TECHNOLOGIES: Record<TechCapability, CategoryTechnologies> = {
  /**
   * Self-hosted JWT, not a managed identity provider. Firebase Authentication and
   * Auth0 were listed first here, so every project with a login screen was quoted
   * a third-party identity vendor — a recurring cost and a data-residency
   * commitment nobody asked for. JWT plus password hashing is what this
   * consultancy actually builds; a managed provider is a deliberate choice the AI
   * can add when the requirements call for enterprise SSO.
   */
  AUTHENTICATION: {
    AUTHENTICATION: ["JWT (Access & Refresh Tokens)", "bcrypt (Password Hashing)"],
  },
  PAYMENTS: {
    PAYMENTS: ["Stripe", "Razorpay"],
  },
  MAPS: {
    MAPS: ["Google Maps Platform"],
  },
  /**
   * Empty on purpose: which push service a project needs is decided entirely by
   * its platforms (Web Push / FCM / APNs), so the conditional rules own this one.
   * Naming a service here would put Firebase in front of a desktop-only client.
   */
  NOTIFICATIONS: {},
  STORAGE: {
    STORAGE: ["Amazon S3"],
  },
  UPLOADS: {
    STORAGE: ["Amazon S3", "Multer (Upload handling)"],
  },
  ANALYTICS: {
    ANALYTICS: ["Google Analytics 4"],
  },
  REPORTING: {
    ANALYTICS: ["PDF generation (Puppeteer)"],
  },
  CHARTS: {
    ANALYTICS: ["Recharts"],
  },
  CHAT: {
    MESSAGING: ["Socket.IO"],
  },
  VIDEO: {
    VIDEO: ["Mux (Video streaming)"],
  },
  AI: {
    AI: ["OpenAI GPT-4o"],
  },
  SEARCH: {
    SEARCH: ["Algolia"],
  },
  EMAIL: {
    COMMUNICATIONS: ["SendGrid"],
  },
  SMS: {
    COMMUNICATIONS: ["Twilio"],
  },
  REALTIME: {
    MESSAGING: ["Socket.IO", "Redis Pub/Sub"],
  },
  SCHEDULING: {
    INTEGRATIONS: ["Google Calendar API", "node-cron (Job scheduling)"],
  },
};

/**
 * Domain technologies — the part a generic recommendation always misses.
 *
 * These no longer restate PostgreSQL for the regulated domains: it is now the
 * core default for every project, so naming it again here would be dead data
 * that the deduplicator silently drops.
 */
export const INDUSTRY_TECHNOLOGIES: Record<TechIndustry, CategoryTechnologies> = {
  HEALTHCARE: {
    INTEGRATIONS: ["HL7 FHIR APIs"],
    SECURITY: [
      "HIPAA-compliant hosting",
      "Audit logging",
      "AES-256 encryption at rest",
      "Role-based access control",
    ],
  },
  FINTECH: {
    INTEGRATIONS: ["Plaid"],
    SECURITY: [
      "PCI DSS compliance",
      "Audit logging",
      "Two-factor authentication",
      "AES-256 encryption at rest",
    ],
  },
  ECOMMERCE: {
    PAYMENTS: ["Stripe"],
    SEARCH: ["Algolia"],
    INTEGRATIONS: [
      "Inventory management",
      "Order management workflow",
      "Shipping APIs (Shippo / Delhivery)",
    ],
  },
  TRAVEL: {
    MAPS: ["Google Maps Platform"],
    INTEGRATIONS: ["Amadeus (Flights & Hotels API)", "Booking & availability APIs"],
  },
  EDUCATION: {
    VIDEO: ["Mux (Video streaming)", "Agora"],
    INTEGRATIONS: ["Assignments & grading workflow"],
  },
  CRM: {
    // No push service here: a CRM is not inherently a notification product, and
    // attaching FCM to the industry quoted Firebase to every back-office tool.
    ANALYTICS: ["Metabase"],
    COMMUNICATIONS: ["SendGrid"],
  },
  REAL_ESTATE: {
    MAPS: ["Google Maps Platform"],
    STORAGE: ["Cloudinary"],
  },
  FOOD_DELIVERY: {
    MAPS: ["Google Maps Platform"],
    PAYMENTS: ["Stripe", "Razorpay"],
    MESSAGING: ["Socket.IO"],
  },
  LOGISTICS: {
    MAPS: ["Google Maps Platform", "Mapbox"],
    INTEGRATIONS: ["Route optimisation"],
  },
  MEDIA: {
    VIDEO: ["Mux (Video streaming)"],
    STORAGE: ["Cloudinary"],
  },
};

/**
 * Infrastructure that is only warranted once a project reaches a certain size.
 *
 * Monitoring and IaC sit under DEVOPS rather than DEPLOYMENT: "what it runs on"
 * and "how we ship and watch it" are different claims to a client, and a
 * proposal that lists Kubernetes beside GitHub Actions in one bucket loses that.
 */
export const PROJECT_SIZE_TECHNOLOGIES: Record<ProjectSize, CategoryTechnologies> = {
  SMALL: {},
  MEDIUM: {
    DEPLOYMENT: ["Nginx"],
    DEVOPS: ["Sentry (Monitoring)"],
  },
  LARGE: {
    DATABASE: ["Redis (Caching)"],
    DEPLOYMENT: ["Nginx", "Kubernetes"],
    DEVOPS: ["Sentry (Monitoring)", "Terraform"],
  },
};

/** Upper hour bounds for each size band; anything above the last is LARGE. */
export const PROJECT_SIZE_HOUR_THRESHOLDS: Array<{
  size: ProjectSize;
  maxHours: number;
}> = [
  { size: PROJECT_SIZES.SMALL, maxHours: 400 },
  { size: PROJECT_SIZES.MEDIUM, maxHours: 1200 },
];

/**
 * Rules that need more than one signal to fire.
 *
 * A rule matches when EVERY dimension it names has at least one match, which is
 * how "iOS **and** authentication" produces Sign in with Apple while iOS alone
 * does not. Omitted dimensions are wildcards.
 */
export type ConditionalTechnologyRule = {
  platforms?: CostPlatform[];
  capabilities?: TechCapability[];
  industries?: TechIndustry[];
  technologies: CategoryTechnologies;
};

export const CONDITIONAL_TECHNOLOGIES: ConditionalTechnologyRule[] = [
  {
    platforms: ["IOS"],
    capabilities: ["AUTHENTICATION"],
    // Apple requires it on any iOS app offering third-party sign-in, so this is
    // a store-review requirement rather than a nicety.
    technologies: { AUTHENTICATION: ["Sign in with Apple"] },
  },
  {
    platforms: ["ANDROID", "WEB"],
    capabilities: ["AUTHENTICATION"],
    technologies: { AUTHENTICATION: ["Google Sign-In"] },
  },
  {
    platforms: ["WEB"],
    capabilities: ["NOTIFICATIONS"],
    technologies: { NOTIFICATIONS: ["Web Push (Service Worker)"] },
  },
  /**
   * Push services are quoted only when the project actually asked for
   * notifications. Previously FCM rode along with the ANDROID platform bundle and
   * APNs with IOS, so a mobile app with no notification requirement was still
   * shown a Firebase dependency.
   */
  {
    platforms: ["ANDROID"],
    capabilities: ["NOTIFICATIONS"],
    technologies: { NOTIFICATIONS: ["Firebase Cloud Messaging (FCM)"] },
  },
  {
    platforms: ["IOS"],
    capabilities: ["NOTIFICATIONS"],
    technologies: {
      NOTIFICATIONS: ["Apple Push Notification Service (APNs)"],
    },
  },
  /** Browser E2E only makes sense where there is a browser. */
  {
    platforms: ["WEB", "ADMIN_PANEL"],
    technologies: { TESTING: ["Playwright"] },
  },
  {
    platforms: ["ANDROID", "IOS"],
    technologies: { TESTING: ["Detox (Mobile E2E)"] },
  },
  {
    platforms: ["IOS", "ANDROID"],
    capabilities: ["PAYMENTS"],
    technologies: { PAYMENTS: ["In-App Purchase (StoreKit / Play Billing)"] },
  },
  {
    platforms: ["IOS", "ANDROID"],
    capabilities: ["MAPS"],
    technologies: { MAPS: ["Google Maps SDK for Mobile"] },
  },
  /**
   * Keyed on AI alone. It used to list ["AI", "SEARCH"], but a dimension is an
   * OR — so any project with a search box was quoted a vector database, and an
   * e-commerce store ended up with an "AI & Machine Learning" category whose only
   * entry was pgvector. Vector search belongs with an LLM feature, not a filter.
   */
  {
    capabilities: ["AI"],
    technologies: { AI: ["Vector search (pgvector)"] },
  },
  {
    capabilities: ["PAYMENTS"],
    technologies: { SECURITY: ["PCI DSS compliant payment flow"] },
  },
];

/**
 * Keywords that mark a capability as present, matched on whole words against the
 * feature list and requirement summary.
 *
 * Chosen to be specific: a false positive quotes a service the project does not
 * need, which is worse than the AI simply not mentioning one.
 */
export const CAPABILITY_KEYWORDS: Record<TechCapability, string[]> = {
  AUTHENTICATION: [
    "authentication",
    "authorisation",
    "authorization",
    "login",
    "log in",
    "sign in",
    "signin",
    "sign up",
    "signup",
    "register",
    "registration",
    "user account",
    "user accounts",
    "sso",
    "oauth",
    "password",
    "otp",
    "two factor",
    "2fa",
    "role based access",
    "permissions",
    "user roles",
  ],
  PAYMENTS: [
    "payment",
    "payments",
    "checkout",
    "billing",
    "invoice",
    "invoicing",
    "subscription",
    "subscriptions",
    "wallet",
    "refund",
    "refunds",
    "pricing plan",
    "transaction",
    "transactions",
    "card payment",
    "upi",
    "payout",
    "payouts",
    "escrow",
    "donation",
    "donations",
  ],
  MAPS: [
    "map",
    "maps",
    "location",
    "geolocation",
    "gps",
    "route",
    "routing",
    "navigation",
    "nearby",
    "geofence",
    "geofencing",
    "address lookup",
    "live tracking",
    "delivery tracking",
  ],
  NOTIFICATIONS: [
    "notification",
    "notifications",
    "push notification",
    "push notifications",
    "alert",
    "alerts",
    "reminder",
    "reminders",
    "in app message",
  ],
  STORAGE: [
    "storage",
    "file storage",
    "media library",
    "document storage",
    "attachments",
    "gallery",
    "cdn",
    "image hosting",
  ],
  UPLOADS: [
    "upload",
    "uploads",
    "file upload",
    "image upload",
    "document upload",
    "attach file",
    "bulk import",
    "csv import",
  ],
  ANALYTICS: [
    "analytics",
    // Bare "tracking" is not an analytics signal — "order tracking" and "live
    // tracking" are delivery features, and they were pulling Google Analytics
    // into logistics projects. The qualified forms below still match.
    "user behaviour",
    "user behavior",
    "funnel",
    "conversion tracking",
    "metrics",
    "kpi",
    "kpis",
    "insights",
  ],
  REPORTING: [
    "report",
    "reports",
    "reporting",
    "export to pdf",
    "pdf export",
    "excel export",
    "statement",
    "statements",
    "audit report",
  ],
  CHARTS: [
    "chart",
    "charts",
    "graph",
    "graphs",
    "dashboard",
    "dashboards",
    "visualisation",
    "visualization",
    "data visualisation",
    "data visualization",
  ],
  CHAT: [
    "chat",
    "messaging",
    "message",
    "messages",
    "direct message",
    "conversation",
    "inbox",
    "comment",
    "comments",
    "support chat",
  ],
  VIDEO: [
    "video",
    "video call",
    "video calls",
    "video conferencing",
    "live stream",
    "livestream",
    "streaming",
    "webinar",
    "live class",
    "live classes",
    "screen share",
  ],
  AI: [
    "ai",
    "artificial intelligence",
    "machine learning",
    "ml model",
    "gpt",
    "llm",
    "chatbot",
    "recommendation engine",
    "recommendations",
    "sentiment analysis",
    "image recognition",
    "speech to text",
    "voice assistant",
    "nlp",
    "predictive",
  ],
  // Deliberately narrow: "filter" appears in almost every requirement summary,
  // and quoting Elasticsearch because a list has filters is over-recommending.
  SEARCH: ["search", "full text search", "autocomplete", "faceted search", "search engine"],
  EMAIL: [
    "email",
    "emails",
    "e-mail",
    "newsletter",
    "email notification",
    "transactional email",
    "mail",
  ],
  SMS: ["sms", "text message", "text messages", "whatsapp", "otp sms", "mobile verification"],
  REALTIME: [
    "real time",
    "real-time",
    "realtime",
    "live update",
    "live updates",
    "websocket",
    "websockets",
    "presence",
    "collaboration",
  ],
  SCHEDULING: [
    "booking",
    "bookings",
    "appointment",
    "appointments",
    "schedule",
    "scheduling",
    "calendar",
    "reservation",
    "reservations",
    "slot",
    "availability",
    "recurring job",
  ],
};

/** Industry keywords, matched against an explicit industry field then the text. */
export const INDUSTRY_KEYWORDS: Record<TechIndustry, string[]> = {
  HEALTHCARE: [
    "healthcare",
    "health care",
    "medical",
    "clinic",
    "clinical",
    "hospital",
    "patient",
    "patients",
    "doctor",
    "doctors",
    "telemedicine",
    "pharmacy",
    "diagnostics",
    "ehr",
    "emr",
    "hipaa",
  ],
  FINTECH: [
    "fintech",
    "banking",
    "bank",
    "finance",
    "financial",
    "lending",
    "loan",
    "loans",
    "insurance",
    "trading",
    "investment",
    "investments",
    "neobank",
    "ledger",
    "accounting",
  ],
  ECOMMERCE: [
    "ecommerce",
    "e-commerce",
    "online store",
    "online shop",
    "marketplace",
    "retail",
    "shopping",
    "cart",
    "product catalog",
    "product catalogue",
    "inventory",
    "orders",
  ],
  TRAVEL: [
    "travel",
    "tourism",
    "flight",
    "flights",
    "hotel",
    "hotels",
    "itinerary",
    "trip",
    "trips",
    "tour",
    "tours",
    "holiday",
    "vacation",
  ],
  EDUCATION: [
    "education",
    "e-learning",
    "elearning",
    "learning management",
    "lms",
    "school",
    "college",
    "university",
    "student",
    "students",
    "course",
    "courses",
    "tutor",
    "tutoring",
    "assignment",
    "assignments",
  ],
  CRM: [
    "crm",
    "customer relationship",
    "sales pipeline",
    "lead management",
    "leads",
    "deals",
    "contacts management",
    "erp",
    "hrms",
    "back office",
  ],
  REAL_ESTATE: [
    "real estate",
    "property",
    "properties",
    "rental",
    "rentals",
    "listing",
    "listings",
    "broker",
    "landlord",
    // "tenant"/"tenants" are deliberately absent: every multi-tenant SaaS
    // describes itself with those words, and they were classifying B2B platforms
    // as property products — which then quoted them Google Maps and Cloudinary.
  ],
  FOOD_DELIVERY: [
    "food delivery",
    "restaurant",
    "restaurants",
    "cafe",
    "menu",
    "meal",
    "meals",
    "takeaway",
    "cloud kitchen",
    "food ordering",
    "dining",
  ],
  LOGISTICS: [
    "logistics",
    "shipment",
    "shipments",
    "courier",
    "fleet",
    "warehouse",
    "supply chain",
    "freight",
    "last mile",
    "driver",
    "drivers",
  ],
  MEDIA: [
    "media",
    "publishing",
    "news",
    "magazine",
    "podcast",
    "music",
    "entertainment",
    "content platform",
    "ott",
  ],
};

/**
 * Canonical display names, keyed by a normalised form of whatever the AI wrote.
 *
 * This is what stops "React", "react.js" and "ReactJS" appearing as three
 * separate technologies once the AI's list is merged into the baseline.
 */
export const TECH_NAME_ALIASES: Record<string, string> = {
  react: "React.js",
  reactjs: "React.js",
  "react js": "React.js",
  "react.js": "React.js",
  "next": "Next.js",
  nextjs: "Next.js",
  "next js": "Next.js",
  "next.js": "Next.js",
  vue: "Vue.js",
  vuejs: "Vue.js",
  "vue.js": "Vue.js",
  angular: "Angular",
  angularjs: "Angular",
  svelte: "Svelte",
  typescript: "TypeScript",
  javascript: "JavaScript",
  tailwind: "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  "tailwind css": "Tailwind CSS",
  bootstrap: "Bootstrap",
  "material ui": "Material UI",
  mui: "Material UI",
  redux: "Redux",
  vite: "Vite",

  node: "Node.js",
  nodejs: "Node.js",
  "node js": "Node.js",
  "node.js": "Node.js",
  express: "Express.js",
  expressjs: "Express.js",
  "express js": "Express.js",
  "express.js": "Express.js",
  nestjs: "NestJS",
  "nest.js": "NestJS",
  django: "Django",
  flask: "Flask",
  laravel: "Laravel",
  "spring boot": "Spring Boot",
  "ruby on rails": "Ruby on Rails",
  rails: "Ruby on Rails",
  "asp.net": "ASP.NET Core",
  fastapi: "FastAPI",
  graphql: "GraphQL",
  "rest api": "REST API (OpenAPI / Swagger)",
  "restful api": "REST API (OpenAPI / Swagger)",
  swagger: "REST API (OpenAPI / Swagger)",
  openapi: "REST API (OpenAPI / Swagger)",

  mongo: "MongoDB",
  mongodb: "MongoDB",
  "mongo db": "MongoDB",
  mongoose: "MongoDB",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  "postgre sql": "PostgreSQL",
  mysql: "MySQL",
  mariadb: "MariaDB",
  sqlite: "SQLite",
  redis: "Redis (Caching)",
  "redis cache": "Redis (Caching)",
  dynamodb: "DynamoDB",
  firestore: "Cloud Firestore",
  "cloud firestore": "Cloud Firestore",
  supabase: "Supabase",
  prisma: "Prisma",
  drizzle: "Drizzle ORM",
  "drizzle orm": "Drizzle ORM",

  "react native": "React Native",
  reactnative: "React Native",
  "react-native": "React Native",
  flutter: "Flutter",
  expo: "Expo",
  swift: "Swift (Native modules)",
  swiftui: "Swift (Native modules)",
  kotlin: "Kotlin (Native modules)",
  "jetpack compose": "Kotlin (Native modules)",
  "android sdk": "Google Play Console",
  "play store": "Google Play Console",
  "app store": "App Store Connect",
  electron: "Electron",
  "electron.js": "Electron",
  tauri: "Tauri (Alternative)",

  firebase: "Firebase",
  "firebase auth": "Firebase Authentication",
  "firebase authentication": "Firebase Authentication",
  auth0: "Auth0",
  clerk: "Clerk",
  okta: "Okta",
  cognito: "Amazon Cognito",
  "aws cognito": "Amazon Cognito",
  "amazon cognito": "Amazon Cognito",
  jwt: "JWT (Access & Refresh Tokens)",
  "json web token": "JWT (Access & Refresh Tokens)",
  "json web tokens": "JWT (Access & Refresh Tokens)",
  oauth: "OAuth 2.0",
  "oauth2": "OAuth 2.0",
  "oauth 2.0": "OAuth 2.0",
  "apple sign in": "Sign in with Apple",
  "sign in with apple": "Sign in with Apple",
  "apple signin": "Sign in with Apple",
  "google sign in": "Google Sign-In",
  "google signin": "Google Sign-In",
  "sign in with google": "Google Sign-In",

  stripe: "Stripe",
  razorpay: "Razorpay",
  paypal: "PayPal",
  paytm: "Paytm",
  square: "Square",
  braintree: "Braintree",
  "in app purchase": "In-App Purchase (StoreKit / Play Billing)",
  storekit: "In-App Purchase (StoreKit / Play Billing)",
  "play billing": "In-App Purchase (StoreKit / Play Billing)",

  "google maps": "Google Maps Platform",
  "google maps sdk": "Google Maps Platform",
  "google maps api": "Google Maps Platform",
  "google maps platform": "Google Maps Platform",
  "maps sdk": "Google Maps Platform",
  mapbox: "Mapbox",
  leaflet: "Leaflet",
  "openstreetmap": "OpenStreetMap",

  fcm: "Firebase Cloud Messaging (FCM)",
  "firebase cloud messaging": "Firebase Cloud Messaging (FCM)",
  "firebase messaging": "Firebase Cloud Messaging (FCM)",
  apns: "Apple Push Notification Service (APNs)",
  "apple push notification service": "Apple Push Notification Service (APNs)",
  "apple push notifications": "Apple Push Notification Service (APNs)",
  "apple push notification": "Apple Push Notification Service (APNs)",
  onesignal: "OneSignal",
  "web push": "Web Push (Service Worker)",

  s3: "Amazon S3",
  "aws s3": "Amazon S3",
  "amazon s3": "Amazon S3",
  cloudinary: "Cloudinary",
  "cloud storage": "Google Cloud Storage",
  "google cloud storage": "Google Cloud Storage",
  multer: "Multer (Upload handling)",

  "socket.io": "Socket.IO",
  socketio: "Socket.IO",
  "socket io": "Socket.IO",
  websocket: "Socket.IO",
  websockets: "Socket.IO",
  pusher: "Pusher",
  "stream chat": "Stream Chat",
  getstream: "Stream Chat",

  agora: "Agora",
  "daily.co": "Daily.co",
  daily: "Daily.co",
  twilio: "Twilio",
  "twilio video": "Agora",
  mux: "Mux (Video streaming)",
  zoom: "Zoom SDK",
  webrtc: "WebRTC",

  openai: "OpenAI GPT-4o",
  "openai api": "OpenAI GPT-4o",
  "openai gpt-4o": "OpenAI GPT-4o",
  "gpt-4o": "OpenAI GPT-4o",
  "gpt 4o": "OpenAI GPT-4o",
  "gpt-4": "OpenAI GPT-4o",
  chatgpt: "OpenAI GPT-4o",
  whisper: "OpenAI Whisper (Speech-to-Text)",
  "openai whisper": "OpenAI Whisper (Speech-to-Text)",
  vision: "OpenAI Vision",
  "openai vision": "OpenAI Vision",
  langchain: "LangChain",
  pinecone: "Pinecone",
  pgvector: "Vector search (pgvector)",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",

  elasticsearch: "Elasticsearch",
  "elastic search": "Elasticsearch",
  opensearch: "OpenSearch",
  algolia: "Algolia",
  meilisearch: "Meilisearch",
  typesense: "Typesense",

  "chart.js": "Chart.js",
  chartjs: "Chart.js",
  "chart js": "Chart.js",
  recharts: "Recharts",
  d3: "D3.js",
  "d3.js": "D3.js",
  "google analytics": "Google Analytics 4",
  "google analytics 4": "Google Analytics 4",
  ga4: "Google Analytics 4",
  mixpanel: "Mixpanel",
  amplitude: "Amplitude",
  metabase: "Metabase",
  "power bi": "Power BI",
  puppeteer: "PDF generation (Puppeteer)",

  sendgrid: "SendGrid",
  ses: "Amazon SES",
  "amazon ses": "Amazon SES",
  "aws ses": "Amazon SES",
  mailgun: "Mailgun",
  nodemailer: "Nodemailer",
  msg91: "MSG91",

  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  aws: "AWS",
  "amazon web services": "AWS",
  gcp: "Google Cloud Platform",
  "google cloud": "Google Cloud Platform",
  azure: "Microsoft Azure",
  vercel: "Vercel",
  netlify: "Netlify",
  heroku: "Heroku",
  nginx: "Nginx",
  "github actions": "GitHub Actions (CI/CD)",
  "github action": "GitHub Actions (CI/CD)",
  "ci/cd": "GitHub Actions (CI/CD)",
  // Was aliased onto GitHub Actions, which silently renamed a client's stated
  // pipeline to a competitor's product. They are different tools.
  "gitlab ci": "GitLab CI/CD",
  "gitlab ci/cd": "GitLab CI/CD",
  jenkins: "Jenkins",
  terraform: "Terraform",
  ansible: "Ansible",
  sentry: "Sentry (Monitoring)",
  datadog: "Datadog",
  prometheus: "Prometheus",
  grafana: "Grafana",
  cloudflare: "Cloudflare",

  jest: "Jest",
  vitest: "Vitest",
  playwright: "Playwright",
  cypress: "Cypress",
  supertest: "Supertest (API testing)",
  detox: "Detox (Mobile E2E)",
  "testing library": "React Testing Library",
  "react testing library": "React Testing Library",
  k6: "k6 (Load testing)",
  bcrypt: "bcrypt (Password Hashing)",
  argon2: "Argon2 (Password Hashing)",

  hipaa: "HIPAA-compliant hosting",
  "hipaa compliance": "HIPAA-compliant hosting",
  fhir: "HL7 FHIR APIs",
  "hl7": "HL7 FHIR APIs",
  "hl7 fhir": "HL7 FHIR APIs",
  "pci dss": "PCI DSS compliance",
  pci: "PCI DSS compliance",
  gdpr: "GDPR compliance",
  plaid: "Plaid",
  "audit logging": "Audit logging",
  "audit log": "Audit logging",
  "audit logs": "Audit logging",
  "2fa": "Two-factor authentication",
  "two factor authentication": "Two-factor authentication",
  mfa: "Two-factor authentication",
};

/**
 * Categories for technologies the catalogue never recommends but the AI may
 * legitimately name. Without these an enriched suggestion would fall into
 * "Other" and read like an afterthought.
 */
export const TECH_CATEGORY_OVERRIDES: Record<string, TechStackCategory> = {
  "next.js": TECH_STACK_CATEGORIES.FRONTEND,
  "vue.js": TECH_STACK_CATEGORIES.FRONTEND,
  angular: TECH_STACK_CATEGORIES.FRONTEND,
  svelte: TECH_STACK_CATEGORIES.FRONTEND,
  javascript: TECH_STACK_CATEGORIES.FRONTEND,
  bootstrap: TECH_STACK_CATEGORIES.FRONTEND,
  "material ui": TECH_STACK_CATEGORIES.FRONTEND,
  redux: TECH_STACK_CATEGORIES.FRONTEND,
  vite: TECH_STACK_CATEGORIES.FRONTEND,

  nestjs: TECH_STACK_CATEGORIES.BACKEND,
  django: TECH_STACK_CATEGORIES.BACKEND,
  flask: TECH_STACK_CATEGORIES.BACKEND,
  laravel: TECH_STACK_CATEGORIES.BACKEND,
  "spring boot": TECH_STACK_CATEGORIES.BACKEND,
  "ruby on rails": TECH_STACK_CATEGORIES.BACKEND,
  "asp.net core": TECH_STACK_CATEGORIES.BACKEND,
  fastapi: TECH_STACK_CATEGORIES.BACKEND,
  graphql: TECH_STACK_CATEGORIES.BACKEND,

  mysql: TECH_STACK_CATEGORIES.DATABASE,
  mariadb: TECH_STACK_CATEGORIES.DATABASE,
  sqlite: TECH_STACK_CATEGORIES.DATABASE,
  dynamodb: TECH_STACK_CATEGORIES.DATABASE,
  "cloud firestore": TECH_STACK_CATEGORIES.DATABASE,
  supabase: TECH_STACK_CATEGORIES.DATABASE,
  prisma: TECH_STACK_CATEGORIES.DATABASE,
  "drizzle orm": TECH_STACK_CATEGORIES.DATABASE,
  // No longer the core default, so it is no longer indexed from the catalogue —
  // without this an AI that names MongoDB would file it under "Other".
  mongodb: TECH_STACK_CATEGORIES.DATABASE,
  "redis (caching)": TECH_STACK_CATEGORIES.DATABASE,

  flutter: TECH_STACK_CATEGORIES.MOBILE,
  expo: TECH_STACK_CATEGORIES.MOBILE,

  firebase: TECH_STACK_CATEGORIES.BACKEND,
  "firebase authentication": TECH_STACK_CATEGORIES.AUTHENTICATION,
  auth0: TECH_STACK_CATEGORIES.AUTHENTICATION,
  "amazon cognito": TECH_STACK_CATEGORIES.AUTHENTICATION,
  okta: TECH_STACK_CATEGORIES.AUTHENTICATION,
  clerk: TECH_STACK_CATEGORIES.AUTHENTICATION,
  "oauth 2.0": TECH_STACK_CATEGORIES.AUTHENTICATION,

  paypal: TECH_STACK_CATEGORIES.PAYMENTS,
  paytm: TECH_STACK_CATEGORIES.PAYMENTS,
  square: TECH_STACK_CATEGORIES.PAYMENTS,
  braintree: TECH_STACK_CATEGORIES.PAYMENTS,

  mapbox: TECH_STACK_CATEGORIES.MAPS,
  leaflet: TECH_STACK_CATEGORIES.MAPS,
  openstreetmap: TECH_STACK_CATEGORIES.MAPS,
  onesignal: TECH_STACK_CATEGORIES.NOTIFICATIONS,
  cloudinary: TECH_STACK_CATEGORIES.STORAGE,
  "google cloud storage": TECH_STACK_CATEGORIES.STORAGE,
  pusher: TECH_STACK_CATEGORIES.MESSAGING,
  "stream chat": TECH_STACK_CATEGORIES.MESSAGING,
  webrtc: TECH_STACK_CATEGORIES.VIDEO,
  agora: TECH_STACK_CATEGORIES.VIDEO,
  "daily.co": TECH_STACK_CATEGORIES.VIDEO,
  "zoom sdk": TECH_STACK_CATEGORIES.VIDEO,
  twilio: TECH_STACK_CATEGORIES.COMMUNICATIONS,
  nodemailer: TECH_STACK_CATEGORIES.COMMUNICATIONS,
  mailgun: TECH_STACK_CATEGORIES.COMMUNICATIONS,
  "amazon ses": TECH_STACK_CATEGORIES.COMMUNICATIONS,
  msg91: TECH_STACK_CATEGORIES.COMMUNICATIONS,

  langchain: TECH_STACK_CATEGORIES.AI,
  pinecone: TECH_STACK_CATEGORIES.AI,
  tensorflow: TECH_STACK_CATEGORIES.AI,
  pytorch: TECH_STACK_CATEGORIES.AI,
  "openai whisper (speech-to-text)": TECH_STACK_CATEGORIES.AI,
  "openai vision": TECH_STACK_CATEGORIES.AI,

  elasticsearch: TECH_STACK_CATEGORIES.SEARCH,
  opensearch: TECH_STACK_CATEGORIES.SEARCH,
  meilisearch: TECH_STACK_CATEGORIES.SEARCH,
  typesense: TECH_STACK_CATEGORIES.SEARCH,

  "chart.js": TECH_STACK_CATEGORIES.ANALYTICS,
  "d3.js": TECH_STACK_CATEGORIES.ANALYTICS,
  mixpanel: TECH_STACK_CATEGORIES.ANALYTICS,
  amplitude: TECH_STACK_CATEGORIES.ANALYTICS,
  "power bi": TECH_STACK_CATEGORIES.ANALYTICS,

  "google cloud platform": TECH_STACK_CATEGORIES.DEPLOYMENT,
  "microsoft azure": TECH_STACK_CATEGORIES.DEPLOYMENT,
  vercel: TECH_STACK_CATEGORIES.DEPLOYMENT,
  netlify: TECH_STACK_CATEGORIES.DEPLOYMENT,
  heroku: TECH_STACK_CATEGORIES.DEPLOYMENT,
  cloudflare: TECH_STACK_CATEGORIES.DEPLOYMENT,

  // Pipelines, IaC and observability — how it ships, not what it runs on.
  jenkins: TECH_STACK_CATEGORIES.DEVOPS,
  "gitlab ci/cd": TECH_STACK_CATEGORIES.DEVOPS,
  terraform: TECH_STACK_CATEGORIES.DEVOPS,
  ansible: TECH_STACK_CATEGORIES.DEVOPS,
  datadog: TECH_STACK_CATEGORIES.DEVOPS,
  prometheus: TECH_STACK_CATEGORIES.DEVOPS,
  grafana: TECH_STACK_CATEGORIES.DEVOPS,

  vitest: TECH_STACK_CATEGORIES.TESTING,
  cypress: TECH_STACK_CATEGORIES.TESTING,
  "react testing library": TECH_STACK_CATEGORIES.TESTING,
  "k6 (load testing)": TECH_STACK_CATEGORIES.TESTING,

  "gdpr compliance": TECH_STACK_CATEGORIES.SECURITY,
  "two-factor authentication": TECH_STACK_CATEGORIES.SECURITY,
  "argon2 (password hashing)": TECH_STACK_CATEGORIES.AUTHENTICATION,
  plaid: TECH_STACK_CATEGORIES.INTEGRATIONS,
};

/**
 * Last-resort categorisation for an unrecognised technology: a substring hit on
 * one of these puts it somewhere sensible instead of in "Other".
 */
export const CATEGORY_FALLBACK_KEYWORDS: Array<{
  category: TechStackCategory;
  keywords: string[];
}> = [
  { category: TECH_STACK_CATEGORIES.AUTHENTICATION, keywords: ["auth", "identity", "sso", "login"] },
  { category: TECH_STACK_CATEGORIES.PAYMENTS, keywords: ["payment", "billing", "checkout", "pay"] },
  { category: TECH_STACK_CATEGORIES.MAPS, keywords: ["map", "geo", "location", "navigation"] },
  { category: TECH_STACK_CATEGORIES.NOTIFICATIONS, keywords: ["push", "notification"] },
  { category: TECH_STACK_CATEGORIES.VIDEO, keywords: ["video", "stream", "rtc"] },
  { category: TECH_STACK_CATEGORIES.MESSAGING, keywords: ["chat", "socket", "realtime", "messaging"] },
  { category: TECH_STACK_CATEGORIES.SEARCH, keywords: ["search", "index"] },
  { category: TECH_STACK_CATEGORIES.AI, keywords: ["ai", "gpt", "llm", "ml", "vector", "openai"] },
  { category: TECH_STACK_CATEGORIES.ANALYTICS, keywords: ["analytic", "chart", "graph", "report", "bi"] },
  { category: TECH_STACK_CATEGORIES.COMMUNICATIONS, keywords: ["mail", "email", "sms"] },
  { category: TECH_STACK_CATEGORIES.STORAGE, keywords: ["storage", "bucket", "cdn", "upload", "media"] },
  { category: TECH_STACK_CATEGORIES.DATABASE, keywords: ["sql", "db", "database", "cache", "orm"] },
  { category: TECH_STACK_CATEGORIES.SECURITY, keywords: ["compliance", "encryption", "security", "audit", "gdpr"] },
  // Testing and DevOps are matched before Infrastructure: "monitoring" and
  // "pipeline" used to fall into the deployment bucket, which is where the
  // distinction between what a system runs on and how it ships was being lost.
  {
    category: TECH_STACK_CATEGORIES.TESTING,
    keywords: ["test", "testing", "e2e", "qa", "coverage"],
  },
  {
    category: TECH_STACK_CATEGORIES.DEVOPS,
    keywords: ["ci", "pipeline", "devops", "monitor", "monitoring", "observability", "logging", "iac"],
  },
  {
    category: TECH_STACK_CATEGORIES.DEPLOYMENT,
    keywords: ["docker", "cloud", "deploy", "hosting", "kubernetes", "server"],
  },
  { category: TECH_STACK_CATEGORIES.MOBILE, keywords: ["native", "mobile", "android", "ios"] },
  { category: TECH_STACK_CATEGORIES.FRONTEND, keywords: ["css", "ui", "frontend", "front-end"] },
  { category: TECH_STACK_CATEGORIES.BACKEND, keywords: ["api", "backend", "back-end", "server-side"] },
];

/**
 * Ceilings on the merged result. The baseline is never trimmed by these — only
 * AI additions are — so "never omit a selected platform" survives a model that
 * returns forty technologies.
 */
export const TECH_STACK_LIMITS = {
  MAX_ITEMS_PER_GROUP: 8,
  MAX_TOTAL_ITEMS: 45,
  MAX_ITEM_LENGTH: 120,
} as const;

/**
 * Verification harness for the technology-stack engine. Not part of the app and
 * not compiled by `npm run build` — run it with `npx tsx tech-stack-check.ts`.
 *
 * Prints the deterministic baseline for representative projects, then the same
 * projects with AI enrichment merged in, which is what the two-stage pipeline
 * produces at runtime.
 */
import {
  analyzeProject,
  buildBaselineFromAnalysis,
  buildEnrichmentDirective,
  mergeTechStack,
  normalizeTechStack,
} from "./src/modules/tech-stack/tech-stack.engine.js";
import type { TechStackContext } from "./src/modules/tech-stack/tech-stack.types.js";

const feature = (name: string, description = "") => ({
  name,
  category: "Core",
  description,
});

function show(title: string, context: TechStackContext, ai?: unknown) {
  const analysis = analyzeProject(context);
  const baseline = buildBaselineFromAnalysis(analysis);
  const stack = ai === undefined ? baseline : mergeTechStack(baseline, ai);

  console.log(`\n=== ${title} ===`);
  console.log(
    `platforms=${analysis.platforms.join(",") || "-"} | capabilities=${analysis.capabilities.join(",") || "-"} | industry=${analysis.industry ?? "-"} | size=${analysis.projectSize}`,
  );
  for (const group of stack) {
    console.log(`  ${group.label.padEnd(28)} ${group.items.join(", ")}`);
  }
  console.log(`  [${stack.reduce((n, g) => n + g.items.length, 0)} technologies in ${stack.length} categories]`);
}

// ── 1. Website ───────────────────────────────────────────────────────────
show("WEBSITE — booking site with logins and payments", {
  platformLabels: ["Website"],
  projectIdea: "A website where customers browse services, create an account and pay online.",
  requirementSummary:
    "A web platform where users register and log in, book appointments, and pay by card. Admins manage bookings.",
  features: [
    feature("User Authentication", "Email and password login with registration"),
    feature("Online Payments", "Card checkout for bookings"),
    feature("Appointment Booking", "Pick a slot from availability"),
  ],
  estimatedHours: 420,
  complexity: "MEDIUM",
});

// ── 2. Mobile app ────────────────────────────────────────────────────────
show("MOBILE APP — Android + iOS delivery app", {
  platformLabels: ["Android App", "iOS App"],
  projectIdea: "A food delivery app for Android and iOS.",
  requirementSummary:
    "Customers order meals from nearby restaurants, pay in the app, get push notifications on order status and track the driver on a map.",
  features: [
    feature("Authentication", "Sign up and login with OTP"),
    feature("Push Notifications", "Order status alerts"),
    feature("Payments", "In-app checkout"),
    feature("Live Tracking", "Track the delivery on a map"),
  ],
  estimatedHours: 900,
  complexity: "MEDIUM",
});

// ── 3. AI SaaS platform ──────────────────────────────────────────────────
show("AI SAAS — multi-tenant AI platform with an admin panel", {
  platformLabels: ["Website", "Admin Panel", "AI Features", "REST API"],
  projectIdea: "An AI SaaS platform that answers questions over a company's documents.",
  requirementSummary:
    "A multi-tenant SaaS where teams upload documents, run AI search over them with a chatbot, view usage analytics on dashboards, and manage subscriptions. Admins manage tenants and permissions.",
  features: [
    feature("AI Chatbot", "LLM assistant answering over uploaded documents"),
    feature("Document Upload", "File upload and storage"),
    feature("Full Text Search", "Search across a tenant's documents"),
    feature("Subscription Billing", "Monthly subscription plans"),
    feature("Usage Dashboard", "Charts of usage metrics"),
    feature("Authentication", "SSO and role based access"),
  ],
  estimatedHours: 2400,
  complexity: "HIGH",
});

// ── 4. E-commerce platform ───────────────────────────────────────────────
show("E-COMMERCE — storefront, apps and back office", {
  platformLabels: ["Website", "Android App", "iOS App", "Admin Panel"],
  industry: "E-commerce",
  projectIdea: "An online store with mobile apps and an admin back office.",
  requirementSummary:
    "An online store with a product catalogue, cart and checkout, card payments, order tracking, search with filters, email receipts and push notifications for order updates.",
  features: [
    feature("Product Catalog", "Browse and filter products"),
    feature("Cart and Checkout", "Card payment at checkout"),
    feature("Order Tracking", "Track an order to delivery"),
    feature("Search", "Full text search over products"),
    feature("Email Receipts", "Transactional email after purchase"),
    feature("Push Notifications", "Order status alerts"),
    feature("Authentication", "Customer accounts"),
  ],
  estimatedHours: 1800,
  complexity: "HIGH",
});

// ── Enrichment: the AI can only ever add ─────────────────────────────────
console.log("\n\n########## AI ENRICHMENT (merged on top of the baseline) ##########");

show(
  "WEBSITE + AI suggestions",
  {
    platformLabels: ["Website"],
    requirementSummary:
      "A web platform where users register and log in, book appointments, and pay by card.",
    features: [
      feature("User Authentication"),
      feature("Online Payments"),
      feature("Appointment Booking"),
    ],
    estimatedHours: 420,
  },
  // Deliberately hostile: aliases of baseline entries, a competing database, a
  // genuinely useful addition, and something the catalogue has never heard of.
  ["React", "react.js", "NODE.JS", "PostgreSQL", "Next.js", "Zod", "some-unknown-tool"],
);

console.log("\n\n########## PROMPT DIRECTIVE HANDED TO THE AI ##########\n");
console.log(
  buildEnrichmentDirective(
    buildBaselineFromAnalysis(
      analyzeProject({
        platformLabels: ["Website"],
        requirementSummary: "Users log in and pay for bookings.",
        features: [feature("Authentication"), feature("Payments")],
        estimatedHours: 420,
      }),
    ),
  ),
);

console.log("\n\n########## BACKWARD COMPATIBILITY ##########");
console.log("\nLegacy flat snapshot (a lead saved before the engine shipped):");
for (const group of normalizeTechStack([
  "React.js",
  "Node.js",
  "Express.js",
  "MongoDB",
  "Stripe",
  "Firebase",
  "Google Maps",
  "GitHub Actions",
])) {
  console.log(`  ${group.label.padEnd(28)} ${group.items.join(", ")}`);
}

console.log("\nGarbage tolerance:");
console.log(`  null           -> ${JSON.stringify(normalizeTechStack(null))}`);
console.log(`  "nonsense"     -> ${JSON.stringify(normalizeTechStack("nonsense"))}`);
console.log(
  `  bad category   -> ${JSON.stringify(normalizeTechStack([{ category: "BOGUS", items: ["Stripe"] }]))}`,
);

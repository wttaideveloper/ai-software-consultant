/**
 * TEMPORARY verification harness — deleted after the run. Not part of the app.
 */
import {
  buildTechStackRecommendation,
  describeTechStack,
  flattenTechStack,
  normalizeTechStack,
} from "./src/modules/tech-stack/tech-stack.engine.js";
import type { TechStackContext } from "./src/modules/tech-stack/tech-stack.types.js";

function show(title: string, context: TechStackContext, ai?: unknown) {
  const result = buildTechStackRecommendation(context, ai);
  console.log(`\n=== ${title} ===`);
  console.log(
    `platforms=${result.platforms.join(",") || "-"} | capabilities=${result.capabilities.join(",") || "-"} | industry=${result.industry ?? "-"} | size=${result.projectSize}`,
  );
  for (const group of result.stack) {
    console.log(`  ${group.label}: ${group.items.join(", ")}`);
  }
  console.log(`  [flat: ${flattenTechStack(result.stack).length} items]`);
}

const feature = (name: string, description = "") => ({
  name,
  category: "Core",
  description,
  priority: "HIGH",
  complexity: "MEDIUM",
});

show("Example 1: Web / auth + payments + maps", {
  platformLabels: ["Website"],
  features: [
    feature("User Authentication", "Login and registration with email"),
    feature("Payments", "Checkout and card payment"),
    feature("Maps", "Show nearby locations on a map"),
  ],
  requirementSummary:
    "A web platform where users log in, pay for services and find nearby providers on a map.",
  estimatedHours: 500,
  complexity: "MEDIUM",
});

show("Example 2: Android + iOS / auth + notifications + payments", {
  platformLabels: ["Android App", "iOS App"],
  features: [
    feature("Authentication", "Sign up and login"),
    feature("Push Notifications", "Order alerts"),
    feature("Payments", "In-app checkout"),
  ],
  requirementSummary:
    "A mobile app for Android and iOS with login, push notifications and payments.",
  estimatedHours: 700,
  complexity: "MEDIUM",
});

show("Example 3: Desktop + Admin Panel / reporting + charts + auth", {
  platformLabels: ["Desktop App", "Admin Panel"],
  features: [
    feature("Reporting", "Generate reports and export to PDF"),
    feature("Charts", "Dashboard with graphs"),
    feature("Authentication", "Staff login with roles"),
  ],
  requirementSummary:
    "An internal desktop tool with an admin panel, reports and charts. Staff log in with roles.",
  estimatedHours: 300,
  complexity: "LOW",
});

show("Healthcare: telemedicine", {
  platformLabels: ["Website", "iOS App"],
  industry: "Healthcare",
  features: [
    feature("Appointment booking"),
    feature("Patient records"),
    feature("Video consultation"),
  ],
  requirementSummary:
    "A telemedicine platform for a hospital: patients book appointments and join video consultations with doctors.",
  estimatedHours: 1600,
  complexity: "HIGH",
});

show("E-commerce: multi-platform store", {
  platformLabels: ["Website", "Android App", "iOS App", "Admin Panel"],
  industry: "E-commerce",
  features: [
    feature("Product catalog"),
    feature("Cart and checkout"),
    feature("Order tracking"),
    feature("Search"),
  ],
  requirementSummary:
    "An online store with a product catalogue, cart, checkout, order tracking and search.",
  estimatedHours: 1400,
  complexity: "HIGH",
});

show(
  "Example 1 + AI suggestions (enrichment must not replace)",
  {
    platformLabels: ["Website"],
    features: [feature("Authentication"), feature("Payments"), feature("Maps")],
    requirementSummary: "A web platform with login, payments and maps.",
    estimatedHours: 500,
  },
  ["React", "node.js", "NEXT.JS", "Vercel", "PostgreSQL", "Stripe", "some-unknown-tool"],
);

console.log("\n=== Legacy flat array normalisation (old lead snapshot) ===");
for (const group of normalizeTechStack([
  "React.js",
  "Node.js",
  "Express.js",
  "MongoDB",
  "Stripe",
  "Firebase",
  "Google Maps",
])) {
  console.log(`  ${group.label}: ${group.items.join(", ")}`);
}

console.log("\n=== Garbage tolerance ===");
console.log(`null            -> ${JSON.stringify(normalizeTechStack(null))}`);
console.log(`"nonsense"      -> ${JSON.stringify(normalizeTechStack("nonsense"))}`);
console.log(
  `bad category    -> ${JSON.stringify(normalizeTechStack([{ category: "BOGUS", items: ["Stripe"] }]))}`,
);
console.log(
  `describe        -> ${describeTechStack(normalizeTechStack([{ category: "FRONTEND", items: ["React.js"] }]))}`,
);

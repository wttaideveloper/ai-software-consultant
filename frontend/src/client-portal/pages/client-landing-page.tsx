import { motion } from "framer-motion";
import {
  ArrowRight,
  Calculator,
  FileText,
  ListChecks,
  MessageSquareText,
  Send,
  Sparkles,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClientPortalHeader } from "@/client-portal/layouts/client-portal-header";
import { Button } from "@/components/ui";
import { staggerContainer, staggerItem } from "@/utils/motion";

const BENEFITS: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Sparkles,
    title: "AI-Guided Discovery",
    description:
      "A short, adaptive interview asks only what's relevant to your idea — no generic forms.",
  },
  {
    icon: FileText,
    title: "Editable Requirement Summary",
    description: "Review and refine the AI's summary of your project before moving on.",
  },
  {
    icon: Calculator,
    title: "Transparent Estimate",
    description: "See timeline, complexity, and a feature-by-feature breakdown up front.",
  },
  {
    icon: Timer,
    title: "Minutes, Not Meetings",
    description: "Get a clear picture of your project without booking a call first.",
  },
];

const STEPS: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: MessageSquareText,
    title: "Describe your idea",
    description: "Tell us what you want to build, your timeline, and target platforms.",
  },
  {
    icon: Sparkles,
    title: "Answer a few AI questions",
    description: "A short, personalized interview fills in the details that matter.",
  },
  {
    icon: ListChecks,
    title: "Review summary & features",
    description: "Edit the AI-generated requirement summary and feature list as needed.",
  },
  {
    icon: Send,
    title: "Request your free proposal",
    description: "Share your contact details and we'll follow up with a tailored proposal.",
  },
];

export function ClientLandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <ClientPortalHeader />

      <main className="flex-1">
        {/* Hero */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mx-auto max-w-4xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28"
        >
          <motion.div variants={staggerItem}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Free AI Consultation
            </span>
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Turn your idea into a{" "}
            <span className="text-accent">clear project plan</span>
            {" "}— in minutes
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted"
          >
            Describe what you want to build. Our AI asks the right follow-up questions, then gives
            you a requirement summary, feature breakdown, and project estimate — free, before you
            ever talk to a consultant.
          </motion.p>

          <motion.div variants={staggerItem} className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate("/requirements/project-idea")}>
              Start Free AI Consultation
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-sm text-muted">No account required</p>
          </motion.div>
        </motion.section>

        {/* Benefits */}
        <section className="border-t border-border bg-surface px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Why start here
              </h2>
              <p className="mt-2 text-sm text-muted">
                Everything you need to scope your project before the first conversation.
              </p>
            </div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {BENEFITS.map((benefit) => (
                <motion.div
                  key={benefit.title}
                  variants={staggerItem}
                  className="rounded-xl border border-border bg-canvas p-5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-subtle text-accent">
                    <benefit.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">{benefit.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                How it works
              </h2>
              <p className="mt-2 text-sm text-muted">Four steps from idea to proposal.</p>
            </div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="mt-10 flex flex-col gap-3"
            >
              {STEPS.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={staggerItem}
                  className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <step.icon className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} />
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-surface px-4 py-16 text-center sm:px-6">
          <div className="mx-auto max-w-lg">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Ready to see your project take shape?
            </h2>
            <p className="mt-2 text-sm text-muted">
              No account, no sales call — just answer a few questions and get your estimate.
            </p>
            <div className="mt-6">
              <Button size="lg" onClick={() => navigate("/requirements/project-idea")}>
                Start Free AI Consultation
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-6 sm:px-6">
        <p className="text-center text-xs text-muted">
          © {new Date().getFullYear()} AI Consultant. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

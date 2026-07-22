import { motion } from "framer-motion";
import {
  Calculator,
  FileText,
  ListChecks,
  MessageSquareText,
  Rocket,
  Send,
  Sparkles,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClientPortalHeader } from "@/client-portal/layouts/client-portal-header";
import { Button, Card } from "@/components/ui";
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
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24"
        >
          <motion.div
            variants={staggerItem}
            className="asc-gradient-subtle mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-accent shadow-sm shadow-accent/10"
          >
            <Sparkles className="h-6 w-6" strokeWidth={1.75} />
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Turn your idea into a clear project plan — in minutes
          </motion.h1>

          <motion.p variants={staggerItem} className="mt-4 text-lg leading-relaxed text-muted">
            Describe what you want to build. Our AI asks the right follow-up questions, then hands
            you a requirement summary, a feature breakdown, and a project estimate — free, before
            you ever talk to a consultant.
          </motion.p>

          <motion.div variants={staggerItem} className="mt-8">
            <Button size="lg" onClick={() => navigate("/requirements/project-idea")}>
              <Rocket className="h-4.5 w-4.5" />
              Start Free AI Consultation
            </Button>
          </motion.div>
        </motion.section>

        <section className="border-t border-border bg-surface px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">
              Why start here
            </h2>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {BENEFITS.map((benefit) => (
                <motion.div key={benefit.title} variants={staggerItem}>
                  <Card hover={false} className="h-full">
                    <div className="asc-gradient-subtle flex h-10 w-10 items-center justify-center rounded-lg text-accent">
                      <benefit.icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-foreground">{benefit.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {benefit.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">
              How it works
            </h2>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="mt-8 flex flex-col gap-4"
            >
              {STEPS.map((step, index) => (
                <motion.div key={step.title} variants={staggerItem}>
                  <Card hover={false} className="flex items-start gap-4">
                    <div className="asc-gradient-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
                        <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{step.description}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="border-t border-border bg-surface px-4 py-16 text-center sm:px-6">
          <div className="mx-auto max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Ready to see your project take shape?
            </h2>
            <p className="mt-2 text-sm text-muted">
              No account, no sales call — just answer a few questions and get your estimate.
            </p>
            <div className="mt-6">
              <Button size="lg" onClick={() => navigate("/requirements/project-idea")}>
                <Rocket className="h-4.5 w-4.5" />
                Start Free AI Consultation
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

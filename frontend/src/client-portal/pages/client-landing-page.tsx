import { motion } from "framer-motion";
import {
  ArrowRight,
  Calculator,
  Check,
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
import {
  SCROLL_VIEWPORT,
  scrollReveal,
  staggerContainer,
  staggerItem,
} from "@/utils/motion";

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

const TRUST_POINTS = ["No account required", "Free to use", "Takes ~5 minutes"];

export function ClientLandingPage() {
  const navigate = useNavigate();
  const startFlow = () => navigate("/requirements/project-idea");

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <ClientPortalHeader />

      <main className="flex-1">
        {/* ---------------------------------------------------------------
            Hero
            --------------------------------------------------------------- */}
        <section className="relative overflow-hidden">
          {/* Ambient accent wash. pointer-events-none + aria-hidden so it stays
              purely decorative and never intercepts a click. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="asc-gradient-subtle absolute -top-40 left-1/2 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl" />
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mx-auto max-w-4xl px-4 pt-20 pb-20 text-center sm:px-6 sm:pt-28"
          >
            <motion.div variants={staggerItem}>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-medium text-foreground-soft shadow-xs backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                Free AI Consultation
              </span>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="mt-6 text-[clamp(2.25rem,1.5rem+3.4vw,4rem)] leading-[1.08] font-semibold tracking-tight text-foreground text-balance"
            >
              Turn your idea into a{" "}
              <span className="bg-[image:var(--gradient-accent)] bg-clip-text text-transparent">
                clear project plan
              </span>{" "}
              — in minutes
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted text-pretty sm:text-lg"
            >
              Describe what you want to build. Our AI asks the right follow-up questions, then
              gives you a requirement summary, feature breakdown, and project estimate — free,
              before you ever talk to a consultant.
            </motion.p>

            <motion.div
              variants={staggerItem}
              className="mt-9 flex flex-col items-center gap-4"
            >
              <Button size="lg" onClick={startFlow} className="w-full sm:w-auto">
                Start Free AI Consultation
                <ArrowRight className="h-4 w-4" />
              </Button>

              <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {TRUST_POINTS.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-1.5 text-sm text-muted"
                  >
                    <Check
                      className="h-3.5 w-3.5 shrink-0 text-success"
                      strokeWidth={2.5}
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </section>

        {/* ---------------------------------------------------------------
            Benefits
            --------------------------------------------------------------- */}
        <section className="border-y border-border bg-surface px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={SCROLL_VIEWPORT}
              variants={scrollReveal}
              className="mx-auto max-w-2xl text-center"
            >
              <h2 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-semibold tracking-tight text-foreground text-balance">
                Why start here
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted text-pretty">
                Everything you need to scope your project before the first conversation.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={SCROLL_VIEWPORT}
              variants={staggerContainer}
              className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {BENEFITS.map((benefit) => (
                <motion.div
                  key={benefit.title}
                  variants={staggerItem}
                  className="group rounded-2xl border border-border bg-canvas p-6 shadow-xs transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-lg"
                >
                  <div className="asc-gradient-subtle flex h-11 w-11 items-center justify-center rounded-xl text-accent-text transition-transform duration-300 group-hover:scale-105">
                    <benefit.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <p className="mt-5 text-base font-semibold text-foreground">
                    {benefit.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            How it works
            --------------------------------------------------------------- */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={SCROLL_VIEWPORT}
              variants={scrollReveal}
              className="text-center"
            >
              <h2 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-semibold tracking-tight text-foreground text-balance">
                How it works
              </h2>
              <p className="mt-3 text-base text-muted">
                Four steps from idea to proposal.
              </p>
            </motion.div>

            <motion.ol
              initial="hidden"
              whileInView="visible"
              viewport={SCROLL_VIEWPORT}
              variants={staggerContainer}
              className="relative mt-12 flex flex-col gap-4"
            >
              {STEPS.map((step, index) => (
                <motion.li
                  key={step.title}
                  variants={staggerItem}
                  className="relative flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs transition-[box-shadow,border-color] duration-300 hover:border-border-strong hover:shadow-md sm:p-6"
                >
                  <div className="asc-gradient-accent asc-shadow-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <step.icon
                        className="h-4 w-4 shrink-0 text-accent"
                        strokeWidth={1.85}
                      />
                      <p className="text-base font-semibold text-foreground">
                        {step.title}
                      </p>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted text-pretty">
                      {step.description}
                    </p>
                  </div>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </section>

        {/* ---------------------------------------------------------------
            Closing CTA
            --------------------------------------------------------------- */}
        <section className="px-4 pb-20 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={SCROLL_VIEWPORT}
            variants={scrollReveal}
            className="asc-gradient-accent relative mx-auto max-w-4xl overflow-hidden rounded-3xl px-6 py-14 text-center shadow-lg sm:px-12"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            />

            <h2 className="relative text-[clamp(1.5rem,1.2rem+1.4vw,2.125rem)] font-semibold tracking-tight text-white text-balance">
              Ready to see your project take shape?
            </h2>
            <p className="relative mx-auto mt-3 max-w-lg text-base leading-relaxed text-white/80 text-pretty">
              No account, no sales call — just answer a few questions and get your estimate.
            </p>
            <div className="relative mt-8">
              <Button
                size="lg"
                onClick={startFlow}
                className="border-0 bg-white bg-none text-accent shadow-md hover:bg-white hover:text-accent hover:shadow-lg"
              >
                Start Free AI Consultation
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface px-4 py-8 sm:px-6">
        <p className="text-center text-xs text-muted">
          © {new Date().getFullYear()} AI Consultant. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

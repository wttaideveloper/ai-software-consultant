import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { ClientPortalHeader } from "@/client-portal/layouts/client-portal-header";
import { ClientStepIndicator } from "@/client-portal/layouts/client-step-indicator";
import { cn } from "@/utils/cn";
import { clientPageEnter } from "@/utils/motion";

type ClientLayoutProps = {
  children: ReactNode;
  /**
   * Widens the content column from reading width to grid width.
   *
   * Wizard steps are prose and inputs, so they stay at `max-w-3xl` where a line
   * length is comfortable. The mode chooser is a 2x2 card grid, which needs more
   * room than a paragraph does — a boolean here beats letting each page pick its
   * own arbitrary max-width and drift out of alignment with the header.
   */
  wide?: boolean;
};

/** Reusable shell for every Client Portal page: logo header, step indicator, centered responsive content. */
export function ClientLayout({ children, wide = false }: ClientLayoutProps) {
  // Framer's reduced-motion handling doesn't strip the `filter` blur, so opt out
  // of the animated entrance entirely and render statically for these users.
  const reduce = useReducedMotion();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <ClientPortalHeader />

      <ClientStepIndicator />

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <motion.div
          variants={reduce ? undefined : clientPageEnter}
          initial={reduce ? false : "hidden"}
          animate={reduce ? { opacity: 1 } : "visible"}
          className={cn("mx-auto w-full", wide ? "max-w-5xl" : "max-w-3xl")}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

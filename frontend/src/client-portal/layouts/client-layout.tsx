import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { ClientPortalHeader } from "@/client-portal/layouts/client-portal-header";
import { ClientStepIndicator } from "@/client-portal/layouts/client-step-indicator";
import { clientPageEnter } from "@/utils/motion";

type ClientLayoutProps = {
  children: ReactNode;
};

/** Reusable shell for every Client Portal page: logo header, step indicator, centered responsive content. */
export function ClientLayout({ children }: ClientLayoutProps) {
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
          className="mx-auto w-full max-w-3xl"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

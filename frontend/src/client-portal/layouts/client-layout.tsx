import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ClientPortalHeader } from "@/client-portal/layouts/client-portal-header";
import { ClientStepIndicator } from "@/client-portal/layouts/client-step-indicator";
import { clientPageEnter } from "@/utils/motion";

type ClientLayoutProps = {
  children: ReactNode;
};

/** Reusable shell for every Client Portal page: logo header, step indicator, centered responsive content. */
export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <ClientPortalHeader />

      <ClientStepIndicator />

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <motion.div
          variants={clientPageEnter}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-3xl"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

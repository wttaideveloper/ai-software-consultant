import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeIn } from "@/utils/motion";
import { AuthBrandPanel } from "./auth-brand-panel";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <AuthBrandPanel />
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

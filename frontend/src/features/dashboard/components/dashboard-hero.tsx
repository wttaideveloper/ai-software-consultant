import { motion } from "framer-motion";
import { useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { formatDate } from "@/utils/format";
import { fadeIn } from "@/utils/motion";

export function DashboardHero() {
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);

  const firstName = useMemo(() => user?.fullName?.split(" ")[0] ?? "there", [user?.fullName]);
  const today = useMemo(() => formatDate(new Date()), []);

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="asc-gradient-surface relative overflow-hidden rounded-xl border border-border px-6 py-8 sm:px-10 sm:py-10"
    >
      <div
        aria-hidden
        className="asc-gradient-subtle pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-60 blur-3xl"
      />
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        {organization?.name ?? "Your workspace"} · {today}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        Welcome back, {firstName}.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
        Here&apos;s what&apos;s happening across your consulting pipeline today.
      </p>
    </motion.div>
  );
}

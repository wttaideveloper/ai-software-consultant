import { motion } from "framer-motion";
import { useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import { formatDate } from "@/utils/format";
import { fadeIn } from "@/utils/motion";

/** Greeting shifts with local time so the dashboard feels current, not canned. */
function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHero() {
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);

  const firstName = useMemo(
    () => user?.fullName?.split(" ")[0] ?? "there",
    [user?.fullName],
  );
  const today = useMemo(() => formatDate(new Date()), []);
  const greeting = useMemo(() => getGreeting(new Date().getHours()), []);

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="asc-gradient-surface relative overflow-hidden rounded-2xl border border-border px-6 py-8 shadow-sm sm:px-10 sm:py-10"
    >
      <div
        aria-hidden
        className="asc-gradient-subtle pointer-events-none absolute -top-28 -right-20 h-72 w-72 rounded-full opacity-70 blur-3xl"
      />

      <p className="relative text-xs font-medium tracking-wider text-muted uppercase">
        {organization?.name ?? "Your workspace"} · {today}
      </p>
      <h1 className="relative mt-2.5 text-[clamp(1.75rem,1.35rem+1.8vw,2.5rem)] leading-tight font-semibold tracking-tight text-foreground text-balance">
        {greeting}, {firstName}.
      </h1>
      <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-muted text-pretty md:text-base">
        Here&apos;s what&apos;s happening across your client requests today.
      </p>
    </motion.div>
  );
}

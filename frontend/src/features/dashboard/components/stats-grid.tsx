import { motion } from "framer-motion";
import { CheckCircle2, FileEdit, FolderKanban, Sparkles } from "lucide-react";
import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard-stats";
import { staggerContainer } from "@/utils/motion";
import { SectionError } from "./section-error";
import { StatCard } from "./stat-card";

export function StatsGrid() {
  const { stats, isLoading, isError, refetch } = useDashboardStats();

  if (isError) {
    return <SectionError message="Couldn't load your dashboard statistics." onRetry={refetch} />;
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        icon={FolderKanban}
        label="Total Consultations"
        value={stats.total}
        description="Across your organization"
        isLoading={isLoading}
      />
      <StatCard
        icon={Sparkles}
        label="Active Consultations"
        value={stats.active}
        description="Currently in discovery"
        isLoading={isLoading}
      />
      <StatCard
        icon={CheckCircle2}
        label="Completed Consultations"
        value={stats.completed}
        description="Successfully delivered"
        isLoading={isLoading}
      />
      <StatCard
        icon={FileEdit}
        label="Draft Consultations"
        value={stats.draft}
        description="Awaiting kickoff"
        isLoading={isLoading}
      />
    </motion.div>
  );
}

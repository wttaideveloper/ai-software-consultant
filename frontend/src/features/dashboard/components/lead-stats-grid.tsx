import { motion } from "framer-motion";
import { Archive, CheckCircle2, Inbox, PhoneCall, Sparkles } from "lucide-react";
import { SectionError } from "@/components/shared/section-error";
import { useLeadStats } from "@/features/dashboard/hooks/use-lead-stats";
import { staggerContainer } from "@/utils/motion";
import { StatCard } from "./stat-card";

/**
 * Five KPIs: the total plus one per member of the client_lead_status pgEnum.
 * Five columns at xl so the pipeline reads left-to-right in stage order
 * (New → Contacted → Converted → Closed) instead of wrapping mid-funnel.
 */
export function LeadStatsGrid() {
  const { stats, isLoading, isError, refetch } = useLeadStats();

  if (isError) {
    return <SectionError message="Couldn't load your client request statistics." onRetry={refetch} />;
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <StatCard
        icon={Inbox}
        label="Total Client Requests"
        value={stats.total}
        description="Submitted from the client portal"
        isLoading={isLoading}
      />
      <StatCard
        icon={Sparkles}
        label="New Leads"
        value={stats.new}
        description="Awaiting first contact"
        isLoading={isLoading}
      />
      <StatCard
        icon={PhoneCall}
        label="Contacted Leads"
        value={stats.contacted}
        description="Follow-up in progress"
        isLoading={isLoading}
      />
      <StatCard
        icon={CheckCircle2}
        label="Converted Leads"
        value={stats.converted}
        description="Won after a proposal"
        isLoading={isLoading}
      />
      <StatCard
        icon={Archive}
        label="Closed Leads"
        value={stats.closed}
        description="No longer being pursued"
        isLoading={isLoading}
      />
    </motion.div>
  );
}

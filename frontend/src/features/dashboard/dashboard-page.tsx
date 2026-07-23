import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ActivitySection } from "@/features/dashboard/components/activity-section";
import { DashboardHero } from "@/features/dashboard/components/dashboard-hero";
import { LeadStatsGrid } from "@/features/dashboard/components/lead-stats-grid";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { RecentClientRequestsTable } from "@/features/dashboard/components/recent-client-requests-table";

const SECTION_TRANSITION = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

type DashboardSectionProps = {
  title?: string;
  description?: string;
  delay: number;
  children: ReactNode;
};

function DashboardSection({ title, description, delay, children }: DashboardSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SECTION_TRANSITION, delay }}
    >
      {title ? (
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="text-sm text-muted">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </motion.section>
  );
}

/**
 * Sales dashboard for the client-request workflow:
 * Client Portal → Client Request → Lead Details → Proposal → Lead Status.
 *
 * Everything here reads from client_leads. The old consultation widgets (totals
 * by consultation status, recent consultations, AI progress, Create Consultation
 * and Open AI Chat) belonged to the retired discovery pipeline and are gone —
 * those routes still exist, they are simply no longer surfaced here.
 */
export function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHero />

      <DashboardSection delay={0.1}>
        <LeadStatsGrid />
      </DashboardSection>

      <DashboardSection
        title="Recent Client Requests"
        description="The latest submissions from the client portal."
        delay={0.18}
      >
        <RecentClientRequestsTable />
      </DashboardSection>

      <DashboardSection title="Quick Actions" delay={0.26}>
        <QuickActions />
      </DashboardSection>

      <DashboardSection
        title="Recent Activity"
        description="Lead created events — the only actions this system records today."
        delay={0.34}
      >
        <ActivitySection />
      </DashboardSection>
    </div>
  );
}

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ActivitySection } from "@/features/dashboard/components/activity-section";
import { DashboardHero } from "@/features/dashboard/components/dashboard-hero";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { RecentConsultationsTable } from "@/features/dashboard/components/recent-consultations-table";
import { StatsGrid } from "@/features/dashboard/components/stats-grid";

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

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHero />

      <DashboardSection delay={0.1}>
        <StatsGrid />
      </DashboardSection>

      <DashboardSection
        title="Recent Consultations"
        description="Your latest discovery pipelines."
        delay={0.18}
      >
        <RecentConsultationsTable />
      </DashboardSection>

      <DashboardSection title="Quick Actions" delay={0.26}>
        <QuickActions />
      </DashboardSection>

      <DashboardSection title="Activity" delay={0.34}>
        <ActivitySection />
      </DashboardSection>
    </div>
  );
}

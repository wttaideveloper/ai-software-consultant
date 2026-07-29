import { motion } from "framer-motion";
import { AlertTriangle, Calculator, Calendar, Gauge, Lightbulb, ListChecks, Sparkles, Users } from "lucide-react";
import {
  adjustTimelineWeeks,
  formatAdjustedWeeks,
} from "@/client-portal/estimate/estimate-pricing";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { RequirementSummarySection } from "@/features/requirement-summary/components/requirement-summary-section";
import type { Estimation, EstimationComplexity } from "@/types";
import { staggerContainer, staggerItem } from "@/utils/motion";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger";

const COMPLEXITY_META: Record<EstimationComplexity, { label: string; variant: BadgeVariant }> = {
  LOW: { label: "Low Complexity", variant: "default" },
  MEDIUM: { label: "Medium Complexity", variant: "warning" },
  HIGH: { label: "High Complexity", variant: "danger" },
};

type EstimationDocumentProps = {
  estimation: Estimation;
};

export function EstimationDocument({ estimation }: EstimationDocumentProps) {
  const totalHours = estimation.estimatedHours || 1;
  const assumptions = estimation.assumptions
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const executiveSummary = `This project is estimated at ${estimation.estimatedHours} development hours (~${formatAdjustedWeeks(estimation.estimatedWeeks)}) with a recommended team of ${estimation.estimatedTeamSize}. Overall complexity is assessed as ${estimation.complexity.toLowerCase()}, with ${Math.round(estimation.confidenceScore * 100)}% AI confidence in this estimate.`;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6 p-4 sm:p-6"
    >
      <motion.div variants={staggerItem}>
        <Card hover={false}>
          <CardHeader>
            <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
              <Sparkles className="h-4 w-4" strokeWidth={1.85} />
            </div>
          </CardHeader>
          <CardTitle>Executive Summary</CardTitle>
          <p className="mt-3 text-sm leading-relaxed text-foreground-soft">{executiveSummary}</p>
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div variants={staggerItem}>
          <StatCard
            icon={Calculator}
            label="Estimated Development Hours"
            value={estimation.estimatedHours}
            description="Total engineering effort"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            icon={Calendar}
            label="Estimated Timeline"
            value={adjustTimelineWeeks(estimation.estimatedWeeks)}
            description="Weeks, at the recommended team size"
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            icon={Users}
            label="Recommended Team Size"
            value={estimation.estimatedTeamSize}
            description="Concurrent contributors"
          />
        </motion.div>
      </div>

      <motion.div variants={staggerItem}>
        <Card hover={false}>
          <CardHeader>
            <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
              <Gauge className="h-4 w-4" strokeWidth={1.85} />
            </div>
          </CardHeader>
          <CardTitle>Complexity Assessment</CardTitle>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={COMPLEXITY_META[estimation.complexity].variant}>
              {COMPLEXITY_META[estimation.complexity].label}
            </Badge>
            <span className="text-xs text-muted">
              {Math.round(estimation.confidenceScore * 100)}% AI confidence
            </span>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card hover={false}>
          <CardHeader>
            <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
              <ListChecks className="h-4 w-4" strokeWidth={1.85} />
            </div>
          </CardHeader>
          <CardTitle>Feature Breakdown</CardTitle>
          <div className="mt-3">
            <Table>
              <THead>
                <TR>
                  <TH>Category</TH>
                  <TH>Estimated Hours</TH>
                  <TH>% of Total</TH>
                </TR>
              </THead>
              <TBody>
                {estimation.breakdown.map((item, index) => (
                  <TR key={`${item.category}-${index}`}>
                    <TD className="font-medium text-foreground">{item.category}</TD>
                    <TD>{item.hours}h</TD>
                    <TD>{Math.round((item.hours / totalHours) * 100)}%</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RequirementSummarySection icon={Lightbulb} title="Project Assumptions" items={assumptions} />
        <RequirementSummarySection icon={AlertTriangle} title="Project Risks" items={estimation.risks} />
      </div>
    </motion.div>
  );
}

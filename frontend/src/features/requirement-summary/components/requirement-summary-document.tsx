import { motion } from "framer-motion";
import {
  FileText,
  Gauge,
  HelpCircle,
  Layers,
  Lightbulb,
  Plug,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { MarkdownViewer } from "@/components/shared/markdown-viewer";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RequirementSummarySection } from "@/features/requirement-summary/components/requirement-summary-section";
import type { RequirementSummary } from "@/types";
import { staggerContainer, staggerItem } from "@/utils/motion";

type RequirementSummaryDocumentProps = {
  summary: RequirementSummary;
};

export function RequirementSummaryDocument({ summary }: RequirementSummaryDocumentProps) {
  const structured = summary.structuredSummary;

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
              <FileText className="h-4 w-4" strokeWidth={1.85} />
            </div>
          </CardHeader>
          <CardTitle>Summary</CardTitle>
          <MarkdownViewer content={summary.summary} className="mt-3" />
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <motion.div variants={staggerItem}>
          <Card hover={false} className="h-full">
            <CardHeader>
              <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
                <Layers className="h-4 w-4" strokeWidth={1.85} />
              </div>
            </CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Project name</dt>
                <dd className="text-right font-medium text-foreground">
                  {structured.projectName || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Project type</dt>
                <dd className="text-right font-medium text-foreground">
                  {structured.projectType || "—"}
                </dd>
              </div>
            </dl>
          </Card>
        </motion.div>

        <RequirementSummarySection icon={Target} title="Business Goals" items={structured.businessGoals} />
        <RequirementSummarySection icon={Users} title="Target Users" items={structured.targetUsers} />
        <RequirementSummarySection icon={Sparkles} title="Core Features" items={structured.coreFeatures} />
        <RequirementSummarySection icon={ShieldCheck} title="Admin Features" items={structured.adminFeatures} />
        <RequirementSummarySection icon={Plug} title="Integrations" items={structured.integrations} />
        <RequirementSummarySection
          icon={Gauge}
          title="Non-Functional Requirements"
          items={structured.nonFunctionalRequirements}
        />
        <RequirementSummarySection icon={Lightbulb} title="Assumptions" items={structured.assumptions} />
        <RequirementSummarySection icon={HelpCircle} title="Open Questions" items={structured.openQuestions} />
      </div>
    </motion.div>
  );
}

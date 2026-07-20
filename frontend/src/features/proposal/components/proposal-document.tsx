import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { MarkdownViewer } from "@/components/shared/markdown-viewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PROPOSAL_STATUS_META } from "@/features/proposal/proposal-status";
import { RequirementSummarySection } from "@/features/requirement-summary/components/requirement-summary-section";
import type { Proposal } from "@/types";
import { staggerContainer, staggerItem } from "@/utils/motion";

type ProposalDocumentProps = {
  proposal: Proposal;
};

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ProposalDocument({ proposal }: ProposalDocumentProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6 p-4 sm:p-6"
    >
      <motion.div variants={staggerItem}>
        <Card hover={false}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted uppercase">Proposal</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                {proposal.title}
              </h2>
            </div>
            <Badge variant={PROPOSAL_STATUS_META[proposal.status].variant}>
              {PROPOSAL_STATUS_META[proposal.status].label}
            </Badge>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card hover={false}>
          <CardHeader>
            <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
              <Sparkles className="h-4 w-4" strokeWidth={1.85} />
            </div>
          </CardHeader>
          <CardTitle>Executive Summary</CardTitle>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-foreground-soft">
            {proposal.executiveSummary}
          </p>
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RequirementSummarySection
          icon={ListChecks}
          title="Project Scope"
          items={proposal.scopeOfWork}
        />
        <RequirementSummarySection
          icon={CheckCircle2}
          title="Deliverables"
          items={proposal.deliverables}
        />
      </div>

      <motion.div variants={staggerItem}>
        <Card hover={false}>
          <CardHeader>
            <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
              <Calendar className="h-4 w-4" strokeWidth={1.85} />
            </div>
          </CardHeader>
          <CardTitle>Timeline</CardTitle>
          <p className="mt-3 text-sm text-foreground-soft">{proposal.timeline}</p>
        </Card>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RequirementSummarySection
          icon={AlertTriangle}
          title="Assumptions"
          items={splitLines(proposal.assumptions)}
        />
        <RequirementSummarySection
          icon={Ban}
          title="Exclusions"
          items={splitLines(proposal.exclusions)}
        />
      </div>

      <motion.div variants={staggerItem}>
        <Card hover={false}>
          <CardHeader>
            <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
              <DollarSign className="h-4 w-4" strokeWidth={1.85} />
            </div>
          </CardHeader>
          <CardTitle>Pricing Notes</CardTitle>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-foreground-soft">
            {proposal.pricingNotes}
          </p>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Card hover={false}>
          <CardHeader>
            <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
              <FileText className="h-4 w-4" strokeWidth={1.85} />
            </div>
          </CardHeader>
          <CardTitle>Proposal Document</CardTitle>
          <MarkdownViewer content={proposal.proposalMarkdown} className="mt-3" />
        </Card>
      </motion.div>
    </motion.div>
  );
}

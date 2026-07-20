import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Calculator,
  FileText,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { staggerContainer, staggerItem } from "@/utils/motion";

const highlights = [
  {
    title: "Consultations",
    description: "Start discovery conversations and capture client intent.",
    href: "/consultations",
    icon: FolderKanban,
  },
  {
    title: "Requirement Summary",
    description: "Turn chat history into structured product requirements.",
    href: "/requirement-summary",
    icon: FileText,
  },
  {
    title: "Detected Features",
    description: "Extract prioritized feature sets from summaries.",
    href: "/detected-features",
    icon: Sparkles,
  },
  {
    title: "Estimations",
    description: "Generate effort models grounded in feature complexity.",
    href: "/estimations",
    icon: Calculator,
  },
];

export function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your AI consulting workspace. Orchestrate discovery, scope, estimation, and proposals from one calm surface."
        actions={
          <Link to="/consultations">
            <Button>
              New consultation
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.href} variants={staggerItem}>
              <Link to={item.href} className="block h-full">
                <Card className="h-full">
                  <CardHeader>
                    <div className="asc-gradient-accent flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm shadow-accent/20">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <Badge variant="accent">Ready</Badge>
                  </CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      <Card className="mt-6" hover={false}>
        <CardHeader>
          <div>
            <CardTitle>Pipeline overview</CardTitle>
            <CardDescription>
              Live metrics and consultation activity will appear here once APIs
              are connected.
            </CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          {["Active consultations", "Features detected", "Proposals drafted"].map(
            (label) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-surface-muted px-4 py-5"
              >
                <p className="text-xs font-medium tracking-wide text-muted uppercase">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">—</p>
              </div>
            ),
          )}
        </div>
      </Card>
    </div>
  );
}

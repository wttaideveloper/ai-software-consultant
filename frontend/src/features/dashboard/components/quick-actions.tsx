import { motion } from "framer-motion";
import { FolderPlus, Library, MessageSquareText, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { staggerContainer, staggerItem } from "@/utils/motion";

type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Create Consultation",
    description: "Start a new discovery pipeline",
    href: "/consultations",
    icon: FolderPlus,
  },
  {
    label: "Open AI Chat",
    description: "Continue a discovery conversation",
    href: "/chat",
    icon: MessageSquareText,
  },
  {
    label: "Feature Library",
    description: "Browse reusable feature templates",
    href: "/feature-library",
    icon: Library,
  },
  {
    label: "Users",
    description: "Manage your team and roles",
    href: "/users",
    icon: Users,
  },
];

export function QuickActions() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <motion.div key={action.href} variants={staggerItem}>
            <Link to={action.href} className="block h-full">
              <Card className="h-full">
                <div className="asc-gradient-subtle flex h-10 w-10 items-center justify-center rounded-xl text-accent">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">{action.label}</p>
                <p className="mt-1 text-xs text-muted">{action.description}</p>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

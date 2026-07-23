import {
  BookOpen,
  Calculator,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Library,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AppNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type AppNavGroup = {
  /** Section caption. Hidden while the sidebar is collapsed. */
  title: string;
  items: AppNavItem[];
};

/**
 * Grouped navigation. The nine destinations map onto three mental models —
 * where you work, the AI pipeline's stages in the order they run, and
 * workspace administration — so the sidebar scans as three short lists
 * instead of one flat nine-item column.
 */
export const APP_NAV_GROUPS: AppNavGroup[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Consultations", href: "/consultations", icon: FolderKanban },
    ],
  },
  {
    title: "Discovery Pipeline",
    items: [
      { label: "Requirement Summary", href: "/requirement-summary", icon: FileText },
      { label: "Detected Features", href: "/detected-features", icon: Sparkles },
      { label: "Estimations", href: "/estimations", icon: Calculator },
      { label: "Proposals", href: "/proposals", icon: BookOpen },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Feature Library", href: "/feature-library", icon: Library },
      { label: "Users", href: "/users", icon: Users },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/** Flat list, kept for any consumer that needs every destination at once. */
export const APP_NAV_ITEMS: AppNavItem[] = APP_NAV_GROUPS.flatMap(
  (group) => group.items,
);

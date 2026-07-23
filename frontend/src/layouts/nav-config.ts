import {
  Coins,
  FileSignature,
  Inbox,
  LayoutDashboard,
  Library,
  Settings,
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
 * Admin navigation.
 *
 * Client Requests is the primary workflow: leads arriving from the public
 * Client Portal are the entry point to everything else.
 *
 * Consultations (and the rest of the old AI discovery pipeline — Chat,
 * Requirement Summary, Detected Features, Estimations) are deliberately absent.
 * Those modules and their routes still exist and remain reachable by URL; they
 * are only unlinked from navigation.
 */
export const APP_NAV_GROUPS: AppNavGroup[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Client Requests", href: "/client-requests", icon: Inbox },
    ],
  },
  {
    title: "Delivery",
    items: [
      { label: "Proposal Management", href: "/proposals", icon: FileSignature },
      { label: "Feature Library", href: "/feature-library", icon: Library },
      { label: "Cost Settings", href: "/cost-settings", icon: Coins },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Users", href: "/users", icon: Users },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/** Flat list, kept for any consumer that needs every destination at once. */
export const APP_NAV_ITEMS: AppNavItem[] = APP_NAV_GROUPS.flatMap(
  (group) => group.items,
);

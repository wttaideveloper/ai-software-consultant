import {
  BookOpen,
  Calculator,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Library,
  MessageSquareText,
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

export const APP_NAV_ITEMS: AppNavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Consultations", href: "/consultations", icon: FolderKanban },
  { label: "Requirement Summary", href: "/requirement-summary", icon: FileText },
  { label: "Detected Features", href: "/detected-features", icon: Sparkles },
  { label: "Estimations", href: "/estimations", icon: Calculator },
  { label: "Proposals", href: "/proposals", icon: BookOpen },
  { label: "Feature Library", href: "/feature-library", icon: Library },
  { label: "Users", href: "/users", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const SECONDARY_NAV = [
  { label: "Chat", href: "/chat", icon: MessageSquareText },
] as const;

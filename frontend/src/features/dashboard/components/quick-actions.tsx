import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { APP_NAV_ITEMS } from "@/layouts/nav-config";
import { staggerContainer, staggerItem } from "@/utils/motion";

/**
 * The five destinations of the sales workflow, in workflow order.
 *
 * Labels and icons are looked up from APP_NAV_ITEMS by href rather than restated
 * here, so a rename in nav-config can't leave the dashboard showing a stale name
 * or a link the sidebar no longer has. Only the descriptions are local — the
 * sidebar has no room for them.
 */
const QUICK_ACTION_DESCRIPTIONS: Record<string, string> = {
  "/client-requests": "Review incoming leads",
  "/proposals": "Build and send proposals",
  "/feature-library": "Browse reusable feature templates",
  "/users": "Manage your team and roles",
  "/settings": "Organization and account preferences",
};

const QUICK_ACTIONS = [
  "/client-requests",
  "/proposals",
  "/feature-library",
  "/users",
  "/settings",
].flatMap((href) => {
  const navItem = APP_NAV_ITEMS.find((item) => item.href === href);
  return navItem ? [{ ...navItem, description: QUICK_ACTION_DESCRIPTIONS[href] ?? "" }] : [];
});

export function QuickActions() {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <motion.div key={action.href} variants={staggerItem}>
            <Link to={action.href} className="block h-full">
              <Card className="h-full">
                <div className="asc-gradient-subtle flex h-10 w-10 items-center justify-center rounded-xl text-accent">
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.85} />
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

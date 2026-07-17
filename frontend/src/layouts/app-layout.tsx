import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { Drawer } from "@/components/ui/drawer";
import { Navbar } from "@/layouts/navbar";
import { Sidebar } from "@/layouts/sidebar";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/utils/cn";
import { pageTransition } from "@/utils/motion";

export function AppLayout() {
  const location = useLocation();
  const { sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useUiStore();

  return (
    <div className="flex min-h-dvh bg-canvas">
      <motion.div
        initial={false}
        animate={{ width: sidebarCollapsed ? 76 : 260 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="sticky top-0 hidden h-dvh shrink-0 lg:block"
      >
        <Sidebar className="w-full" />
      </motion.div>

      <Drawer
        open={mobileSidebarOpen}
        onClose={closeMobileSidebar}
        title="Navigation"
        side="left"
      >
        <Sidebar
          embedded
          onNavigate={closeMobileSidebar}
          className="border-0 bg-transparent"
        />
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className={cn("flex-1 px-4 py-6 lg:px-8 lg:py-8")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto w-full max-w-7xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

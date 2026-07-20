import { PanelLeft } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

type SplitWorkspaceLayoutProps = {
  /** Left panel content (desktop: fixed 320px column; mobile: inside a Drawer). */
  listPanel: ReactNode;
  /** Right panel content. */
  children: ReactNode;
  drawerTitle?: string;
};

/**
 * Shared list+detail shell (320px list panel on desktop, Drawer on mobile).
 * Extracted for reuse across consultation-scoped workspace pages.
 */
export function SplitWorkspaceLayout({
  listPanel,
  children,
  drawerTitle = "Browse",
}: SplitWorkspaceLayoutProps) {
  const [mobileListOpen, setMobileListOpen] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-140 gap-4">
      <div className="hidden w-[320px] shrink-0 overflow-hidden rounded-xl border border-border bg-surface lg:block">
        {listPanel}
      </div>

      <Drawer
        open={mobileListOpen}
        onClose={() => setMobileListOpen(false)}
        title={drawerTitle}
        side="left"
      >
        {listPanel}
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center border-b border-border px-4 py-2 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setMobileListOpen(true)}>
            <PanelLeft className="h-4 w-4" />
            {drawerTitle}
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

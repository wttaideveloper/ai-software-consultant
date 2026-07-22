import { Hexagon } from "lucide-react";
import { Link } from "react-router-dom";

/** Brand header shared by every Client Portal shell (ClientLayout and WizardLayout). */
export function ClientPortalHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Link to="/portal" className="flex items-center gap-2.5">
          <div className="asc-gradient-accent flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm shadow-accent/25">
            <Hexagon className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">Consultant</p>
            <p className="text-[11px] text-muted">AI Platform</p>
          </div>
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          Staff sign in
        </Link>
      </div>
    </header>
  );
}

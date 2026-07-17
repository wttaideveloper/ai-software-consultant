import { FolderKanban, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function ConsultationsPage() {
  return (
    <div>
      <PageHeader
        title="Consultations"
        description="Manage client discovery sessions. Each consultation feeds summaries, features, estimates, and proposals."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New consultation
          </Button>
        }
      />
      <EmptyState
        icon={FolderKanban}
        title="No consultations yet"
        description="Create your first consultation to begin an AI-guided discovery conversation with a client."
        action={
          <Link to="/chat">
            <Button variant="secondary">Open chat workspace</Button>
          </Link>
        }
      />
    </div>
  );
}

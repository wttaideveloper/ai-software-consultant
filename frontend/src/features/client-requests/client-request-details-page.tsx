import { ArrowLeft, FileSearch } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Placeholder target for the Client Requests row action.
 *
 * Intentionally not built out yet — this route exists so "Open" has somewhere
 * to navigate. The lead id is read from the URL and shown so the routing can be
 * verified end to end; the detail view itself is a separate piece of work.
 */
export function ClientRequestDetailsPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        eyebrow="Client Requests"
        title="Request Details"
        description="The full lead detail view — contact information, requirement summary, feature list and estimate — is not built yet."
        actions={
          <Button variant="secondary" onClick={() => navigate("/client-requests")}>
            <ArrowLeft className="h-4 w-4" />
            Back to requests
          </Button>
        }
      />

      <EmptyState
        icon={FileSearch}
        title="Lead details coming soon"
        description={
          leadId
            ? `This page will show the full submission for request ${leadId}.`
            : "This page will show the full client submission."
        }
      />
    </div>
  );
}

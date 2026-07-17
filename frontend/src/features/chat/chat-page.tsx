import { MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export function ChatPage() {
  return (
    <div>
      <PageHeader
        title="Chat"
        description="Conversational discovery workspace. Messages and AI replies will stream here after API integration."
        actions={<Button variant="secondary">Attach context</Button>}
      />
      <EmptyState
        icon={MessageSquareText}
        title="Start a discovery conversation"
        description="Select a consultation to chat with the AI consultant. Clarifying questions, decisions, and requirements will land here."
      />
    </div>
  );
}

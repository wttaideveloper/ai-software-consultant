import { MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export function ChatPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Chat"
        description="Conversational discovery workspace. Messages and AI replies will stream here after API integration."
        actions={<Button variant="secondary">Attach context</Button>}
      />
      <div className="asc-gradient-surface rounded-xl border border-border px-2 py-4 sm:px-6 sm:py-8">
        <EmptyState
          icon={MessageSquareText}
          title="Start a discovery conversation"
          description="Select a consultation to chat with the AI consultant. Clarifying questions, decisions, and requirements will land here."
          className="border-0 bg-transparent py-12"
        />
      </div>
    </div>
  );
}

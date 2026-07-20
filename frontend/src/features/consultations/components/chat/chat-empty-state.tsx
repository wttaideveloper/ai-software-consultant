import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function ChatEmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <EmptyState
        icon={Sparkles}
        title="Start the conversation"
        description="Ask a question or describe the project to begin AI-guided discovery."
        className="border-0 bg-transparent py-6"
      />
    </div>
  );
}

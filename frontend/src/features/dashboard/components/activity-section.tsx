import { History } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function ActivitySection() {
  return (
    <EmptyState
      icon={History}
      title="No recent activity"
      description="Activity such as AI generations, status changes, and team updates will appear here once available."
      className="py-12"
    />
  );
}

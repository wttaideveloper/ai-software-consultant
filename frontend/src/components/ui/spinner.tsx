import { cn } from "@/utils/cn";

type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-muted", className)} role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-r-transparent" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

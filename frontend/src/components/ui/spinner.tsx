import { cn } from "@/utils/cn";

type SpinnerSize = "sm" | "md" | "lg";

type SpinnerProps = {
  className?: string;
  label?: string;
  size?: SpinnerSize;
};

const sizes: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function Spinner({ className, label = "Loading", size = "md" }: SpinnerProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-2 text-muted", className)}
      role="status"
    >
      <span
        className={cn(
          "animate-spin rounded-full border-accent border-r-transparent",
          sizes[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Spinner size="lg" label={label} />
      <p className="text-sm text-muted">{label}…</p>
    </div>
  );
}

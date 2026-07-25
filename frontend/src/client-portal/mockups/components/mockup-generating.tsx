import { Check, Loader2, Sparkles } from "lucide-react";

/**
 * Friendly "AI is working" panel shown while a batch is in flight.
 *
 * The steps mirror the real two-stage pipeline (plan the screens, then render
 * them), so the client sees honest progress: planning is quick and shown done,
 * the image rendering is the long stage and shown active. No fake percentage.
 */
const STEPS = [
  { label: "Understanding your project", done: true },
  { label: "Planning your app screens", done: true },
  { label: "Designing concept mockups", done: false },
];

export function MockupGenerating() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-border bg-surface-muted/40 px-6 py-14 text-center">
      <div className="relative">
        <div
          aria-hidden
          className="asc-gradient-subtle absolute inset-0 -z-10 scale-150 rounded-full opacity-70 blur-xl"
        />
        <div className="asc-gradient-accent flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm">
          <Sparkles className="h-6 w-6 animate-pulse" strokeWidth={1.7} />
        </div>
      </div>

      <div>
        <p className="text-base font-semibold text-foreground">
          AI is creating your visual concepts…
        </p>
        <p className="mt-1 text-sm text-muted text-pretty">
          This usually takes up to a minute — your estimate is already final.
        </p>
      </div>

      <ul className="flex w-full max-w-xs flex-col gap-3 text-left">
        {STEPS.map((step) => (
          <li key={step.label} className="flex items-center gap-3 text-sm">
            {step.done ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              </span>
            )}
            <span
              className={step.done ? "text-foreground-soft" : "font-medium text-foreground"}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted">Please wait a few moments.</p>
    </div>
  );
}

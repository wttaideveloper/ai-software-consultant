import { cn } from "@/utils/cn";

/**
 * Shared control styling for every text-like form field (Input, Textarea,
 * Select, PasswordInput). Kept in its own module rather than beside
 * <FieldShell> so that file stays component-only and Fast Refresh keeps working.
 */

/** Base styles every text-like control shares. Sizing stays with the control. */
export const fieldControlBase = cn(
  "w-full rounded-lg border border-border bg-surface text-sm text-foreground shadow-xs",
  "placeholder:text-muted",
  "transition-[border-color,box-shadow,background-color] duration-200",
  "hover:border-border-strong",
  // A wide, low-opacity ring reads softer than a hard 2px outline while
  // staying clearly visible — and focus-visible keeps it off mouse clicks.
  "focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
);

export const fieldControlError = cn(
  "border-danger hover:border-danger",
  "focus:border-danger focus:ring-danger/20",
);

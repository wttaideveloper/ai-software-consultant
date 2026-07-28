import { Badge } from "@/components/ui";
import { cn } from "@/utils/cn";
import {
  getConsultationModeOption,
  type ConsultationMode,
} from "@/types/consultation-mode";

type ConsultationModeBadgeProps = {
  mode: ConsultationMode;
  className?: string;
};

/**
 * The engagement type as a compact icon + label chip.
 *
 * Shared rather than inlined because the icon/label pairing must look identical
 * wherever a mode is shown — the Client Portal chooser, the wizard header and the
 * Admin's lead record are all describing the same thing, and three hand-rolled
 * copies would drift apart on the first icon change.
 */
export function ConsultationModeBadge({
  mode,
  className,
}: ConsultationModeBadgeProps) {
  const option = getConsultationModeOption(mode);
  const Icon = option.icon;

  return (
    <Badge variant="accent" className={cn("gap-1.5", className)}>
      <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
      {option.label}
    </Badge>
  );
}

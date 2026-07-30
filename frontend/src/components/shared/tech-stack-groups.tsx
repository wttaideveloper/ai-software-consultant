import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  isUngroupedTechStack,
  toTechStackGroups,
  type TechStackGroup,
  type TechStackValue,
} from "@/types/tech-stack";
import { cn } from "@/utils/cn";
import { staggerContainer, staggerItem } from "@/utils/motion";

type TechStackGroupsProps = {
  value: TechStackValue;
  /**
   * `cards` gives each category its own surface — used where the stack is a
   * headline deliverable (the Client Portal estimate). `compact` keeps it to
   * labelled rows for a dense admin panel.
   */
  variant?: "cards" | "compact";
  /** Shown in place of the list when nothing was recorded. */
  emptyText?: string;
  className?: string;
};

/**
 * `Badge` is `whitespace-nowrap` because it is mostly used for short status
 * words in dense tables. A technology name is not that — a legacy stack holds
 * whole phrases like "Key Services: AWS for hosting, Stripe for payments", and
 * nowrap made them run straight out of their card. `tailwind-merge` lets these
 * override the base, so wrapping is opted into here rather than weakened for
 * every other Badge in the app.
 */
const CHIP_CLASS = "max-w-full whitespace-normal break-words text-left";

function TechChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="accent" className={CHIP_CLASS}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Renders a technology stack grouped by category.
 *
 * Replaces the single comma-joined line the stack used to be shown as, on every
 * surface at once — the portal, the admin lead workspace and the proposal all
 * read from this one component, so "Frontend / Backend / Database…" cannot mean
 * something different in each place.
 *
 * A legacy flat stack (one group, no category) renders as a plain chip list at
 * full width: boxing a single unlabelled group into a third-width card left an
 * empty two-thirds beside it and repeated the section's own heading.
 *
 * Empty categories never render — the backend only emits groups that have
 * technologies in them, and `toTechStackGroups` drops any that arrive empty.
 */
export function TechStackGroups({
  value,
  variant = "cards",
  emptyText = "Not available",
  className,
}: TechStackGroupsProps) {
  const groups = toTechStackGroups(value);

  if (groups.length === 0) {
    return <p className={cn("text-sm text-muted", className)}>{emptyText}</p>;
  }

  if (isUngroupedTechStack(groups)) {
    return (
      <div className={className}>
        <TechChips items={groups[0]!.items} />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn(
        "grid gap-3",
        // Categories hold anywhere from one to eight items, so they are laid out
        // as auto-fitting columns with a real minimum rather than fixed
        // breakpoints — a narrow viewport collapses to one column on its own and
        // a wide one packs without leaving a stranded card.
        variant === "cards"
          ? "grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))]"
          : "gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))]",
        className,
      )}
    >
      {groups.map((group: TechStackGroup) => (
        <motion.div
          key={group.category + group.label}
          variants={staggerItem}
          className={cn(
            "min-w-0",
            variant === "cards" && "rounded-xl border border-border bg-surface p-4",
          )}
        >
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {group.label}
          </p>
          <div className="mt-2.5">
            <TechChips items={group.items} />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

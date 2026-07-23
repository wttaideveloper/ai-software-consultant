import { cn } from "@/utils/cn";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
};

const sizes: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
  xl: "h-14 w-14 text-lg",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={cn(
          "shrink-0 rounded-full object-cover ring-1 ring-border",
          sizes[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "asc-gradient-accent inline-flex shrink-0 items-center justify-center rounded-full",
        "font-semibold text-white shadow-xs ring-1 ring-white/15",
        sizes[size],
        className,
      )}
      role="img"
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}

import { Textarea } from "@/components/ui/textarea";

type ListFieldProps = {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  rows?: number;
  placeholder?: string;
};

/**
 * Edits a string[] as one item per line.
 *
 * Several proposal fields are arrays in the data model but read as simple
 * bullet lists to a human. A line-per-item textarea keeps reordering and bulk
 * editing trivial (select-all, paste) in a way per-row inputs do not.
 *
 * Blank lines are dropped on the way out, so trailing newlines while typing
 * never produce empty bullets — the backend's list schemas reject empty strings.
 */
export function ListField({
  value,
  onChange,
  label,
  rows = 6,
  placeholder,
}: ListFieldProps) {
  return (
    <Textarea
      label={label}
      hint="One item per line"
      rows={rows}
      placeholder={placeholder}
      value={value.join("\n")}
      onChange={(event) =>
        onChange(
          event.target.value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        )
      }
    />
  );
}

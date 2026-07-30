import { ListField } from "@/features/proposal-editor/components/list-field";
import { toTechStackGroups, type TechStackGroup } from "@/types/tech-stack";

type TechStackFieldProps = {
  value: TechStackGroup[] | string[];
  onChange: (value: TechStackGroup[]) => void;
};

/**
 * Edits the proposal's technology stack one category at a time.
 *
 * A single textarea could not survive the move to a grouped stack: flattening
 * every category into one list to edit it, then guessing where each line
 * belonged on the way back, would need a copy of the backend's catalogue in the
 * browser and would silently recategorise the admin's own edits.
 *
 * Empty categories are kept in the editor rather than removed on the keystroke
 * that empties them — otherwise clearing a field to retype it would delete the
 * field. Display and export drop them (`toTechStackGroups`), so an emptied
 * category never reaches the client.
 *
 * A version authored before the engine holds a flat list; it renders here as one
 * "Technology Stack" group and is written back grouped, so editing an old draft
 * quietly upgrades it.
 */
export function TechStackField({ value, onChange }: TechStackFieldProps) {
  const groups = toTechStackGroups(value);

  if (groups.length === 0) {
    return (
      <ListField
        label="Technology stack"
        value={[]}
        // No label: an admin-typed list has no category, exactly like a legacy
        // flat stack, and both render as a plain uncategorised list.
        onChange={(items) => onChange([{ category: "OTHER", label: "", items }])}
        rows={5}
        placeholder="One technology per line"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((group, index) => (
        <ListField
          key={group.category + group.label}
          // A legacy flat stack carries no category name of its own.
          label={group.label || "Technology stack"}
          value={group.items}
          rows={4}
          placeholder="One technology per line"
          onChange={(items) =>
            onChange(
              groups.map((existing, existingIndex) =>
                existingIndex === index ? { ...existing, items } : existing,
              ),
            )
          }
        />
      ))}
    </div>
  );
}

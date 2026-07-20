import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { COMPLEXITY_META } from "@/features/detected-features/feature-badges";
import type { FeatureLibraryItem } from "@/types";
import { formatDate } from "@/utils/format";
import { fadeIn } from "@/utils/motion";

type FeatureLibraryTableProps = {
  items: FeatureLibraryItem[];
  onEdit: (item: FeatureLibraryItem) => void;
  onDelete: (item: FeatureLibraryItem) => void;
};

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-xs text-muted">—</span>;
  }

  const visible = items.slice(0, 3);
  const remaining = items.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((item) => (
        <Badge key={item} variant="default">
          {item}
        </Badge>
      ))}
      {remaining > 0 ? <Badge variant="default">+{remaining}</Badge> : null}
    </div>
  );
}

export function FeatureLibraryTable({ items, onEdit, onDelete }: FeatureLibraryTableProps) {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Table>
        <THead>
          <TR>
            <TH>Feature Name</TH>
            <TH>Category</TH>
            <TH>Complexity</TH>
            <TH>Est. Hours</TH>
            <TH>Tags</TH>
            <TH>Technologies</TH>
            <TH>Created</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {items.map((item) => (
            <TR key={item.id}>
              <TD className="font-medium text-foreground">
                <div className="flex items-center gap-2">
                  {item.name}
                  {!item.isActive ? <Badge variant="warning">Inactive</Badge> : null}
                </div>
              </TD>
              <TD>{item.category}</TD>
              <TD>
                <Badge variant={COMPLEXITY_META[item.defaultComplexity].variant}>
                  {COMPLEXITY_META[item.defaultComplexity].label}
                </Badge>
              </TD>
              <TD>{item.defaultEstimatedHours}h</TD>
              <TD>
                <ChipList items={item.tags} />
              </TD>
              <TD>
                <ChipList items={item.technologies} />
              </TD>
              <TD>{formatDate(item.createdAt)}</TD>
              <TD className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                    aria-label="Edit feature"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item)}
                    aria-label="Delete feature"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </motion.div>
  );
}

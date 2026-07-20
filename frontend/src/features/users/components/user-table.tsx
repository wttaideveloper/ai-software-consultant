import { motion } from "framer-motion";
import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useAuthStore } from "@/store/auth-store";
import type { OrgUser, UserStatus } from "@/types";
import { formatDate, formatRelativeTime } from "@/utils/format";
import { fadeIn } from "@/utils/motion";

const STATUS_VARIANT: Record<UserStatus, "success" | "default" | "danger"> = {
  active: "success",
  inactive: "default",
  suspended: "danger",
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

type UserTableProps = {
  users: OrgUser[];
  onEdit: (user: OrgUser) => void;
  onToggleStatus: (user: OrgUser) => void;
  onDelete: (user: OrgUser) => void;
};

export function UserTable({ users, onEdit, onToggleStatus, onDelete }: UserTableProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Email</TH>
            <TH>Role</TH>
            <TH>Status</TH>
            <TH>Last Login</TH>
            <TH>Created</TH>
            <TH className="text-right">Actions</TH>
          </TR>
        </THead>
        <TBody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;

            return (
              <TR key={user.id}>
                <TD>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={user.fullName} src={user.avatarUrl} size="sm" />
                    <span className="font-medium text-foreground">{user.fullName}</span>
                    {isSelf ? <Badge variant="accent">You</Badge> : null}
                  </div>
                </TD>
                <TD>{user.email}</TD>
                <TD>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length === 0 ? (
                      <span className="text-xs text-muted">—</span>
                    ) : (
                      user.roles.map((role) => (
                        <Badge key={role.id} variant="default">
                          {role.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[user.status]}>{capitalize(user.status)}</Badge>
                </TD>
                <TD>{user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}</TD>
                <TD>{formatDate(user.createdAt)}</TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(user)}
                      aria-label="Edit user"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleStatus(user)}
                      disabled={isSelf}
                      aria-label={user.status === "active" ? "Deactivate user" : "Activate user"}
                    >
                      {user.status === "active" ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(user)}
                      disabled={isSelf}
                      aria-label="Delete user"
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </motion.div>
  );
}

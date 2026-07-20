import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { SectionError } from "@/components/shared/section-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteUserDialog } from "@/features/users/components/delete-user-dialog";
import { ToggleUserStatusDialog } from "@/features/users/components/toggle-user-status-dialog";
import { UserEmptyState } from "@/features/users/components/user-empty-state";
import { UserFormModal } from "@/features/users/components/user-form-modal";
import { UserSkeleton } from "@/features/users/components/user-skeleton";
import { UserTable } from "@/features/users/components/user-table";
import { useAvailableRoles } from "@/features/users/hooks/use-available-roles";
import { useUsers } from "@/features/users/hooks/use-users";
import type { OrgUser } from "@/types";

const PAGE_SIZE = 10;

type FormModalState = {
  open: boolean;
  user: OrgUser | null;
};

export function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useUsers({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
  });
  const { data: availableRoles } = useAvailableRoles();

  const [formModal, setFormModal] = useState<FormModalState>({ open: false, user: null });
  const [toggleTarget, setToggleTarget] = useState<OrgUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgUser | null>(null);

  const users = data?.items ?? [];
  const meta = data?.meta;

  const openInviteModal = () => setFormModal({ open: true, user: null });

  return (
    <div>
      <PageHeader
        title="Users"
        description={
          meta
            ? `${meta.total} user${meta.total === 1 ? "" : "s"} in your organization.`
            : "Manage your organization's teammates, roles, and access."
        }
        actions={
          <Button onClick={openInviteModal}>
            <Plus className="h-4 w-4" />
            Invite User
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-foreground-soft" />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name or email…"
          className="pl-9"
        />
      </div>

      <div className="mt-4">
        {isError ? (
          <SectionError message="Couldn't load users." onRetry={refetch} />
        ) : isLoading ? (
          <UserSkeleton />
        ) : users.length === 0 ? (
          <UserEmptyState hasSearch={Boolean(search)} onInvite={openInviteModal} />
        ) : (
          <>
            <UserTable
              users={users}
              onEdit={(user) => setFormModal({ open: true, user })}
              onToggleStatus={setToggleTarget}
              onDelete={setDeleteTarget}
            />
            {meta && meta.totalPages > 1 ? (
              <PaginationControls
                page={meta.page}
                totalPages={meta.totalPages}
                onPrevious={() => setPage((value) => Math.max(1, value - 1))}
                onNext={() => setPage((value) => Math.min(meta.totalPages, value + 1))}
              />
            ) : null}
          </>
        )}
      </div>

      <UserFormModal
        key={formModal.user?.id ?? "create"}
        open={formModal.open}
        onClose={() => setFormModal({ open: false, user: null })}
        user={formModal.user}
        availableRoles={availableRoles ?? []}
      />

      <ToggleUserStatusDialog
        open={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        user={toggleTarget}
      />

      <DeleteUserDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        user={deleteTarget}
      />
    </div>
  );
}

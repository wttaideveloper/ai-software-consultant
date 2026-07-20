import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PasswordInput } from "@/components/ui/password-input";
import { Select } from "@/components/ui/select";
import { useCreateUser } from "@/features/users/hooks/use-create-user";
import { useUpdateUser } from "@/features/users/hooks/use-update-user";
import {
  createUserFormSchema,
  editUserFormSchema,
  USER_STATUS_OPTIONS,
  type CreateUserFormValues,
  type EditUserFormValues,
} from "@/features/users/users.schema";
import type { OrgUser, UserRole } from "@/types";

type UserFormModalProps = {
  open: boolean;
  onClose: () => void;
  user: OrgUser | null;
  availableRoles: UserRole[];
};

function RolesField({
  availableRoles,
  selectedRoleIds,
  onToggle,
  error,
}: {
  availableRoles: UserRole[];
  selectedRoleIds: string[];
  onToggle: (roleId: string) => void;
  error?: string;
}) {
  return (
    <div>
      <span className="text-sm font-medium text-foreground-soft">Roles</span>
      {availableRoles.length === 0 ? (
        <p className="mt-2 text-xs text-muted">No roles available yet.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {availableRoles.map((role) => (
            <Checkbox
              key={role.id}
              label={role.name}
              checked={selectedRoleIds.includes(role.id)}
              onChange={() => onToggle(role.id)}
            />
          ))}
        </div>
      )}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

function CreateUserForm({
  onClose,
  availableRoles,
}: {
  onClose: () => void;
  availableRoles: UserRole[];
}) {
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: { fullName: "", email: "", password: "", phone: "", roleIds: [] },
  });

  const selectedRoleIds = watch("roleIds");

  const toggleRole = (roleId: string) => {
    const next = selectedRoleIds.includes(roleId)
      ? selectedRoleIds.filter((id) => id !== roleId)
      : [...selectedRoleIds, roleId];
    setValue("roleIds", next, { shouldValidate: true });
  };

  const onSubmit = (values: CreateUserFormValues) => {
    createUser.mutate(
      {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone?.trim() || undefined,
        roleIds: values.roleIds,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
      <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
      <PasswordInput
        label="Password"
        hint="At least 8 characters, with upper/lowercase, a number, and a symbol."
        error={errors.password?.message}
        {...register("password")}
      />
      <Input label="Phone" error={errors.phone?.message} {...register("phone")} />

      <RolesField
        availableRoles={availableRoles}
        selectedRoleIds={selectedRoleIds}
        onToggle={toggleRole}
        error={errors.roleIds?.message}
      />

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={createUser.isPending}>
          Cancel
        </Button>
        <Button type="submit" isLoading={createUser.isPending}>
          Invite User
        </Button>
      </div>
    </form>
  );
}

function EditUserForm({
  user,
  onClose,
  availableRoles,
}: {
  user: OrgUser;
  onClose: () => void;
  availableRoles: UserRole[];
}) {
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      fullName: user.fullName,
      phone: user.phone ?? "",
      status: user.status,
      roleIds: user.roles.map((role) => role.id),
    },
  });

  const selectedRoleIds = watch("roleIds");

  const toggleRole = (roleId: string) => {
    const next = selectedRoleIds.includes(roleId)
      ? selectedRoleIds.filter((id) => id !== roleId)
      : [...selectedRoleIds, roleId];
    setValue("roleIds", next, { shouldValidate: true });
  };

  const onSubmit = (values: EditUserFormValues) => {
    updateUser.mutate(
      {
        id: user.id,
        payload: {
          fullName: values.fullName,
          phone: values.phone?.trim() || null,
          status: values.status,
          roleIds: values.roleIds,
        },
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
      <Input label="Email" value={user.email} disabled hint="Email cannot be changed." />
      <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
      <Select label="Status" options={USER_STATUS_OPTIONS} {...register("status")} />

      <RolesField
        availableRoles={availableRoles}
        selectedRoleIds={selectedRoleIds}
        onToggle={toggleRole}
        error={errors.roleIds?.message}
      />

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={updateUser.isPending}>
          Cancel
        </Button>
        <Button type="submit" isLoading={updateUser.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

export function UserFormModal({ open, onClose, user, availableRoles }: UserFormModalProps) {
  const isEditMode = Boolean(user);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditMode ? "Edit user" : "Invite user"}
      description={
        isEditMode
          ? "Update this teammate's details, status, and roles."
          : "Create an account for a new teammate and assign their roles."
      }
    >
      {isEditMode && user ? (
        <EditUserForm user={user} onClose={onClose} availableRoles={availableRoles} />
      ) : (
        <CreateUserForm onClose={onClose} availableRoles={availableRoles} />
      )}
    </Modal>
  );
}

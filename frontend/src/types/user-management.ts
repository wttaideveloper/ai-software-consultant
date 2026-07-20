export type UserStatus = "active" | "inactive" | "suspended";

export type UserRole = {
  id: string;
  name: string;
  slug: string;
};

/** Named distinctly from `User` (types/auth.ts, the logged-in session user) to avoid a barrel export collision. */
export type OrgUser = {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: UserRole[];
};

export type ListOrgUsersParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type CreateOrgUserPayload = {
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
  avatarUrl?: string | null;
  roleIds: string[];
};

export type UpdateOrgUserPayload = {
  fullName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status?: UserStatus;
  roleIds?: string[];
};

export type User = {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  billingEmail: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  user: User;
  organization: Organization;
  accessToken: string;
  refreshToken: string;
};

export type CurrentUserResponse = {
  user: User;
  organization: Organization;
};

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
  timestamp: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors: unknown[];
  timestamp: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

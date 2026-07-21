export type UserTheme = "light" | "dark" | "system";

export type OrganizationSettings = {
  language: string;
  timezone: string;
  onboardingCompleted: boolean;
};

export type UpdateOrganizationSettingsPayload = Partial<OrganizationSettings>;

export type UserSettings = {
  language: string;
  theme: UserTheme;
  notificationsEnabled: boolean;
};

export type UpdateUserSettingsPayload = Partial<UserSettings>;

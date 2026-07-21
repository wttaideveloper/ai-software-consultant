export type OrganizationSettingsDto = {
  language: string;
  timezone: string;
  onboardingCompleted: boolean;
};

export type UserSettingsDto = {
  language: string;
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
};

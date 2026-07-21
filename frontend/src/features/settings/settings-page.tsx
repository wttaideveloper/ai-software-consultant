import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { SectionError } from "@/components/shared/section-error";
import { OrganizationSettingsSection } from "@/features/settings/components/organization-settings-section";
import { SettingsSkeleton } from "@/features/settings/components/settings-skeleton";
import { UserSettingsSection } from "@/features/settings/components/user-settings-section";
import { useOrganizationSettings } from "@/features/settings/hooks/use-organization-settings";
import { useUserSettings } from "@/features/settings/hooks/use-user-settings";
import { staggerContainer } from "@/utils/motion";

export function SettingsPage() {
  const {
    data: organizationSettings,
    isLoading: isLoadingOrg,
    isError: isErrorOrg,
    refetch: refetchOrg,
  } = useOrganizationSettings();

  const {
    data: userSettings,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    refetch: refetchUser,
  } = useUserSettings();

  const isLoading = isLoadingOrg || isLoadingUser;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your organization defaults and personal preferences."
      />

      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          {isErrorOrg || !organizationSettings ? (
            <SectionError message="Couldn't load organization settings." onRetry={refetchOrg} />
          ) : (
            <OrganizationSettingsSection settings={organizationSettings} />
          )}

          {isErrorUser || !userSettings ? (
            <SectionError message="Couldn't load your settings." onRetry={refetchUser} />
          ) : (
            <UserSettingsSection settings={userSettings} />
          )}
        </motion.div>
      )}
    </div>
  );
}

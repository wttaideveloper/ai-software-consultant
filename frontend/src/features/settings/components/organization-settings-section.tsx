import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Building2, Pencil } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useUpdateOrganizationSettings } from "@/features/settings/hooks/use-update-organization-settings";
import {
  organizationSettingsFormSchema,
  type OrganizationSettingsFormValues,
} from "@/features/settings/settings.schema";
import type { OrganizationSettings } from "@/types";
import { staggerItem } from "@/utils/motion";

type OrganizationSettingsSectionProps = {
  settings: OrganizationSettings;
};

export function OrganizationSettingsSection({ settings }: OrganizationSettingsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateSettings = useUpdateOrganizationSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsFormSchema),
    defaultValues: settings,
  });

  const startEditing = () => {
    reset(settings);
    setIsEditing(true);
  };

  const onSubmit = (values: OrganizationSettingsFormValues) => {
    updateSettings.mutate(values, { onSuccess: () => setIsEditing(false) });
  };

  return (
    <motion.div variants={staggerItem}>
      <Card hover={false}>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
              <Building2 className="h-4 w-4" strokeWidth={1.85} />
            </div>
            <CardTitle>Organization Settings</CardTitle>
          </div>
          {!isEditing ? (
            <Button variant="ghost" size="sm" onClick={startEditing}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          ) : null}
        </CardHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Language" error={errors.language?.message} {...register("language")} />
              <Input label="Timezone" error={errors.timezone?.message} {...register("timezone")} />
            </div>
            <Checkbox label="Onboarding completed" {...register("onboardingCompleted")} />
            <div className="mt-1 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={updateSettings.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={updateSettings.isPending}>
                Save
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Language</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{settings.language}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Timezone</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{settings.timezone}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Onboarding</dt>
              <dd className="mt-1">
                <Badge variant={settings.onboardingCompleted ? "success" : "default"}>
                  {settings.onboardingCompleted ? "Completed" : "Incomplete"}
                </Badge>
              </dd>
            </div>
          </dl>
        )}
      </Card>
    </motion.div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Pencil, UserCog } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useUpdateUserSettings } from "@/features/settings/hooks/use-update-user-settings";
import {
  USER_THEME_OPTIONS,
  userSettingsFormSchema,
  type UserSettingsFormValues,
} from "@/features/settings/settings.schema";
import type { UserSettings } from "@/types";
import { staggerItem } from "@/utils/motion";

const THEME_LABEL: Record<UserSettings["theme"], string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

type UserSettingsSectionProps = {
  settings: UserSettings;
};

export function UserSettingsSection({ settings }: UserSettingsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateSettings = useUpdateUserSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserSettingsFormValues>({
    resolver: zodResolver(userSettingsFormSchema),
    defaultValues: settings,
  });

  const startEditing = () => {
    reset(settings);
    setIsEditing(true);
  };

  const onSubmit = (values: UserSettingsFormValues) => {
    updateSettings.mutate(values, { onSuccess: () => setIsEditing(false) });
  };

  return (
    <motion.div variants={staggerItem}>
      <Card hover={false}>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-xl text-accent">
              <UserCog className="h-4 w-4" strokeWidth={1.85} />
            </div>
            <CardTitle>User Settings</CardTitle>
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
              <Select label="Theme" options={USER_THEME_OPTIONS} {...register("theme")} />
              <Input label="Language" error={errors.language?.message} {...register("language")} />
            </div>
            <Checkbox label="Enable notifications" {...register("notificationsEnabled")} />
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
              <dt className="text-xs tracking-wide text-muted uppercase">Theme</dt>
              <dd className="mt-1">
                <Badge variant="accent">{THEME_LABEL[settings.theme]}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Language</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{settings.language}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Notifications</dt>
              <dd className="mt-1">
                <Badge variant={settings.notificationsEnabled ? "success" : "default"}>
                  {settings.notificationsEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </dd>
            </div>
          </dl>
        )}
      </Card>
    </motion.div>
  );
}

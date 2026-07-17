import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useThemeStore } from "@/store/theme-store";

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Workspace preferences for appearance and consulting defaults. Profile and org APIs are not connected yet."
      />

      <Tabs
        items={[
          {
            id: "appearance",
            label: "Appearance",
            content: (
              <Card hover={false}>
                <CardHeader>
                  <div>
                    <CardTitle>Theme</CardTitle>
                    <CardDescription>
                      Preference is stored locally and applied across the app.
                    </CardDescription>
                  </div>
                  <Badge variant="accent">{theme}</Badge>
                </CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={theme === "light" ? "primary" : "secondary"}
                    onClick={() => setTheme("light")}
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "primary" : "secondary"}
                    onClick={() => setTheme("dark")}
                  >
                    Dark
                  </Button>
                </div>
              </Card>
            ),
          },
          {
            id: "workspace",
            label: "Workspace",
            content: (
              <Card hover={false}>
                <CardTitle>Workspace defaults</CardTitle>
                <CardDescription className="mt-2">
                  Organization branding, estimation defaults, and proposal
                  templates will be configured here.
                </CardDescription>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { LocationSettings } from "@/components/settings/location-settings";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState("location");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="location">{t("tabs.location")}</TabsTrigger>
          <TabsTrigger value="appearance">{t("tabs.appearance")}</TabsTrigger>
        </TabsList>

        <TabsContent value="location" className="space-y-4">
          <LocationSettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <div className="text-muted-foreground">
            {t("appearance.description")} (Coming soon)
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

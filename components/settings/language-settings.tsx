"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

export function LanguageSettings() {
  const t = useTranslations("settings.language");
  const locale = useLocale();
  const router = useRouter();

  const handleLanguageChange = (value: string) => {
    // Set cookie and refresh
    document.cookie = `NEXT_LOCALE=${value}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("selectLanguage")}</label>
          <Select value={locale} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full max-w-[200px]">
              <SelectValue placeholder={t("selectLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ko">{t("korean")}</SelectItem>
              <SelectItem value="en">{t("english")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

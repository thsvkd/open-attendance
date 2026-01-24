"use client";

import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("common");

  const switchLanguage = (locale: string) => {
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
      window.location.reload();
    });
  };

  // Getting current locale from cookie
  const currentLocale =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("NEXT_LOCALE="))
          ?.split("=")[1] || "en"
      : "en";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("toggleLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchLanguage("ko")}
          className="flex items-center justify-between"
        >
          KO (한국어)
          {currentLocale === "ko" && <Check className="ml-2 h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLanguage("en")}
          className="flex items-center justify-between"
        >
          EN (English)
          {currentLocale === "en" && <Check className="ml-2 h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

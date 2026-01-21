"use client"

import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();

  const switchLanguage = (locale: string) => {
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
      window.location.reload();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => switchLanguage('en')}
        disabled={isPending}
        className="h-8 px-2"
      >
        EN
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => switchLanguage('ko')}
        disabled={isPending}
        className="h-8 px-2"
      >
        KO
      </Button>
    </div>
  );
}

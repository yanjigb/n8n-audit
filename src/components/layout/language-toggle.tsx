"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs font-medium px-2"
      onClick={() => setLocale(locale === "en" ? "vi" : "en")}
    >
      {locale === "en" ? "VI" : "EN"}
    </Button>
  );
}

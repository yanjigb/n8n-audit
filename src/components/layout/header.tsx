"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, RotateCcw } from "lucide-react";
import { useAuditStore } from "@/stores/audit-store";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { LanguageToggle } from "./language-toggle";

export function Header() {
  const { theme, setTheme } = useTheme();
  const reset = useAuditStore((s) => s.reset);
  const workflow = useAuditStore((s) => s.workflow);
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1
            className="text-lg font-bold tracking-tight cursor-pointer"
            onClick={() => router.push("/")}
          >
            {t("common.appName")}
          </h1>
          {workflow && (
            <span className="text-sm text-muted-foreground">
              / {workflow.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {workflow && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                router.push("/");
              }}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              {t("common.newAudit")}
            </Button>
          )}
          <LanguageToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t("common.toggleTheme")}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

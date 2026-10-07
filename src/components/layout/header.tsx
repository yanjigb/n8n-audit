"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Moon, Sun, RotateCcw, Menu } from "lucide-react";
import { useAuditStore } from "@/stores/audit-store";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { LanguageToggle } from "./language-toggle";
import { Sidebar } from "./sidebar";
import { useState } from "react";

export function Header() {
  const { theme, setTheme } = useTheme();
  const reset = useAuditStore((s) => s.reset);
  const workflow = useAuditStore((s) => s.workflow);
  const router = useRouter();
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 min-w-0">
          {workflow && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          )}
          <h1
            className="text-base md:text-lg font-bold tracking-tight cursor-pointer shrink-0"
            onClick={() => router.push("/")}
          >
            {t("common.appName")}
          </h1>
          {workflow && (
            <span className="hidden sm:inline text-sm text-muted-foreground truncate">
              / {workflow.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {workflow && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                router.push("/");
              }}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">{t("common.newAudit")}</span>
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

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-sm font-semibold">
              {t("common.appName")}
            </SheetTitle>
          </SheetHeader>
          <div onClick={() => setMobileNavOpen(false)}>
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

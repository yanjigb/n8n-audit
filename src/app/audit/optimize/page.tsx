"use client";

import { OptimizationPanel } from "@/components/optimize/optimization-panel";
import { useTranslation } from "@/lib/i18n";

export default function OptimizePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 ">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{t("optimize.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("optimize.subtitle")}
        </p>
      </div>
      <OptimizationPanel />
    </div>
  );
}

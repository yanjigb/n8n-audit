"use client";

import { useAuditStore } from "@/stores/audit-store";
import { FindingList } from "@/components/audit/finding-list";
import { ScoreRing } from "@/components/audit/score-ring";
import { useTranslation } from "@/lib/i18n";

export default function ErrorHandlingPage() {
  const { t } = useTranslation();
  const auditResult = useAuditStore((s) => s.auditResult);
  if (!auditResult) return null;

  const category = auditResult.categories["error-handling"];

  return (
    <div className="space-y-6 ">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t("category.error-handling")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("category.error-handling.desc")}
          </p>
        </div>
        <ScoreRing score={category.score} size={80} strokeWidth={6} />
      </div>
      <FindingList findings={category.findings} />
    </div>
  );
}

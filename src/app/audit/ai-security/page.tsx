"use client";

import { useAuditStore } from "@/stores/audit-store";
import { FindingList } from "@/components/audit/finding-list";
import { ScoreRing } from "@/components/audit/score-ring";
import { useTranslation } from "@/lib/i18n";

export default function AiSecurityPage() {
  const { t } = useTranslation();
  const auditResult = useAuditStore((s) => s.auditResult);
  if (!auditResult) return null;

  const category = auditResult.categories["ai-security"] ?? {
    score: 100,
    findings: [],
  };

  return (
    <div className="space-y-6 ">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t("category.ai-security")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("category.ai-security.desc")}
          </p>
        </div>
        <ScoreRing score={category.score} size={80} strokeWidth={6} />
      </div>
      <FindingList findings={category.findings} />
    </div>
  );
}

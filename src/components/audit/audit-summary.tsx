"use client";

import type { AuditResult } from "@/types/audit";
import { ScoreRing } from "./score-ring";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface AuditSummaryProps {
  result: AuditResult;
}

export function AuditSummary({ result }: AuditSummaryProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6 py-6">
        <ScoreRing score={result.overallScore} size={140} strokeWidth={10} label={t("audit.overallScore")} />
        <div className="flex-1 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-red-500">
              {result.criticalFindings}
            </p>
            <p className="text-xs text-muted-foreground">{t("audit.critical")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-500">
              {result.warningFindings}
            </p>
            <p className="text-xs text-muted-foreground">{t("audit.warnings")}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-muted-foreground">
              {result.infoFindings}
            </p>
            <p className="text-xs text-muted-foreground">{t("audit.info")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

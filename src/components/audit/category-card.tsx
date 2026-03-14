"use client";

import type { AuditCategory, CategoryScore } from "@/types/audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRing } from "./score-ring";
import {
  AlertTriangle,
  Zap,
  Shield,
  BookOpen,
  Brain,
  Fingerprint,
  ClipboardCheck,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_LABEL_KEYS } from "@/lib/audit/constants";
import { useTranslation } from "@/lib/i18n";

const CATEGORY_ICONS: Record<AuditCategory, LucideIcon> = {
  "error-handling": AlertTriangle,
  performance: Zap,
  security: Shield,
  "best-practices": BookOpen,
  "ai-security": Brain,
  "data-privacy": Fingerprint,
  compliance: ClipboardCheck,
  "vendor-risk": Link2,
};

interface CategoryCardProps {
  data: CategoryScore;
  onClick?: () => void;
}

export function CategoryCard({ data, onClick }: CategoryCardProps) {
  const Icon = CATEGORY_ICONS[data.category];
  const { t } = useTranslation();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">
          {t(CATEGORY_LABEL_KEYS[data.category])}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <ScoreRing score={data.score} size={72} strokeWidth={6} />
        <div className="text-right text-xs space-y-1">
          {data.criticalCount > 0 && (
            <p className="text-red-500">{data.criticalCount} {t("audit.critical")}</p>
          )}
          {data.warningCount > 0 && (
            <p className="text-yellow-500">{data.warningCount} {t("audit.warnings")}</p>
          )}
          {data.infoCount > 0 && (
            <p className="text-muted-foreground">{data.infoCount} {t("audit.info")}</p>
          )}
          {data.findings.length === 0 && (
            <p className="text-green-500">{t("audit.noIssuesShort")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

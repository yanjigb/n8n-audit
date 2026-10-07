"use client";

import type { AuditResult } from "@/types/audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface WorkflowInfoProps {
  meta: AuditResult["workflowMeta"];
}

export function WorkflowInfo({ meta }: WorkflowInfoProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{t("workflowInfo.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">{t("workflowInfo.name")}</p>
          <p className="font-medium truncate">{meta.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("workflowInfo.nodes")}</p>
          <p className="font-medium">{meta.nodeCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("workflowInfo.connections")}</p>
          <p className="font-medium">{meta.connectionCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("workflowInfo.active")}</p>
          <p className="font-medium">{meta.isActive ? t("common.yes") : t("common.no")}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("workflowInfo.errorWorkflow")}</p>
          <p className="font-medium">
            {meta.hasErrorWorkflow ? t("common.configured") : t("common.notSet")}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("workflowInfo.complexity")}</p>
          <p className="font-medium">{meta.complexityScore}</p>
        </div>
      </CardContent>
    </Card>
  );
}

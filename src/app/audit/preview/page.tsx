"use client";

import { useAuditStore } from "@/stores/audit-store";
import { WorkflowGraph } from "@/components/graph/workflow-graph";
import { useTranslation } from "@/lib/i18n";

export default function PreviewPage() {
  const { t } = useTranslation();
  const workflow = useAuditStore((s) => s.workflow);
  const auditResult = useAuditStore((s) => s.auditResult);

  if (!workflow) return null;

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-7.5rem)]">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{t("preview.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("preview.subtitle")}
        </p>
      </div>
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm border-2 border-red-500" />
          {t("preview.critical")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm border-2 border-yellow-500" />
          {t("preview.warning")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm border-2 border-border" />
          {t("preview.clean")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
          <span className="border-b border-dashed border-red-500 w-4" />
          {t("preview.errorPath")}
        </span>
      </div>
      <WorkflowGraph workflow={workflow} auditResult={auditResult} />
    </div>
  );
}
